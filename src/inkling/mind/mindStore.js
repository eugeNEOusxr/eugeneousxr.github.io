/**
 * Inkling Mind — live bridge between the cognitive core and persistence.
 *
 * The in-memory cognition graph (cognition.js) is rebuilt from the immutable
 * Layer-0 conversation log (the source of truth) on first use, then kept warm
 * and persisted to the IndexedDB graph stores (graph.js shape) as new turns
 * arrive. This is WordWeaver wired into the running app: every real chat turn
 * grows the on-device knowledge graph. No network, no LLM key.
 */
import { createMind, ingestTurn, insights, snapshot, linkConcepts, addGoalNode, mergeConcepts, hydrate } from "./cognition.js";
import { recentTurns } from "./conversations.js";
import { putMany } from "./db.js";
import { scheduleCloudSync } from "../../auth/cloudSync.js";

let _mind = null;
let _ready = null;

// The graph is mirrored to this localStorage key so the account-sync bundle
// (BUNDLE_KEYS.mind in cloudSync.js) carries it to the server — making the Mind
// durable across cache clears and devices, not just on-device IndexedDB.
const SNAPSHOT_KEY = "inkling:mind-snapshot-v1";

function writeSyncSnapshot() {
  if (!_mind || typeof localStorage === "undefined") return;
  try {
    const snap = snapshot(_mind);
    if (snap.nodes.length > 4000) return; // keep within localStorage / bundle limits
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), nodes: snap.nodes, edges: snap.edges }));
  } catch { /* quota / serialization — non-fatal */ }
}

function readSyncSnapshot() {
  if (typeof localStorage === "undefined") return null;
  try {
    const obj = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "null");
    if (obj && Array.isArray(obj.nodes) && obj.nodes.length) return obj;
  } catch { /* ignore */ }
  return null;
}

/**
 * Bring the graph into memory. Prefer a saved snapshot (carries AI-enriched
 * nodes AND survives cache clears via account sync); otherwise replay the local
 * conversation log through the lexicon.
 */
async function ensureReady() {
  if (_ready) return _ready;
  _ready = (async () => {
    const saved = readSyncSnapshot();
    if (saved) {
      _mind = hydrate(saved);
      try { await persist(); } catch { /* ignore */ }
      return _mind;
    }
    _mind = createMind();
    try {
      const turns = await recentTurns(0); // 0 = all, oldest→newest
      for (const t of turns) {
        ingestTurn(_mind, { sessionId: t.sessionId, speaker: t.speaker, text: t.content, ts: t.ts });
      }
      await persist();
    } catch {
      /* engine must never break the app */
    }
    return _mind;
  })();
  return _ready;
}

/** Persist nodes + edges to IndexedDB, mirror to the sync snapshot, and queue an account push. */
async function persist() {
  if (!_mind) return;
  const { nodes, edges } = snapshot(_mind);
  try {
    await Promise.all([putMany("nodes", nodes), putMany("edges", edges)]);
  } catch {
    /* ignore persistence failures */
  }
  writeSyncSnapshot();
  try { scheduleCloudSync(); } catch { /* not signed in → no-op */ }
}

/**
 * Ingest one live turn (called right after Layer-0 capture).
 * @param {{ sessionId:string, speaker?:string, content:string, ts?:number }} t
 */
export async function ingestText(t) {
  await ensureReady();
  if (!t?.content) return null;
  const delta = ingestTurn(_mind, { sessionId: t.sessionId, speaker: t.speaker, text: t.content, ts: t.ts });
  await persist();
  return delta; // { ids, addedNodes, addedEdges }
}

/**
 * Connect the calendar to memory: weave the user's note/event text into the
 * graph. Only recognized concepts become nodes (extractConcepts is the filter),
 * so generic events are ignored — no flooding from the starter seed.
 * @returns {Promise<{count:number, added:string[]}>}
 */
export async function ingestCalendar(limit = 200) {
  await ensureReady();
  let notes = [];
  try {
    const tl = await import("../../wordweaver/timelineModel.js");
    notes = tl.loadUserNotes?.() || [];
  } catch { return { count: 0, added: [] }; }
  const recent = notes.slice(-limit);
  const added = new Set();
  for (const n of recent) {
    const text = (n?.text || "").trim();
    if (!text) continue;
    const ts = Date.parse(`${n.date || ""}T${n.time || "00:00"}`) || Date.now();
    const d = ingestTurn(_mind, { sessionId: "calendar", speaker: "calendar", text, ts });
    d.addedNodes.forEach((l) => added.add(l));
  }
  await persist();
  return { count: recent.length, added: [...added] };
}

/**
 * Stage 2b — enrich a turn via the server's Claude Haiku extractor so the Mind
 * maps concepts the local lexicon misses. No-ops (returns empty) when the
 * backend is absent or has no API key, so local capture always still works.
 * @returns {Promise<{addedNodes:string[], addedEdges:[string,string][]}>}
 */
export async function enrichFromServer(text) {
  await ensureReady();
  const clean = (text || "").trim();
  if (clean.length < 6) return { addedNodes: [], addedEdges: [] };
  let data = null;
  try {
    const { apiFetch } = await import("../../auth/cloudSync.js");
    data = await apiFetch("/api/inkling/extract", { method: "POST", body: JSON.stringify({ text: clean }) });
  } catch { return { addedNodes: [], addedEdges: [] }; }
  if (!data?.concepts?.length) return { addedNodes: [], addedEdges: [] };
  const delta = mergeConcepts(_mind, data.concepts, data.relations || [], "ai");
  if (delta.addedNodes.length || delta.addedEdges.length) await persist();
  return delta;
}

/** Weave your goals into the graph as distinct goal nodes. */
export async function ingestGoals() {
  await ensureReady();
  let goals = [];
  try {
    const gm = await import("../../calendar/goals/goalsModel.js");
    goals = gm.loadGoals?.() || [];
  } catch { return { count: 0 }; }
  for (const g of goals) {
    if (g?.text) addGoalNode(_mind, g.text, { category: g.category, horizon: g.horizon, status: g.status });
  }
  await persist();
  return { count: goals.length };
}

/** Pull in everything outside chat — calendar notes + goals — then return the graph. */
export async function syncSources() {
  await ensureReady();
  try { await ingestCalendar(); } catch { /* ignore */ }
  try { await ingestGoals(); } catch { /* ignore */ }
  return snapshot(_mind);
}

/** Manually connect two concepts (Inkling's "connect X and Y") + persist. */
export async function connectConcepts(aLabel, bLabel) {
  await ensureReady();
  const r = linkConcepts(_mind, aLabel, bLabel);
  await persist();
  return r;
}

/** Current insights (central / recurring / emerging / suggestions / contradictions). */
export async function mindInsights() {
  await ensureReady();
  return insights(_mind);
}

/** Current graph snapshot for viewers. */
export async function mindGraph() {
  await ensureReady();
  return snapshot(_mind);
}

/** Force a rebuild (e.g. after import or clear). */
export function resetMindStore() {
  _mind = null;
  _ready = null;
}

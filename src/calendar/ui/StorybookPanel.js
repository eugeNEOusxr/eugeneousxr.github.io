/**
 * StorybookPanel — the narrative layer over Inkling's structured data.
 *
 * It never stores anything of its own. It reads the timeline (notes + events)
 * and goals, then composes a readable chapter for a chosen time range and
 * narrative perspective — a "camera looking at the knowledge graph." Everything
 * it says is template-generated from real entries and traceable back to them
 * (Evidence), so the story is always explainable and works offline / for guests.
 *
 * v1 scope: day / week / month / all ranges · Biographer / Documentarian /
 * Project Manager perspectives · chapters + reflection + evidence. Deferred:
 * AI polish, export formats, sharing, follow-up-writes-nodes, auto-chaptering.
 */
import { loadTimeline, getCategoryColor } from "../../wordweaver/timelineModel.js";
import { loadGoals } from "../goals/goalsModel.js";

const DAY = 86400000;

const RANGES = [
  ["today", "Today"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["all", "All time"]
];
const PERSPECTIVES = [
  ["biographer", "Biographer"],
  ["documentarian", "Documentarian"],
  ["projects", "Project Manager"]
];

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function sameDay(a, b) { return startOfDay(a).getTime() === startOfDay(b).getTime(); }
function fmtDay(d) { return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }
function fmtMonth(d) { return d.toLocaleDateString(undefined, { month: "long", year: "numeric" }); }
function titleCase(s) { return String(s || "").replace(/\b\w/g, (c) => c.toUpperCase()); }

/** Weave a few entry titles into natural prose. */
function weave(titles) {
  const t = titles.map((x) => `“${x}”`);
  if (t.length === 0) return "";
  if (t.length === 1) return t[0] + ".";
  if (t.length === 2) return t[0] + " and " + t[1] + ".";
  if (t.length === 3) return t[0] + ", " + t[1] + ", and " + t[2] + ".";
  return t[0] + ", " + t[1] + ", and " + (t.length - 2) + " more.";
}

export class StorybookPanel {
  constructor() {
    this._panel = null;
    this._body = null;
    this._range = "7d";
    this._persp = "biographer";
    this._onClose = null;
  }

  _readEntries() {
    let all = [];
    try { all = loadTimeline() || []; } catch { all = []; }
    // loadTimeline() returns a render shape: { date:"YYYY-MM-DD", time:"HH:MM",
    // text, label, category, startTime? }. Build a real Date from date+time (or
    // startTime if present) and normalize to { when, title, category }.
    return all
      .map((e) => {
        let when = null;
        if (e.startTime) { const d = new Date(e.startTime); if (!isNaN(d.getTime())) when = d; }
        if (!when && e.date) {
          const t = String(e.time || "09:00");
          const hhmm = /^\d{1,2}:\d{2}/.test(t) ? t.padStart(5, "0") : "09:00";
          const d = new Date(String(e.date) + "T" + hhmm + ":00");
          if (!isNaN(d.getTime())) when = d;
        }
        if (!when) return null;
        const text = String(e.text || e.title || "").trim();
        const label = String(e.label || "").trim();
        let title = text || (label && label.toLowerCase() !== "note" ? label : "") || "A note";
        if (title.length > 72) title = title.slice(0, 72).trim() + "…";
        return { when, title, body: e.body || "", category: String(e.category || "personal").toLowerCase() };
      })
      .filter(Boolean)
      .sort((a, b) => a.when - b.when);
  }

  _inRange(entries) {
    const now = Date.now();
    if (this._range === "all") return entries.slice();
    if (this._range === "today") return entries.filter((e) => sameDay(e.when, new Date()));
    const span = this._range === "7d" ? 7 * DAY : 30 * DAY;
    return entries.filter((e) => e.when.getTime() >= now - span);
  }

  /** Bucket entries at a granularity that keeps chapter count sane. */
  _bucket(entries) {
    const gran = this._range === "today" ? "one" : this._range === "7d" ? "day" : this._range === "30d" ? "week" : "month";
    const map = new Map();
    for (const e of entries) {
      let key, label, sort;
      if (gran === "one") { key = "today"; label = fmtDay(e.when); sort = 0; }
      else if (gran === "day") { const d = startOfDay(e.when); key = d.toISOString(); label = fmtDay(d); sort = d.getTime(); }
      else if (gran === "week") {
        const d = startOfDay(e.when); const wk = Math.floor(d.getTime() / (7 * DAY));
        key = "w" + wk; label = "Week of " + fmtDay(new Date(wk * 7 * DAY)); sort = wk;
      } else { const d = e.when; key = d.getFullYear() + "-" + d.getMonth(); label = fmtMonth(d); sort = d.getFullYear() * 12 + d.getMonth(); }
      if (!map.has(key)) map.set(key, { label, sort, items: [] });
      map.get(key).items.push(e);
    }
    return [...map.values()].sort((a, b) => a.sort - b.sort);
  }

  _topCategory(items) {
    const counts = {};
    for (const e of items) counts[e.category] = (counts[e.category] || 0) + 1;
    let best = null, n = 0;
    for (const k in counts) if (counts[k] > n) { n = counts[k]; best = k; }
    return best;
  }

  _story(entries, goals) {
    const rangeLabel = (RANGES.find((r) => r[0] === this._range) || [])[1].toLowerCase();
    const buckets = this._bucket(entries);
    const total = entries.length;
    const activeGoals = goals.filter((g) => g.status === "active");

    // Opening line by perspective.
    const openers = {
      biographer: `This is the story of your ${rangeLabel}, told as a life in motion — ${total} moments, and the shape they made together.`,
      documentarian: `A factual account of your ${rangeLabel}, drawn from ${total} logged ${total === 1 ? "entry" : "entries"}.`,
      projects: `Your ${rangeLabel} in review — what moved, what recurred, and what's still open.`
    };

    const chapters = buckets.map((b) => {
      const topCat = this._topCategory(b.items);
      const catColor = getCategoryColor(topCat) || "#a5b4fc";
      const titles = b.items.map((e) => e.title);
      const shown = titles.slice(0, 4);
      let para;
      if (this._persp === "documentarian") {
        para = `${b.items.length} ${b.items.length === 1 ? "entry" : "entries"}, mostly <b>${esc(topCat)}</b>: ` + weave(shown);
      } else if (this._persp === "projects") {
        para = `Focus area: <b>${esc(titleCase(topCat))}</b>. On the board — ` + weave(shown);
      } else {
        para = `The stretch leaned toward <b>${esc(topCat)}</b>. ` + weave(shown).replace(/\.$/, "") + " — small entries that, together, say where your attention went.";
      }
      return { label: b.label, color: catColor, para, evidence: b.items };
    });

    // Reflection — patterns, not a list.
    const catTotals = {};
    for (const e of entries) catTotals[e.category] = (catTotals[e.category] || 0) + 1;
    const topOverall = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0];
    const busiest = buckets.slice().sort((a, b) => b.items.length - a.items.length)[0];
    const daysActive = new Set(entries.map((e) => startOfDay(e.when).getTime())).size;
    const reflect = [];
    if (topOverall) reflect.push(`Your attention gravitated toward <b>${esc(titleCase(topOverall))}</b> — it ran through more of this ${rangeLabel} than anything else.`);
    if (busiest && buckets.length > 1) reflect.push(`The fullest stretch was <b>${esc(busiest.label)}</b>, with ${busiest.items.length} ${busiest.items.length === 1 ? "entry" : "entries"}.`);
    reflect.push(`Across ${daysActive} active ${daysActive === 1 ? "day" : "days"}, ${total} ${total === 1 ? "moment was" : "moments were"} worth writing down.`);
    if (activeGoals.length) reflect.push(`You're carrying <b>${activeGoals.length} active ${activeGoals.length === 1 ? "goal" : "goals"}</b> — the days above are the raw material they're built from.`);

    return { opener: openers[this._persp], chapters, reflect, total };
  }

  _render() {
    if (!this._body) return;
    const entries = this._inRange(this._readEntries());
    const goals = (() => { try { return loadGoals() || []; } catch { return []; } })();
    const rangeLabel = (RANGES.find((r) => r[0] === this._range) || [])[1];
    const perspLabel = (PERSPECTIVES.find((p) => p[0] === this._persp) || [])[1];

    if (!entries.length) {
      this._body.innerHTML =
        `<div class="sb-page"><div class="sb-eyebrow">Storybook · ${esc(perspLabel)}</div>` +
        `<h1 class="sb-h1">A blank page — for now</h1>` +
        `<p class="sb-lead">Your ${esc(rangeLabel.toLowerCase())} hasn't been written yet. Jot a few notes in the Schedule, and this story starts composing itself from them.</p>` +
        (goals.length ? `<p class="sb-p">You do have <b>${goals.length}</b> ${goals.length === 1 ? "goal" : "goals"} waiting — the moments you log will begin to connect back to them.</p>` : "") +
        `</div>`;
      return;
    }

    const s = this._story(entries, goals);
    let html = `<div class="sb-page">`;
    html += `<div class="sb-eyebrow">Storybook · ${esc(perspLabel)} · ${esc(rangeLabel)}</div>`;
    html += `<h1 class="sb-h1">Your ${esc(rangeLabel.toLowerCase())}, as a chapter</h1>`;
    html += `<p class="sb-lead">${esc(s.opener)}</p>`;

    for (const c of s.chapters) {
      html += `<section class="sb-chap">`;
      html += `<div class="sb-chap-head" style="border-color:${c.color}"><span class="sb-dot" style="background:${c.color}"></span>${esc(c.label)}</div>`;
      html += `<p class="sb-p">${c.para}</p>`;
      html += `<details class="sb-ev"><summary>Evidence · ${c.evidence.length} ${c.evidence.length === 1 ? "entry" : "entries"}</summary>`;
      html += `<div class="sb-ev-list">` + c.evidence.map((e) =>
        `<div class="sb-ev-row"><span class="sb-ev-time">${e.when.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span><span>${esc(e.title)}</span></div>`
      ).join("") + `</div></details>`;
      html += `</section>`;
    }

    html += `<section class="sb-reflect"><div class="sb-eyebrow" style="color:#5ecdb4">Reflection</div>` +
      s.reflect.map((r) => `<p class="sb-p">${r}</p>`).join("") + `</section>`;

    html += `<p class="sb-foot">A Storybook chapter · composed from ${s.total} real ${s.total === 1 ? "entry" : "entries"}, never written by hand. As you add more, it grows.</p>`;
    html += `</div>`;
    this._body.innerHTML = html;
  }

  _injectStyles() {
    if (document.getElementById("storybook-styles")) return;
    const st = document.createElement("style");
    st.id = "storybook-styles";
    st.textContent = `
      #inkling-storybook{position:fixed;inset:0;z-index:11086;display:none;flex-direction:column;
        background:rgba(4,6,14,.94);backdrop-filter:blur(10px);color:#e8eaf7;
        font-family:Georgia,"Iowan Old Style","Palatino Linotype",serif}
      #inkling-storybook .sb-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;
        justify-content:space-between;gap:10px;padding:13px 16px;border-bottom:1px solid rgba(165,180,252,.22);
        background:rgba(6,9,18,.9)}
      #inkling-storybook .sb-title{font:800 18px system-ui;letter-spacing:.3px;color:#c7d2fe;display:flex;gap:8px;align-items:center}
      #inkling-storybook .sb-x{background:#1e223a;color:#e8eaf7;border:0;border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:15px}
      #inkling-storybook .sb-controls{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;
        padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(6,9,18,.6)}
      #inkling-storybook .sb-chip{background:rgba(165,180,252,.1);border:1px solid rgba(165,180,252,.3);
        color:#c7d2fe;border-radius:999px;padding:5px 13px;font:700 12px system-ui;cursor:pointer}
      #inkling-storybook .sb-chip.on{background:rgba(165,180,252,.28);border-color:#a5b4fc;color:#eef1ff}
      #inkling-storybook .sb-sel{margin-left:auto;background:#0f1226;color:#e8eaf7;border:1px solid rgba(165,180,252,.3);
        border-radius:8px;padding:6px 10px;font:700 12px system-ui;cursor:pointer}
      #inkling-storybook .sb-scroll{flex:1;overflow:auto;padding:26px 18px 60px}
      #inkling-storybook .sb-page{max-width:720px;margin:0 auto;background:rgba(18,21,42,.72);
        border:1px solid rgba(165,180,252,.18);border-radius:16px;padding:clamp(24px,5vw,52px);
        box-shadow:0 30px 70px -34px rgba(0,0,0,.7)}
      #inkling-storybook .sb-eyebrow{font:700 11px system-ui;letter-spacing:.22em;text-transform:uppercase;color:#a5b4fc;margin-bottom:12px}
      #inkling-storybook .sb-h1{font-weight:700;font-size:clamp(1.9rem,5vw,2.7rem);line-height:1.08;margin:0 0 6px;letter-spacing:-.01em}
      #inkling-storybook .sb-lead{font-size:1.16rem;line-height:1.6;font-style:italic;color:#e8eaf7;margin:14px 0 8px;max-width:56ch}
      #inkling-storybook .sb-p{font-size:1.09rem;line-height:1.75;color:#aab0cf;margin:.6rem 0;max-width:62ch}
      #inkling-storybook .sb-p b{color:#e8eaf7;font-weight:600}
      #inkling-storybook .sb-chap{margin-top:26px}
      #inkling-storybook .sb-chap-head{font:700 .78rem system-ui;letter-spacing:.14em;text-transform:uppercase;
        color:#e8eaf7;display:flex;align-items:center;gap:9px;padding-left:11px;border-left:3px solid #a5b4fc}
      #inkling-storybook .sb-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto}
      #inkling-storybook .sb-ev{margin-top:8px}
      #inkling-storybook .sb-ev summary{font:700 11px system-ui;color:#6b7099;cursor:pointer;letter-spacing:.04em;list-style:none}
      #inkling-storybook .sb-ev summary::-webkit-details-marker{display:none}
      #inkling-storybook .sb-ev-list{margin-top:8px;display:flex;flex-direction:column;gap:5px}
      #inkling-storybook .sb-ev-row{display:flex;gap:12px;font:600 12.5px system-ui;color:#aab0cf}
      #inkling-storybook .sb-ev-time{color:#6b7099;min-width:118px;font-variant-numeric:tabular-nums}
      #inkling-storybook .sb-reflect{margin-top:34px;background:rgba(94,205,180,.07);
        border:1px solid rgba(94,205,180,.28);border-radius:14px;padding:20px 22px}
      #inkling-storybook .sb-foot{margin-top:28px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1);
        font:600 12px system-ui;color:#6b7099;text-align:center;line-height:1.6}
    `;
    document.head.appendChild(st);
  }

  _build() {
    if (this._panel) return;
    this._injectStyles();
    const panel = document.createElement("div");
    panel.id = "inkling-storybook";

    const bar = document.createElement("div");
    bar.className = "sb-bar";
    const title = document.createElement("div");
    title.className = "sb-title";
    title.innerHTML = "📖 <span>Storybook</span>";
    const x = document.createElement("button");
    x.className = "sb-x"; x.textContent = "✕"; x.setAttribute("aria-label", "Close Storybook");
    x.addEventListener("click", () => this.hide());
    bar.append(title, x);

    const controls = document.createElement("div");
    controls.className = "sb-controls";
    for (const [val, label] of RANGES) {
      const chip = document.createElement("button");
      chip.className = "sb-chip" + (val === this._range ? " on" : "");
      chip.textContent = label; chip.dataset.range = val;
      chip.addEventListener("click", () => {
        this._range = val;
        controls.querySelectorAll(".sb-chip").forEach((c) => c.classList.toggle("on", c.dataset.range === val));
        this._render();
      });
      controls.appendChild(chip);
    }
    const sel = document.createElement("select");
    sel.className = "sb-sel"; sel.setAttribute("aria-label", "Narrative perspective");
    for (const [val, label] of PERSPECTIVES) { const o = document.createElement("option"); o.value = val; o.textContent = label + " view"; sel.appendChild(o); }
    sel.value = this._persp;
    sel.addEventListener("change", () => { this._persp = sel.value; this._render(); });
    controls.appendChild(sel);

    const scroll = document.createElement("div");
    scroll.className = "sb-scroll";
    this._body = scroll;

    panel.append(bar, controls, scroll);
    document.body.appendChild(panel);
    this._panel = panel;
  }

  show(opts = {}) {
    this._build();
    this._onClose = opts.onClose || null;
    this._render();
    this._panel.style.display = "flex";
    this._body.scrollTop = 0;
  }

  hide(opts = {}) {
    if (this._panel) this._panel.style.display = "none";
    const cb = this._onClose;
    this._onClose = null;
    if (!opts.silent) cb?.();
  }
}

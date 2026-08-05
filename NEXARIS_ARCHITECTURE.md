# NEXARIS — the Cognitive OS behind Inkling
**Production-grade architecture · north-star v1 · 2026-08-04**

NEXARIS is not a chatbot. It is a **modular, self-improving intelligence** that can
build and refactor software, run experiments, measure results, and grow a knowledge
graph — while staying **transparent, explainable, versioned, reversible, and always
under explicit human control.**

> This document is the *foundation blueprint*. It is deliberately un-simplified. It
> evolves from what already exists — Inkling's knowledge graph, the three-app suite,
> the wired backend, and the agent-style AI passes — toward a platform meant to last
> years. Where something is "today" it is marked; everything else is the target.

---

## 0. The Prime Directive (non-negotiable)

**The user always has final authority. NEXARIS never modifies production code, data,
or configuration without explicit, per-change human approval.** Every mutating action
passes through an **Approval Gate**: a diff/plan is *proposed*, the human *approves,
edits, or rejects*, and only then is it applied — to a versioned, reversible store.

Two agents exist solely to protect this: the **User Intent Guardian** (checks every
plan against your stated goals before execution) and the **Approval Gate** (the last
stop before any write). If either is uncertain, it stops and asks.

## 1. Core philosophy — four questions per component

Every module, decision, and node must answer:
1. **Why does this exist?** (purpose)
2. **What evidence supports it?** (measurement, provenance)
3. **How can it be improved?** (hypotheses)
4. **How can it be replaced?** (the exit path)

Invariants: *Nothing is permanent. Everything is measurable. Everything is versioned.
Every decision is reversible. Never assume — measure. Never overwrite history.*

---

## 2. Agent architecture — many specialists, one conductor

No single giant model. A **swarm of narrow agents** coordinated by an **Orchestrator**
(the kernel scheduler). Each agent is a plugin implementing a common contract:
`propose(task, context) → Proposal` and `explain() → Rationale`. Agents never write
directly — they emit **Proposals** onto the event bus; only the Approval Gate applies.

| Agent | Role | Reads | Emits |
|---|---|---|---|
| **Architect** | designs system structure | graph, metrics | design proposals |
| **Planner** | goal → executable task DAG | intent, graph | task graph |
| **Researcher** | finds docs, compares approaches | web, graph | evidence bundles |
| **Programmer** | writes production code | plan, repo | code diffs (proposals) |
| **Reviewer** | bugs, inefficiency, security | diffs | findings + risk |
| **Tester** | authors + runs automated tests | diffs | test suites + results |
| **Evaluator** | measures vs. previous versions | metrics store | benchmark verdicts |
| **Memory Manager** | maintains the knowledge graph | everything | node/edge writes (gated) |
| **Reflection** | why it succeeded/failed → lessons | run history | lesson nodes |
| **User Intent Guardian** | aligns every action to goals | intent, plan | allow / block / clarify |

Agents are **hot-swappable** and **self-registering** (§8). Any can run on a local or
cloud model; the provider is a plugin, never hardcoded.

*Today:* the "AI passes" in Inkling (summaries, concept/relationship extraction,
narration) are proto-agents — batched, evidence-in / proposal-out. NEXARIS formalizes
them under the Orchestrator + Approval Gate.

## 3. Agent communication protocol

- **Transport:** the event bus (§7). Agents are decoupled; they subscribe to topics.
- **Envelope (every message):**
  ```jsonc
  { "id","causationId","correlationId","from","to?","topic","ts",
    "kind": "task|proposal|evidence|result|lesson|approval|veto",
    "payload": {...},
    "explain": { "why","alternatives":[],"confidence":0..1,"evidence":[nodeIds],
                 "tradeoffs":[],"risks":[] } }
  ```
  The `explain` block is **mandatory** — no action is emitted without it (§12).
- **Turn shape:** Intent → Planner emits `task` DAG → agents emit `proposal`s +
  `evidence` → Reviewer/Tester/Evaluator attach `result`s → Guardian emits `approval`
  request → **human** approves → Approval Gate applies → Reflection emits `lesson`.
- **Idempotency & tracing:** every message carries `causationId`/`correlationId` for a
  full, replayable audit trail.

## 4. The Knowledge Graph — the single source of memory

Everything is a **node**: concepts, projects, files, functions, people, ideas, papers,
bugs, solutions, questions, conversations, goals, decisions, agents, experiments,
metrics, lessons.

**Node schema:**
```jsonc
{ "id","type","label","summary",
  "importance":0..1, "confidence":0..1,
  "evidence":[nodeIds|urls], "embedding":[...],
  "tags":[], "firstSeen","lastSeen",
  "revisions":[{v,ts,by,change,prevHash}],   // never overwrite — append
  "futureQuestions":[], "state":"open|closed|emergent|deprecated" }
```
**Edges are typed + directional + weighted, and carry provenance:**
`inspired · evolved_into · depends_on · part_of · enables · contradicts · answers ·
references · built_upon · introduced · revisited · supports · challenges ·
occurred_before/after · continuation_of` — each `{from,to,rel,strength,evidence,ts}`.

**Implementation:** a property graph. *Today* the graph lives client-side
(`localStorage["inkling-mind-v1"]`) with in-browser TF-IDF vectors + AI-extracted
node types and labeled edges. *Target:* a server **graph database** (Neo4j / a
Postgres+`pgvector` property-graph) with real embeddings for semantic recall, mirrored
to the client for offline. Migration path: the client store already emits the exact
node/edge shape above.

## 5. Memory architecture — layered, all graph-linked

| Layer | Holds | Lifetime |
|---|---|---|
| **Working** | the current task's scratch state | the turn |
| **Conversation** | the running dialogue (the shared orb transcript) | session→graph |
| **Project** | files, decisions, tasks, metrics for one project | project |
| **Long-Term Knowledge** | the consolidated graph | permanent (versioned) |
| **Procedural** | *how* to do things — playbooks, successful patterns | permanent |
| **Semantic** | concepts + embeddings for recall | permanent |
| **Personal Preferences** | who the user is, how they work | permanent |

Consolidation is a background job (Memory Manager + Reflection): working/conversation
memory is distilled into lessons and semantic nodes, **appended** (never overwritten),
with links back to their source.

## 6. Database schema (target, property-graph + relational spine)

```sql
node(id PK, type, label, summary, importance, confidence, state,
     embedding VECTOR, first_seen, last_seen, tags JSONB)
node_revision(id PK, node_id FK, v, ts, author, change JSONB, prev_hash)   -- append-only
edge(id PK, from_id FK, to_id FK, rel, strength, evidence JSONB, ts)
evidence(id PK, node_id FK, kind, ref, snippet, ts)
proposal(id PK, agent, kind, diff JSONB, explain JSONB, status, ts)         -- pending|approved|rejected|applied
approval(id PK, proposal_id FK, decision, user_id, ts, note)                 -- the human record
experiment(id PK, hypothesis, plan JSONB, baseline_id, ts)
run(id PK, experiment_id FK, metrics JSONB, verdict, ts)
lesson(id PK, run_id FK, summary, applies_to JSONB, confidence, ts)
metric(id PK, name, value, unit, subject_id, ts)
event(id PK, topic, envelope JSONB, ts)                                     -- the immutable log
```
Rules: `node_revision`, `approval`, and `event` are **append-only** (the audit spine).
Nothing is hard-deleted — `state='deprecated'` instead.

## 7. Event bus — the nervous system

- A durable, ordered **append-only log** (start: Postgres `event` table / Redis
  Streams; scale: NATS/Kafka). Every action is an event → full replay & time-travel.
- Topics per concern (`task.*`, `proposal.*`, `graph.*`, `run.*`, `approval.*`).
- Agents are pure subscribers/publishers → total decoupling, trivial to add/remove.
- The bus **is** the audit trail (Explainability §12 reads it).

## 8. Plugin system — no hardcoded intelligence

- Everything — agents, tools, LLM providers, memory stores, visualizers — is a
  **plugin** implementing a versioned interface and a **manifest**:
  ```jsonc
  { "name","version","kind":"agent|tool|provider|store|view",
    "provides":[capabilities], "requires":[capabilities],
    "config":{schema}, "entry":"...", "replaces?":"name@range" }
  ```
- **Self-registration:** on load a plugin announces its capabilities to a **Registry**;
  the Orchestrator resolves capabilities → plugins at runtime. Swap a Programmer agent
  or an LLM provider by registering a better one — no core change.
- **Providers:** OpenAI-compatible, Anthropic, and **local** (offline-first) all behind
  one `LlmProvider` capability. *Today:* the backend `LlmService` already abstracts
  Anthropic / OpenAI-compat / mock — the seed of this.

## 9. API design

- **Gateway:** REST for CRUD + auth; **WebSocket/SSE** for the live event stream
  (agents' thinking, streaming proposals). GraphQL optional for graph queries.
- Core routes: `/intents` (submit a goal), `/proposals` (list/approve/reject),
  `/graph` (query/traverse/search), `/experiments`, `/runs`, `/metrics`,
  `/plugins` (register/list), `/explain/:id` (the decision record).
- **Every mutation returns a Proposal, not a mutation** — the write happens only after
  `/proposals/:id/approve`.
- *Today:* `POST /api/inkling/chat` + extract/summary/label routes on Render are the
  first API surface.

## 10. The Evolution Loop — the engine

```
Observe → Understand → Research → Plan → Generate → Implement(propose) →
Test → Evaluate → Reflect → Store lessons → Update graph → Generate better
strategies → (human approval gates the Implement step) → repeat
```
Each cycle must **measurably improve at least one** of: speed, accuracy,
maintainability, reasoning, or UX — or it is rolled back. Every improvement carries a
**measurable justification** (a metric delta vs. baseline). Hypotheses before
conclusions; evidence before assumptions.

## 11. Metrics (tracked, versioned, graph-linked)

Reasoning quality · code quality · test coverage · execution time · memory efficiency ·
knowledge-graph growth (edges > nodes) · bug frequency · user satisfaction · goal
completion · architectural complexity. Every metric is a `metric` row tied to a
subject node; the Evaluator compares against the prior version's baseline.

## 12. Explainability — every action shows its work

For any action, `/explain/:id` (and the UI) render, from the event log + `explain`
blocks: **why** the decision, **alternatives** considered, **confidence**, **supporting
evidence** (linked nodes), **tradeoffs**, and **expected risks**. If the system can't
explain an action, it may not take it.

## 13. Security model

- **Human-in-the-loop is the core control:** Approval Gate on every write; the Guardian
  vetoes off-goal actions.
- **Least privilege + capability tokens:** agents/plugins get scoped capabilities, not
  ambient power. Code execution runs **sandboxed** (container/VM, no prod credentials).
- **Provenance & signing:** plugins signed; proposals hash their inputs; the event log
  is tamper-evident (hash-chained).
- **Secrets:** never in code or the graph; injected via env/secret store. **Privacy:**
  personal data (conversations, graph) stays local-first; cloud calls are explicit and
  minimal (the current Inkling posture).
- **Reversibility as safety:** because nothing is overwritten, any bad change is one
  approval away from rollback.

## 14. Testing framework

- **Agent-authored + human-owned:** the Tester agent proposes tests; they're versioned
  with the code. Unit / integration / property / regression + **golden-transcript**
  evals for agent reasoning.
- **Every proposal must ship with tests and a green run** before it can be approved.
- **Evaluator gate:** a change can't be merged if it regresses a tracked metric without
  an explicit approved tradeoff.
- CI runs the suite in the sandbox; results become `run` + `metric` nodes.

## 15. Technology stack

- **Kernel/Orchestrator + agents:** TypeScript (Node) — one language client↔server,
  strong tooling. Python workers where the ML ecosystem wins (embeddings, evals).
- **Event bus:** Postgres/Redis Streams → NATS/Kafka at scale.
- **Graph + vectors:** Postgres + `pgvector` (property-graph tables) or Neo4j.
- **LLM:** provider-plugin (Anthropic / OpenAI-compat / local Ollama) — offline-capable.
- **Frontend:** the existing web suite (Inkling/Orbit/Weaver) + Three.js for 3D graph;
  React for new surfaces.
- **Sandbox:** containers (Docker/Firecracker) for code execution.
- **Deploy:** today Render + GitHub Pages; target containerized services.

## 16. Folder structure (target monorepo)

```
nexaris/
├── kernel/            # orchestrator, event bus, registry, approval gate, scheduler
├── agents/            # one folder per agent plugin (architect, planner, …)
│   └── <agent>/       #   manifest.json + impl + tests
├── plugins/           # tools, llm-providers, stores, visualizers (self-registering)
├── graph/             # knowledge-graph service: schema, migrations, embeddings, query
├── memory/            # the seven memory layers + consolidation jobs
├── api/               # gateway (REST + WS/SSE), routes, auth
├── evolution/         # the loop: experiments, evaluator, reflection
├── explain/           # decision-record renderer, audit views
├── security/          # capabilities, sandbox, signing, secrets
├── metrics/           # collectors + baselines
├── apps/              # inkling · orbit · weaver (the human surfaces)
├── shared/            # types (Envelope, Node, Edge, Proposal, Manifest…)
├── tests/             # cross-cutting + golden-transcript evals
└── docs/              # this file + ADRs (every decision recorded)
```

## 17. Deployment strategy

- **Everything versioned & reversible:** infra-as-code; blue/green or canary; each
  deploy is a proposal with metrics gates and instant rollback.
- **Local-first + cloud-optional:** runs offline with local models; cloud is opt-in.
- **Progressive:** the existing static apps + Render backend keep serving while
  services are extracted one at a time behind the API gateway (strangler pattern).

## 18. Long-term evolution roadmap

- **P0 — Spine (now-ish):** formalize the graph node/edge schema + append-only revisions
  + the **Approval Gate** + the `explain` envelope across Inkling's existing AI passes.
- **P1 — Bus + Registry:** event log, plugin manifests, self-registration; turn the AI
  passes into registered agents.
- **P2 — Evolution loop v1:** Planner→Programmer→Reviewer→Tester→Evaluator on a *real*
  small task, fully gated, fully explained.
- **P3 — Server graph + embeddings:** migrate the client graph to Postgres+pgvector;
  real semantic recall + memory consolidation.
- **P4 — Self-improvement:** Reflection + Evaluator close the loop; the system proposes
  its own refactors (still human-approved).
- **P5 — Expansion modules:** 3D/AR/VR graph, voice, robotics/IoT, EE simulation,
  research assistants, digital twins, personal OS — each a plugin, none in the core.

## 19. How it actually starts (grounding, not fantasy)

NEXARIS is already *seeded*: Inkling's knowledge graph (nodes, typed/labeled edges,
importance/confidence, extraction agents) is the memory; the wired `LlmService` +
`/api/inkling/chat` is the provider + first API; the batched AI passes are proto-agents
(evidence-in, proposal-out). The first real NEXARIS increment is **not** a rewrite — it
is: (1) put an **Approval Gate + `explain` block** in front of the passes that already
mutate the graph, and (2) give the graph **append-only revisions**. That alone makes
the current system transparent, reversible, and measurable — the spine everything else
grows from.

**The whole design reduces to one promise:** a system that improves itself, forever,
without ever taking a step you didn't approve — and can always show you exactly why.

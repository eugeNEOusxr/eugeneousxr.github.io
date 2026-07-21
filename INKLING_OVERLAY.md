# Inkling Overlay — a contextual learning layer
**Systems architecture** · 2026-07-20 · companion to
[Story Mode](INKLING_STORY_MODE.md) · [Experience Architecture](INKLING_EXPERIENCE_ARCHITECTURE.md)

An always-available Orb that sits *above* whatever you're reading — a web page, a PDF,
a YouTube transcript, code, a ChatGPT thread — and answers one question:

> **"How does this connect to what I already know?"**

It doesn't replace apps. It's a lens over them, wired into the Atlas, the Story
Engine, and Inkling Chat.

---

## 0. The one honest reframe

**This is the existing extension, evolved — not a new app.** We already have a
Manifest V3 extension (`inkling-extension/`) with modular adapters that imports AI
conversations. The Overlay upgrades it from *"import this whole conversation"* to
*"read what's on screen and tell me how it connects."* Everything downstream already
exists: `POST /api/inkling/chat` (now wired), the knowledge graph in
`localStorage["inkling-mind-v1"]`, the Atlas towers, the living Story. The Orb is a
**client of all of them and owner of none** — it captures, proposes, and on your
approval writes to the same stores the Atlas and Story already read.

**And the non-negotiable:** *never silently collect.* The Orb reads only on explicit
activation, shows you what it captured before doing anything, and every save is
approved by you. Privacy-first isn't a feature here — it's the trust the whole thing
runs on.

---

## 1. The Orb interface

A small floating element (React + a tiny Three.js orb), draggable, dismissible,
never blocking the page.

**States:** `idle` (dim, corner) → `activated` (you click) → `analyzing` (pulse) →
`connections` (a card slides out) → you choose. It never expands until you ask.

**From the card you can:** open Inkling Chat (context pre-loaded) · open Story Mode ·
jump to the related Atlas node · approve/ignore each proposed connection. Notifications
(a gentle glow + count) when a chapter or a strong connection is generated — never a
popup that steals focus.

---

## 2. Context capture — adapters, permission-bounded

One interface, several adapters; each respects OS/browser permissions and captures
**only on activation**.

| Adapter | Reads | Permission |
|---|---|---|
| **Browser** | visible page text / selection → concepts + topics | extension host permission, per-activation |
| **Document** | PDF / doc text (client-side parse) | user opens the file |
| **Media** | YouTube / video *transcripts* when available | page transcript, not audio |
| **Desktop** *(later)* | supported accessibility APIs; user-selected screenshot → OCR | explicit OS grant, per-capture |

No adapter assumes unrestricted access. Desktop is the last phase and only ever reads
what you point it at.

```
CaptureEvent {
  id, source: "web"|"pdf"|"video"|"code"|"desktop",
  url|file, title, capturedText (truncated), selection?,
  concepts: string[],        // extracted (§3)
  at, status: "pending"|"saved"|"ignored"
}
```

---

## 3. Knowledge Connection Engine

Given captured concepts, compare against **your** graph and surface: related concepts,
prior conversations, unfinished learning paths, contradictions, and openings for
depth.

**Two tiers (start local, add semantic):**
- **Local, free, offline** — lexical/bucketed match against the localStorage graph
  (reuse the exact concept-bucketing already in the Atlas's `realGraph.js`). Works for
  guests, instantly.
- **Semantic, signed-in** — embed the capture + graph nodes, cosine-match in a vector
  store; then synthesize the connection prose via `/api/inkling/chat` with a
  *"connect this to my graph"* frame (the same wired endpoint).

> *You read:* "Transistors use semiconductor switching."
> *Inkling:* "This connects to your questions about **MOSFET gates**, **CPU logic**,
> and **neural-network hardware** — and it's the same *abstraction* thread your Story
> has been tracking for 105 days."

That second sentence is the difference between *"what is this?"* and *"why does this
matter in your journey?"* — and it's already computable from the living-story detector.

---

## 4. Story integration

Any strong connection can become a **Story Event** (feeds the chapter engine):

```
StoryEvent {
  id, kind: "connection"|"breakthrough"|"question"|"project"|"milestone",
  concepts: string[], sourceCaptureId, conversationIds: string[],
  title, narrative, newQuestions: string[], nextPath?, at, version
}
```

Example chapter: **"From Electrical Switching to Artificial Intelligence"** — the
original question, the conversations that contributed, concepts learned, new questions
generated, the future path. This is exactly the `deepenings()` mechanism, now fed by
what you read in the wild, not only what you imported.

---

## 5. User control (the approval system)

Every capture surfaces a card; **nothing is written until you pick one:**

`Save to Atlas` · `Create Story chapter` · `Ask Inkling` · `Ignore`

Approvals are per-item and non-retroactive. A visible **capture log** shows everything
the Orb has read, with one-tap delete. No background scraping, ever.

---

## 6. Technical implementation

```
Browser extension (MV3)            ← the Orb lives here first (reuse inkling-extension)
  ├─ content: Orb (React + Three.js), adapters, capture-on-click
  └─ background: connection engine (local tier), queue, notifications
        │  POST /api/inkling/chat        (connection prose — WIRED)
        │  POST /api/inkling/extract     (concepts — exists)
        ▼
Backend (Render, existing zero-dep server)
  ├─ Knowledge-graph service   (concepts, relationships, story events)
  ├─ AI analysis service       (LlmService: Anthropic / OpenAI-compat)
  └─ Vector service (new)      (embeddings + similarity — Phase 3)
        ▼
Store: localStorage (guest/offline, source of truth today) → synced cloud store
Desktop shell (Tauri preferred over Electron — lighter): Phase 4, accessibility + OCR
```

**DB schema (the four tables everything shares):**
`conversations` (imported/captured) · `concept_nodes` (label, confidence, first/last
seen, provenance) · `relationships` (typed edges, strength) · `story_events` (§4).
The Overlay writes to the same four the Atlas and Story already read — so a saved
insight *instantly* becomes a tower and a chapter.

**Build order:** (1) Orb UI + Browser adapter + local connection tier → (2) chat/extract
wiring + approval flow → (3) vector service + semantic matches → (4) desktop shell.

---

## 7. The feedback loop (the whole point)

```
Read → Capture → Connect (vs your graph) → Propose → Approve
   → Knowledge (nodes/edges) → Story event → Question → Inkling Chat → new understanding → …
```

The Orb is where that loop meets the real world. Its job is never *"what is this?"*
It is: **"why does this matter in your journey, and where does it connect next?"** —
the companion that has read everything you've read and remembers how it all ties
together.

---

## What exists vs. what's new

| Have | Build |
|---|---|
| MV3 extension + modular adapters | the Orb UI (React + Three.js) + capture-on-click |
| `/api/inkling/chat` (wired), `/api/inkling/extract` | the connection-engine card + approval flow |
| knowledge graph, Atlas, living Story (`deepenings()`) | vector service (semantic tier) |
| — | desktop shell (Tauri) + OCR, last |

Start with the browser Orb and the local connection tier: highest leverage, safest
permissions, and it closes the loop end-to-end before a single new backend service.

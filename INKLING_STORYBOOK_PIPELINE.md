# Inkling — Import → Storybook Pipeline
**Design spec** · 2026-07-17

> The objective is not a chat archive. It's an **evolving autobiography of the
> user's knowledge, thinking, creativity, and growth** — where every insight
> traces back to the exact conversation snippet that produced it.

---

## The one non-negotiable: the provenance spine

Every derived object — a concept, a graph edge, a detected signal, a sentence in
a chapter — carries:

```
sources: [ { conversationId, messageIds: [...], snippet } ]
```

Conversations themselves are stored **immutably**. This single rule is the
backbone of the whole system:

- **Traceability (stage 8):** click any insight → jump to the snippets behind it.
- **Synchronized views (stage 6):** the four views are *projections over one
  store*, never copies — so they can never drift out of sync.
- **Evolution + versioning (stage 7):** because chapters are *derived* from
  sourced facts, they can be re-derived and re-versioned when new imports change
  the underlying facts, without ever losing history.

---

## Data model — one store, many projections

| Entity | Shape (essentials) |
|---|---|
| **Conversation** (immutable source) | `{ id, provider, url, title, capturedAt, messages:[{ id, role, markdown, at }] }` |
| **Extraction** (per conversation) | items typed `concept · question · answer · decision · goal · project · person · technology · emotion · theme`, each `{ id, label, type, sourceMessageIds, snippet, at }` |
| **Node** (deduped across all chats) | `{ id, label, type }` |
| **Edge** | `{ id, from, to, type: related·prereq·evolves-into·contradicts·example-of, sources[] }` |
| **Signal** | `{ id, type: recurring·contradiction·breakthrough·abandoned·forgotten·growth, subject(nodeId), sources[], detectedAt }` |
| **Chapter** | `{ id, theme, title, sentences:[{ text, sourceRefs[] }], version, supersedesId, generatedAt }` |

The four views (Storybook, Knowledge Graph, Timeline, Discovery) are **read-only
projections** over `{ conversations, extractions, nodes, edges, signals,
chapters }`. Nothing is duplicated; that's why they stay in sync.

---

## Pipeline stages (run on each import, incrementally)

1. **Parse → Extraction.** One structured pass per conversation. LLM for the rich
   types; local keyword fallback for concepts. Every item cites its source
   message + a verbatim snippet.
2. **Merge → Graph.** Dedupe nodes (normalized label / embedding similarity); add
   typed edges. Every edge cites the sources that justify it.
3. **Detect → Signals.** Over the graph + timeline:
   - *recurring* — a node appears in ≥ N conversations
   - *breakthrough* — a "it clicked" moment / confidence jump
   - *contradiction* — opposing claims about the same node
   - *abandoned* — appeared once, never returned
   - *forgotten* — an old node not revisited in a long while
   - *growth* — a node's treatment deepens over time
4. **Narrate → Chapters.** Compose from concept clusters + signals, weaving source
   snippets; each sentence carries its `sourceRefs`. Local template today; LLM
   prose later.
5. **Preserve.** Conversations are never mutated. Chapters/insights point *into*
   them.
6. **Project → four synchronized views** (see below).
7. **Evolve.** On a new import, re-run 1–4 for the delta and re-detect. A chapter
   whose meaning changed gets a **new version** (old kept, `supersedesId`); a
   per-import **changelog** shows "what this import changed." Append-mostly —
   nothing is overwritten.
8. **Trace.** Any insight → its `sources[]` → the exact snippets.

---

## The four views

- **Storybook** — chapters as a flowing narrative of the learning journey (not AI
  summaries: the *story* of how understanding formed and changed).
- **Knowledge Graph** — nodes + typed edges (the galaxy).
- **Timeline** — conversations + signals on a time axis: when ideas appeared,
  peaked, faded; growth arcs.
- **Discovery** — the surfaced signals: hidden cross-conversation connections,
  contradictions, and forgotten/abandoned ideas worth revisiting.

---

## Cost-aware reality (how it scales to 200+ conversations)

Running full AI on every conversation × every stage would be too slow and costly.
So the split is:

- **Local / heuristic (instant, free):** the graph, the timeline, and the
  recurring / abandoned / forgotten detectors.
- **LLM (targeted):** rich extraction (batched), contradiction + breakthrough
  detection, and chapter prose (per-chapter, on demand).

This mirrors the guiding principle: **map wide locally, go deep with AI only where
it earns its cost.**

---

## What already exists (2026-07-17)

- ✅ Conversations stored with full transcripts (`inkling-mind-v1.conversations[].messages`).
- ✅ Concept + relation extraction (backend `extractConcepts`) — extend its schema for the other types.
- ✅ Cross-conversation linking: the galaxy clusters + concept "pull a thread" spotlight.
- ✅ Storybook chapters by theme (`renderStorybook`) + the bubble digest per chat.
- ✅ Recurring-concept / through-line synthesis (the seed of Discovery + Signals).
- ⬜ Missing: the **provenance spine** (sources on every item), the **Timeline** view, the **Discovery** detectors, and **chapter versioning**.

---

## Build path — foundations before complexity

- **Phase 0 — Provenance spine.** Attach `{ sourceMessageIds, snippet }` to every
  extracted concept. Small, foundational; unlocks traceability and everything after.
- **Phase 1 — Rich extraction.** questions / decisions / goals / technologies /
  emotions / themes, each with sources.
- **Phase 2 — Typed cross-conversation graph.** Upgrade the galaxy's implicit
  edges to real typed edges with sources.
- **Phase 3 — Timeline view.**
- **Phase 4 — Discovery detectors** (contradiction, forgotten, abandoned, growth)
  → the Discovery view.
- **Phase 5 — Chapter versioning** + rewrite-on-change + changelog.

Each phase is shippable on its own and leaves the product working.

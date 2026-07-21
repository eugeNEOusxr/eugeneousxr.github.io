# Story Mode — "The Story Is the Product"
**Narrative Systems design** · 2026-07-20 · companion to [Experience Architecture](INKLING_EXPERIENCE_ARCHITECTURE.md)

The reframe: **Story Mode is the front door, not a feature.** The city, the graph,
the conversations, and the AI all exist to keep one thing alive — *the evolving,
personalized story of your understanding.* You don't open a knowledge base; you
open the next chapter of your own intellectual autobiography.

This spec is buildable now, because the raw material already exists: your imported
conversations (the 12-node journey, provenance-grounded), the concept edges between
them, and the City as their map.

---

## 1. First principles

1. **The AI is a narrator, not a summarizer.** A summary compresses a conversation.
   A narrator explains *why the idea mattered to you* — the question that started it,
   the mistake, the moment it clicked. Same facts, opposite purpose.
2. **A chapter is written from change.** The unit of story is a *delta* in
   understanding, not a topic. "You thought a transistor was a switch; now you see
   the field" is a chapter. "Transistors" is not.
3. **Nothing is an isolated fact.** Every node earns its place by answering: why did
   this appear, what problem did it solve, what led here, what emerged after.
4. **No chapter ends.** It closes with *"where should we explore next?"* and real,
   graph-derived branches. The story is a river, not a book you finish.

---

## 2. The shell: Story is primary, City is its map

```
   ┌── STORY (home) ────────────────────────┐     ┌── CITY (the map) ──┐
   │  Chapter you're reading                │  ⇄  │ "what story lives  │
   │  ▸ Ask Inkling   ▸ Where next?         │     │  here?" per place  │
   └────────────────────────────────────────┘     └────────────────────┘
                    both read the same Self-Model
```

- **Opening Inkling opens the current chapter**, not a dashboard.
- The **City is one tap away** and is *diegetic to the story*: click a building →
  "the story that lives here" (its chapter); a **library** = a completed chapter, a
  **construction site** = a chapter still being written, a **blueprint district** =
  a future chapter you could start. Roads are narrative transitions between them.
- Galaxy stays as the "constellation index"; City is the walkable index. Same data.

---

## 3. Chapter anatomy (the data structure)

A chapter is generated, never hand-written, from one cluster of the graph:

```jsonc
{
  "id": "ch_transistors",
  "title": "The Switch That Wasn't",          // evocative, not "Transistors"
  "cluster": ["jr_charge","jr_transistor_switch","jr_mosfet","jr_circuits"],
  "arc": {
    "beginning":   "the question or misconception you started with",
    "growth":      "what you worked through, in your own words (provenance)",
    "obstacles":   "the mistakes / walls (e.g. 'switch' hid the field)",
    "connections": "edges to other chapters (abstraction → CS, field → Physics)",
    "breakthroughs":"the moments it clicked (from breakthrough signals)",
    "questions":   "what's still open",
    "next":        [ /* continuations, see §5 */ ]
  },
  "sources": ["jr_transistor_switch#msg1", ...],   // every claim is grounded
  "version": 2, "revisedAt": 1789..., "priorVersions": ["ch_transistors@v1"]
}
```

The **arc fields map 1:1 to the story beats** the brief asked for. Each is filled
from real data: `beginning` from the first message, `obstacles` from
contradiction/correction signals, `breakthroughs` from `DB.breakthroughs`,
`connections` from shared-concept edges, `sources` from provenance.

**Weaving, not listing.** The narrator prose interleaves the cluster's nodes and
may fold in — as *discoveries*, never popups — historical context, an engineering
analogy, the underlying science, a future possibility. A plaque you pass, not a
lecture that interrupts.

---

## 4. Ask Inkling — context-aware, in the chapter

Every chapter carries an **Ask Inkling** affordance that already knows the chapter,
its concepts, its source conversations, and your history. It never restarts cold.

- Pre-seeded, graph-derived prompts sit under the button:
  *"Why is the electric field invisible?" · "How does this connect to CPU design?" ·
  "How is this different from a relay?"* (generated from the chapter's concepts and
  their neighbors in the graph).
- The narrator **continues teaching from here** — and, per the Curator law, leads
  with a question + "what do you think?", with the answer one tap away. Curiosity
  first, never gatekept.
- Anything you explore **writes back**: new concepts/edges join the Self-Model, and
  the chapter can re-weave to include them. Reading *is* authoring.

---

## 5. Continuation — every chapter ends with curiosity

Never "The End." The closer generates several real branches from your graph:

| Branch | Source |
|---|---|
| **Continue learning** | the next prerequisite edge outward |
| **Explore a related concept** | strongest cross-district edge (e.g. field → Physics) |
| **Investigate an opposing view** | a contradiction or alternative framing |
| **Build a project** | a laboratory node that would apply this |
| **Read the history** | the historical-context fold |
| **Run an experiment** | a testable version of an open question |
| **Open the original conversation** | provenance → the real chat |

Each branch is a link into the graph, so the story literally can't dead-end.

---

## 6. Living story — chapters revise as you grow

The story is not append-only prose; it's a **view over a changing model**, so old
chapters can be *re-narrated* when your understanding deepens. The AI occasionally
surfaces a **"revisit"** — the exact behavior the brief describes:

> *"Six months ago you believed transistors were switches. Today you understand
> electric fields, doping, and channel formation. Let's revisit that first chapter
> and see how your thinking has changed."*

Mechanism: a chapter keeps `version` + `priorVersions`. When a cluster's concepts
gain confidence or new edges since `revisedAt`, a revisit is offered. **Old versions
are never destroyed** — the diff *is* the autobiography. (This is the [Experience
Architecture](INKLING_EXPERIENCE_ARCHITECTURE.md)'s "Story = the diff" made concrete,
and it needs the time/confidence-versioned concepts named there as prerequisite #2.)

---

## 7. What this needs, and the build order

Already shipped: imported journey nodes (12, provenance-grounded), concept edges,
the City-as-map, the provenance spine, template Storybook chapters.

1. **Chapter object + generator** — cluster the graph → fill the arc fields from
   real signals (start from the existing `clusterConvs`, add the 7 beats).
2. **Story-first shell** — make a chapter the home view; wire City buildings →
   "the story here."
3. **Ask Inkling in-chapter** — context object = {chapter, concepts, sources,
   history}; graph-derived starter questions; write-back.
4. **Continuations** — the §5 branch generator off the graph.
5. **Living revisions** — versioned chapters + the revisit detector (depends on
   time/confidence on concepts).
6. **AI narrator prose** — LLM turns the arc + sources into nonfiction that never
   reads like documentation; offline template fallback for guests.

---

## The line that decides everything

> They should never feel like they are reading documentation. They should feel like
> they are reading the story of how their understanding of the universe is unfolding.

Every design choice above is subordinate to that sentence. If a screen feels like a
database, it's wrong — even if the data is perfect.

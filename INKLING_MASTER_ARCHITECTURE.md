# INKLING — Master Architecture Plan
**Vision Specification v1.0** · canonical north star · last mapped 2026-07-16

> Inkling is a personal operating system for human knowledge.
> It transforms conversations into understanding, understanding into connections,
> connections into learning, learning into growth, and growth into a lifelong story.

Inkling is **not** designed to replace human thinking. It amplifies human curiosity,
memory, learning ability, and self-understanding — a continuously evolving representation
of what a person knows, is learning, wonders about, how they think, and how their
understanding changes over time.

---

## Core philosophy

Traditional software isolates: notes, calendar, tasks, flashcards, documents, messages,
learning platforms. Human thought doesn't work that way. A conversation creates a
question; a question creates learning; learning creates understanding; understanding
changes beliefs; experiences create stories; stories shape identity. **Everything is
connected.** Inkling models that natural progression.

A user should eventually be able to ask:
*"What have I learned?" · "How has my thinking changed?" · "What patterns exist in my
life?" · "What should I learn next?" · "What questions have followed me for years?" ·
"What did I believe before I understood this?" · "Show me my intellectual journey."*

---

## Architecture decision (2026-07-16)

**`inkling.html` is the unified shell.** All engines live on one page sharing ONE user
model (`localStorage: inkling-mind-v1`), offline/guest-safe, no build step. The graded
quiz engine (`quiz.html`) and the visual graph (`wordweaver.html`) are embedded
*instruments*, fed by the user's real captured data. The calendar PWA (`src/main.js`)
stays a separate tool for now.

The remodel is **unification, not rebuild** — the nine engines already existed ~80%,
scattered across three surfaces.

---

## The nine engines — spec + current status

| # | Engine | Purpose | Status in `inkling.html` |
|---|--------|---------|--------------------------|
| 1 | **Conversation** | The primary interface. Explain, ask what the user believes, analyze understanding, find misconceptions, create nodes, suggest related concepts, seed future review. | 🟡 **Partial** — `💬 Chat` routes any input into 8 typed nodes with links + reason (the *extraction* half). **Phase 2** adds the *response + dialogue* half (needs an LLM for the full version). |
| 2 | **Knowledge graph** | Every concept a node: title, explanation, category, relationships, understanding, confidence, learning history, conversations, questions, resources. | 🟡 **Partial** — `🌐 Graph` holds concept nodes with versions, refinement, breakthroughs, open questions, and a per-concept biography timeline. **Phase 3** adds the visual force-graph fed by captured data. |
| 3 | **Learning** | Discover how *this* user learns — preferred explanations, strengths, weaknesses, misconceptions, patterns. Beginner → Intermediate → Advanced → Expert progression. | 🟡 **Seeded** — The Seed captures learning style; refinement marks had-vs-new. Progression tiers pending. |
| 4 | **Study paths** | Turn curiosity into structured learning; adjust to knowledge, goals, interests, weaknesses. | 🟡 **Partial** — `📚 Paths` = the field discovery loop; The Seed recommends a personalized path. Dynamic adjustment + step→quiz wiring in **Phase 4**. |
| 5 | **Flashcard & assessment** | Test mental models, not just definitions: definition / relationship / application / prediction / comparison / explanation. Measure vocabulary, accuracy, reasoning, improvement. | 🟢 **Strong engine** — `🎓 Quiz` (`quiz.html`) has graded multi-type questions, difficulty tiers, KG portal. Growth metrics + tighter path integration in **Phase 4**. |
| 6 | **Story** | A reflection layer, not a transcript. Discoveries, milestones, breakthroughs, changes in perspective, goals achieved. | 🟡 **Seed** — `📖 Storybook` weaves breakthroughs + evolutions + began-moments + story-captures. Flowing chapter prose (exportable book) in **Phase 5**. |
| 7 | **Memory** | Continuity. Preferences, goals, projects, important experiences. Searchable, editable, transparent, user-controlled. | 🟡 **Read-only** — `🔔 Memory` surfaces Seed facts + memory-captures. Editable/searchable memory in **Phase 6**. |
| 8 | **Question** | Capture curiosity: unanswered, recurring, future exploration; connect across fields. | 🟢 **Working** — open questions per concept + routed question-captures, surfaced together as "unresolved threads." |
| 9 | **Goal** | Connect knowledge with action: roadmap, milestones, practice tasks, reminders, progress. | 🟡 **Captured** — goals captured via Seed + Chat routing; roadmap/milestone/progress engine pending. |

---

## Data-model philosophy

Not isolated documents — **connected entities**, everything with relationships.
Core entities: User · Conversation · Concept · Question · Memory · Goal · Skill ·
Learning Path · Story Event · Flashcard · Assessment · Relationship.

Today all of this lives in one object (`inkling-mind-v1`): `profile` (the Seed),
`answers` (concept mental-model versions), `refine`, `openQs`, `breakthroughs`,
`captures` (interpreter output). Every surface reads/writes this one model — the
"all systems share the same underlying user model" principle, realized.

---

## Phase roadmap

- **Phase 1 — Navigation & home** ✅ *done 2026-07-16* — unified dashboard (10-sec promise, living snapshot, smart nudge) + 6-section nav over one user model.
- **Phase 2 — Conversation Engine** ⬅ *next* — Chat responds *and* extracts; asks what you believe, reflects, surfaces "I noticed a new concept." Full version needs an LLM (heuristic scaffold offline).
- **Phase 3 — Visual knowledge graph** — force-graph fed by captured nodes/links; node detail = the biography timeline (built).
- **Phase 4 — Study paths + assessment** — wire path steps → quizzes; growth metrics; dynamic path adjustment.
- **Phase 5 — Storybook generation** — meaningful moments → flowing, chapter prose; exportable as a real book.
- **Phase 6 — Long-term memory** — editable, searchable, transparent, user-controlled.

---

## Development principles

1. Don't build disconnected features. 2. Every feature strengthens understanding,
memory, or growth. 3. Preserve user history. 4. Never delete previous knowledge.
5. Favor evolution over replacement. 6. Foundations before complexity. 7. The
knowledge graph is the central organizing structure. 8. Conversation is the input.
9. Understanding is the output. 10. Growth over time is the purpose.

---

## 10-year horizon

A lifelong personal intelligence platform — a living archive of human growth where a
person can look back across years at their questions, discoveries, skills, failures,
improvements, and changing perspectives. Eventually the cognitive architecture
(memory, continuity, personality, learning history, interaction model) behind physical
AI interfaces — desktop companion, voice, robot. *The body is not the intelligence;
Inkling is.*

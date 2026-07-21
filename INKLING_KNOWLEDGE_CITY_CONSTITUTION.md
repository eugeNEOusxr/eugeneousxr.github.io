# The Inkling Knowledge City Constitution
**The governing document of a living civilization of understanding** · v1.0 · 2026-07-17

---

## Preamble

We establish this City not to store information, but to render **understanding
visible**. The City is a map of a mind in motion — where every street, building,
and tower is earned by meaning, not by volume. Let it be governed by these laws,
that it may grow honestly, remember faithfully, and reveal what its citizen does
not yet know they know.

---

## Core philosophy (the Prime Law)

**The City represents understanding, and understanding is measured by connection,
depth, and change over time — never by quantity.**

Every structure in the City is derived from facts, and every fact must carry six
properties, or it may not build:

| Property | Meaning |
|---|---|
| **origin** | the exact conversation snippet it came from (the provenance spine) |
| **meaning** | its extracted type and label |
| **relationships** | its edges to other concepts |
| **confidence** | how well it is understood, ∈ [0,1] |
| **history** | its versions over time |
| **growth potential** | prerequisites unmet, paths not yet walked |

A small, deeply-connected concept **outranks** a large pile of disconnected ones.
This principle is supreme; where any later Article conflicts with it, it prevails.

---

## Article I — The Laws of Knowledge Formation

A conversation does not become architecture by existing. It earns form through a
single scalar, the **Development score**:

```
D(c) = w_f·log(1 + freq(c))        # discussed how often (diminishing returns)
     + w_c·deg(c)                  # how many concepts it connects to
     + w_m·mastery(c)              # demonstrated understanding ∈ [0,1]
     + w_r·revisits(c)             # returned to across time
     + w_a·application(c)          # used in a project / applied
     − w_x·isolation(c)            # penalty for having no edges
```

Default weights honor the Prime Law: `w_c` and `w_m` dominate `w_f`. Raw frequency
is logarithmic — talking about a thing ten times is not ten times the understanding.

**Formation thresholds:**

| Form | Condition |
|---|---|
| **Street** | a relationship between two concepts (an edge), `S(i,j) ≥ θ_street` |
| **House** | a concept mentioned but shallowly held: `D < d_1` |
| **Building** | a developed concept: `d_1 ≤ D < d_2` |
| **District** | a cluster of ≥ `N_d` connected buildings with cohesion ≥ `φ` |
| **Landmark** | a concept carrying a `breakthrough` signal, or `D ≥ d_3` and load-bearing (many depend on it) |

*AI rule:* the extractor assigns each concept a provisional type and confidence;
D is recomputed on every import. A house may become a building; nothing is born a
landmark — landmarks are earned.

---

## Article II — The Laws of City Geography

Space is not decorative; **proximity encodes relatedness**.

- **Neighborhood** — concepts with dense mutual edges (a community).
- **District** — a broad field (a super-community of neighborhoods).
- **Region** — an interdisciplinary zone where districts overlap.
- **City** — a domain of genuine expertise (a district that has reached depth `L≥3`
  across many buildings).

**Clustering:** build the concept graph with edge weights `S(i,j)` (Article IV);
run community detection. Position is a force layout of the *community* graph, so
related fields sit near each other.

**Emergence, merge, separation:**
- A **new district emerges** when a cluster reaches size ≥ `N_d`, internal cohesion
  ≥ `φ`, and overlap with existing districts < `ρ`.
- Two districts **merge** when inter-district edge density exceeds either one's
  internal density (they were never truly separate).
- A district **separates** when a sub-cluster's internal cohesion far exceeds its
  links to the rest (`cohesion_sub / links_out > σ`).

*Governing intent:* the map re-districts itself as understanding reorganizes —
geography is a consequence of thought, never a fixed grid.

---

## Article III — The Laws of Vertical Development

The City grows **upward** as understanding grows **abstract**. Height is not
development (that is footprint) — height is **abstraction tier** `L(c)`:

| Level | Tier | Contains | Earned by |
|---|---|---|---|
| **Ground** | Foundation | definitions, prerequisites | being a prerequisite others rest on |
| **Mid** | Applied | projects, skills, cross-field use | application + connection |
| **Upper** | Advanced | theories, original synthesis | originality + mastery ≥ `m_hi` |
| **Sky** | Frontier | new ideas, open questions, inventions | user-generated, unresolved, or unexplored |

```
L(c) = tier( prereq_depth(c), originality(c), mastery(c) )
originality(c) = share of the concept's content that is user-authored,
                 not received from the AI
```

A concept **earns vertical growth** by two distinct routes: becoming *foundational*
(many buildings depend on it → it anchors the ground and casts influence upward),
or becoming *abstract/original* (the citizen reasons beyond what they were told →
it rises toward the Sky). Frontier structures glow but are translucent until
confidence rises — unproven ideas are visible but unfinished.

---

## Article IV — The Laws of Connection

Connections are the true wealth of the City (the Prime Law made physical).

**Connection strength:**
```
S(i,j) = α·cooccur(i,j)          # appeared together in conversations
       + β·shared_neighbors(i,j) # structural similarity
       + γ·explicit(i,j)         # a stated relationship (prereq, contradicts, …)
   normalized to [0,1]
```

| Structure | Rule | Represents |
|---|---|---|
| **Road** | `S ≥ θ_road`, same district | a common, everyday relationship |
| **Bridge** | `S ≥ θ_bridge`, different districts | a cross-disciplinary connection |
| **Gateway** | two districts share ≥ `K` bridges | a major transition between fields |
| **Transit line** | an ordered prerequisite chain toward a goal | a recommended learning path |

*AI rule:* a **missed connection** is flagged where `shared_neighbors` is high but
`S < θ` — a structural hole the citizen hasn't crossed. The City proposes the
bridge; it does not build it unauthorized.

---

## Article V — The Laws of Memory and History

**Nothing is destroyed. History is preserved, always.** Every structure has a
`state`, and state changes are appended, never overwritten:

| State | Meaning | Trigger |
|---|---|---|
| **construction zone** | active learning | recent activity, rising D |
| **renovated** | improved understanding | a new version supersedes an old one (history kept) |
| **historical landmark** | a breakthrough | a `breakthrough` signal |
| **abandoned** | a forgotten idea | activity decayed below `a_min` |
| **archive** | the original conversations | immutable source, always linked |

**Activity decay** governs dimming and abandonment:
```
A(c, t) = A(c, t₀)·e^(−λ(t − t_last))     # lights fade with neglect
abandoned  when  A < a_min
```
An abandoned building is **greyed, not deleted** — walkable, its archive intact, so
it can be renovated the moment the citizen returns. The City is an autobiography;
autobiographies do not erase their chapters.

---

## Article VI — The Laws of Discovery

The City's highest duty is to **reveal what the citizen cannot see themselves**.

| Signal | Detection |
|---|---|
| **missed connection** | high `shared_neighbors`, low `S` (structural hole) |
| **recurring theme** | a concept whose frequency is high across many time windows |
| **contradiction** | opposing claims about one node (AI-judged) |
| **emerging interest** | positive slope of activity: `dA/dt > ε` |
| **forgotten knowledge** | high past `D`, low present `A` |
| **future path** | a prerequisite chain from known concepts toward a stated goal |

Discoveries surface in a dedicated **Discovery** projection and as living cues in
the City (a proposed bridge, a glowing construction sign). Each cites its sources —
a discovery with no provenance may not be shown.

---

## Article VII — The Laws of Personalization

**The same knowledge builds a different city for each citizen.** The graph is
shared truth; the *rendering* is personal. A personalization vector `P` reweights
the City:

```
render_weight(c) = D(c) · ( 1
   + π_g·aligns(c, goals)          # concepts serving current goals rise + brighten
   + π_i·interest(c)              # interests foreground; boredom recedes
   + π_p·in_active_project(c) )    # project-relevant concepts become construction zones
layout_center = the district best serving the citizen's current goal
```

A citizen chasing electronics sees Electronics as the tall, central, lamp-lit
district; a storyteller sees Creativity at the heart. Expertise flattens the
familiar (mastered foundations recede to quiet ground) and elevates the frontier.
Learning style tunes the visual grammar (a visual thinker gets denser bridges; a
builder gets more laboratories).

---

## Article VIII — The Laws of Visualization (the Visual Grammar)

A fixed, honest vocabulary — so the City can always be *read*:

| Element | Means | Driven by |
|---|---|---|
| **Building** | a concept | exists per concept |
| **Footprint (width)** | how developed | `D(c)` |
| **Height** | how abstract | `L(c)` |
| **Windows** | details / sub-points | count of extracted details |
| **Lights (brightness)** | recent activity | `A(c,t)` |
| **Translucency** | low confidence | `1 − confidence` |
| **Color** | field / district | district identity |
| **Bridge** | a relationship | `S(i,j)` (thickness = strength) |
| **Tower** | an advanced abstraction | `L ≥ 3` |
| **Library** | Storybook / stored conversations | narrative + archive |
| **Laboratory** | experimentation / projects | active project concepts |
| **Park** | reflection / creative space | reflective notes, open wondering |

No element may lie: a big building must mean deep understanding, never mere volume.

---

## Article IX — The Laws of Interaction

**Every path in the 3D world must lead to useful truth.** The world is a table of
contents, not a destination.

| Action | Result |
|---|---|
| **click a building** | a 2D panel: summary, confidence, the **source snippets** (provenance), connections, Storybook chapters that cite it |
| **enter a district** | the field's overview, its landmarks, its through-lines |
| **follow a road / bridge** | the relationship explained + both concepts |
| **open a gateway** | the field-to-field transition and its bridging ideas |
| **read a Storybook chapter** | the narrative, each sentence linking back to its sources |

Interaction is bound by the provenance spine: from any structure, the citizen can
always reach the exact words that built it.

---

## Article X — The Laws of Expansion

When new conversations are imported, the City must grow **without amnesia and
without duplication**. The expansion cycle:

1. **Extract** the new conversation → concepts, relationships, signals (each with
   origin snippets).
2. **Reconcile, don't duplicate** — a new concept is matched to an existing node by
   normalized label / embedding similarity ≥ `μ`; if matched, it *reinforces* that
   building (D rises, footprint grows) rather than raising a twin.
3. **Strengthen** existing edges whose weight the new evidence increases.
4. **Build new** streets/houses/districts only where genuinely new structure appears.
5. **Update understanding** — where new evidence changes an old belief, the affected
   buildings are **renovated** (a new version; the old kept) and any Storybook
   chapter that drew on them is **re-narrated with version history**, showing *what
   this import changed*.
6. **Re-detect** signals across the whole City (forgotten, emerging, contradictions).

Growth is **append-mostly and idempotent**: importing the same conversation twice
changes nothing. Understanding evolves; the record never shrinks.

---

# Appendices (the required outputs)

## 1. Core philosophy
Understanding over quantity; six mandatory properties per fact; provenance is
supreme; the City is an autobiography that never erases.

## 2. Mathematical rules (summary)
- Development `D(c)` — Article I.
- Abstraction tier `L(c)` — Article III.
- Connection strength `S(i,j)` — Article IV.
- Activity decay `A(c,t) = A₀·e^(−λΔt)` — Article V.
- Emerging interest `dA/dt > ε`; forgotten = high `D`, low `A` — Article VI.
- Render weight with personalization vector `P` — Article VII.

## 3. Data structures required
```jsonc
Conversation { id, provider, url, title, capturedAt, messages:[{id,role,markdown,at}] }   // immutable source
Concept      { id, label, type, confidence, D, L, activity, state, districtId,
               position:{x,y,z}, footprint, height,
               sources:[{conversationId, messageIds, snippet}] }                            // provenance spine
Edge         { id, from, to, type:related|prereq|evolves-into|contradicts|example-of,
               strength:S, sources:[…] }
District     { id, name, color, center:{x,z}, cohesion, memberConceptIds }
Signal       { id, type:recurring|contradiction|breakthrough|abandoned|forgotten|emerging|future-path,
               subjectId, sources:[…], detectedAt }
Chapter      { id, theme, title, sentences:[{text, sourceRefs}], version, supersedesId, generatedAt }
CityState    { conceptVersions:[…], changelog:[{importId, changed:[…], at}] }               // history
Personalization { goals[], interests[], projects[], style, expertiseByField }
```
Every derived object carries `sources[]`. The four projections (Storybook, Graph,
Timeline, Discovery) and the 3D City are all read-only views over this one store.

## 4. AI decision rules
- **Reconcile before create:** match new concepts to existing nodes (similarity ≥ μ)
  before minting a building.
- **Promote conservatively:** raise a concept's tier only on evidence of
  originality or mastery, not on repetition.
- **Propose, don't impose:** discoveries (missed connections, paths) are *offered*;
  the citizen confirms.
- **Never assert without provenance:** any AI claim (contradiction, breakthrough)
  must cite the snippets that justify it, or it is withheld.
- **Cheap first:** graph, clustering, decay, recurring/forgotten detection run
  locally and free; reserve LLM calls for rich extraction, contradiction judgement,
  and chapter prose.

## 5. Procedural generation principles
- **Deterministic from data:** the same graph + personalization always yields the
  same City. Layout = force-directed on the district graph; buildings placed by
  sub-cluster within their district; `height=f(L)`, `footprint=f(D)`,
  `brightness=f(A)`, `translucency=f(1−confidence)`.
- **Structure is truth; style is seeded noise:** aesthetic variety (window patterns,
  silhouettes) comes from a hash of the concept id — varied but stable, never random
  between visits.
- **Connections drawn last:** roads/bridges/gateways from `S`; only above threshold,
  so the sky isn't a web of noise.
- **Grow in place:** expansion reinforces existing geometry before adding new — the
  City the citizen learned to navigate stays recognizable.

## 6. Examples of city growth over time
- **t₀ — Founding.** A handful of concepts → small houses in nascent districts
  (Mathematics, Electronics, AI). Few bridges. Low, dim, honest.
- **t₁ — First district.** Several AI conversations imported; *neural networks* and
  *gradient descent* gain edges → they widen into buildings; a **bridge** forms from
  *gradient descent* to the Mathematics district. AI becomes a true district.
- **t₂ — Mastery & renovation.** The citizen revisits *transistors*, demonstrates
  understanding; its building **renovates** — taller, brighter — and, as many
  concepts come to depend on it, it is declared a **landmark** in Electronics.
- **t₃ — Contradiction.** A new chat conflicts with an old claim about *voltage*; a
  **construction zone** appears, the affected Storybook chapter is re-narrated with
  version history noting the change.
- **t₄ — Forgetting.** *Quantum computing*, untouched for months, **dims to
  abandoned** — greyed but preserved, its archive one click away.
- **t₅ — A new region.** Bridges accumulate between AI, Mathematics, and Electronics
  until a **gateway** opens and an interdisciplinary **Region** ("Machine
  Intelligence") is recognized — a City within the City, born of connection, exactly
  as the Prime Law intends.

---

## Amendment

This Constitution is itself versioned. It may be amended, but no amendment may
violate the Prime Law — that the City measures understanding, honors provenance,
and never erases its history.

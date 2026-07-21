# The Heart of Inkling — Experience Architecture
**Lead Experience Architect design** · 2026-07-17

Inkling is not a note app, a chatbot, or a knowledge graph. It is a **self-knowledge
instrument** — a mirror for a mind that is changing. Existing tools store what you
*wrote*. Inkling models how you *think*, how it *changes*, and shows you *yourself*.
That is the new category.

---

## 1. The heart: one Self-Model, three tenses

The central claim of this design: **Chat, Story, and City are not three products.
They are three tenses of one substance — your understanding.**

```
        CHAT  ── the present ── thinking now, curiosity in motion
       STORY  ── the past    ── how you came to understand
        CITY  ── the whole   ── where you stand + where you're going
                    ▲
            all read/write ONE store:
                THE SELF-MODEL
```

The **Self-Model** is the only source of truth. Everything else is a lens. It holds:

- **concepts** — with confidence, a *version history* of what you believed over time,
  and provenance (the exact snippets behind them)
- **questions** — open, recurring, answered
- **edges** — typed relationships between concepts
- **signals** — breakthroughs, contradictions, forgotten & emerging ideas
- **identities** — who you say you want to become (declared, not assumed)
- **the timeline of change** — because an autobiography is about *difference*

If we build this one store well, Chat / Story / City fall out as views — and they
can never drift apart, because there is nothing to drift. (This is also the fix for
the recurring trap of building them as separate apps that compete with each other.)

---

## 2. Inkling Chat — where curiosity becomes structure

Chat is the *input organ*. Its job is not to answer — it is to turn curiosity into
structured understanding that the Self-Model can hold. Every turn:

1. responds (and, for a question about a concept, asks **what you already think**
   first — never leading with the answer),
2. **extracts** concepts, questions, decisions, and relationships (with provenance),
3. writes them into the Self-Model,
4. and quietly notes *how this changed* what was already there.

Nothing is discarded — but see the forgetting mechanic in §7. Retention without
decay is noise, not memory.

*(This already exists in seed form: the browser-extension import + the interpreter.)*

---

## 3. Inkling Story — the autobiography, written from change

**Story is the diff, not the snapshot.** A summary compresses; an autobiography
*narrates change*. Story is only ever compelling if it is written from what
*moved* — so it must read the Self-Model's time dimension:

- what you believed **then** vs **now** (concept version history)
- which conversation **changed your thinking** (a breakthrough signal)
- which misconception **disappeared** (a contradiction resolved)
- which idea **keeps returning** (a recurring signal)
- which concept **became foundational** (many others came to depend on it)

Every chapter carries the arc you named:

> **Beginning → Growth → Obstacles → Connections → Breakthroughs → Remaining
> Questions → Suggested Next Chapter**

Two laws keep it from feeling like AI slop:
- **Provenance:** every sentence links to the snippet that earned it. The voice is
  *yours* because it's built from your own words.
- **Authorship:** you are the author; the AI is the ghostwriter. You can edit a
  chapter, correct the record ("that's not what I meant"), or hide one. It is your
  autobiography, not the model's opinion of you.

---

## 4. The Knowledge City — understanding made spatial

The City is the *whole-self lens* — the map you can fly through. It obeys the
[Knowledge City Constitution](INKLING_KNOWLEDGE_CITY_CONSTITUTION.md): buildings =
concepts, districts = domains, roads/bridges = relationships, libraries = Story
chapters, laboratories = projects, construction sites = active learning, monuments =
breakthroughs. Time is spatial here — renovations and monuments are *change* you can
walk around.

---

## 5. The Future City — the city grows toward who you're becoming

The boldest idea, and the one that needs the firmest ethic:

> **The future is user-authored, AI-scaffolded — never AI-imposed.**

You **declare** an identity you want to grow toward (Electrician · Software Engineer ·
Researcher · Artist · Entrepreneur). Inkling then renders that future as a
**partially-constructed district** — *blueprints before buildings* — and the AI
scaffolds it:

- **prerequisite knowledge** (which existing districts it builds on)
- **estimated learning time** (honest, ranged)
- **recommended conversations & projects** (what to explore next)
- **the Story chapters** that would move you closer

The AI may *notice* an emerging identity — "a Robotics district is forming on its own
in your city; want to make it real?" — but it **proposes, never decides**. Paternalism
is the failure mode; consent is the design. The city literally grows toward a future
*you chose*.

---

## 6. The Story Engine — past, present, future woven

Each chapter naturally threads: a **past** conversation → a **present** interest → a
**future** possibility. Into this weave the engine may fold — as *discoveries while
exploring*, never as interruptions — historical context, a fascinating fact, an
engineering insight, a philosophical question, a scientific explanation, a practical
application. They appear the way a plaque appears on a building you happened to walk
past: optional, delightful, never a popup.

---

## 7. The AI Curator — a mentor who lives in the city

The Curator is not a chat bubble bolted on. It is a **diegetic character** — a guide
who walks the city with you, points at a forgotten building, marks a construction
site, and asks the next question. Its role is to **cultivate curiosity, not vend
answers.** It continuously asks:

- What is the next meaningful question?
- What connection have you not noticed?
- Which forgotten conversation just became relevant?
- Which field is quietly emerging?
- What idea deserves its own district?

**One correction to the brief:** "never provide answers" taken literally is
frustrating — sometimes you *need* the answer. So the Curator **leads with the
question**, but the answer is always **one tap away**. It withholds to provoke, not
to gatekeep.

---

## 8. Design philosophy & the anti-metrics

Every interaction should earn the feeling: *"I understand myself better than I did
yesterday."*

**Reward:** curiosity · reflection · connection · growth · understanding.
**Never:** completion · streaks · points · endless notifications.

Two safeguards, because good intentions decay:

- **The Prime Law, visually enforced.** Even a growing city can quietly become a
  score ("more buildings = winning"). So the City rewards **depth and connection** —
  bridges, renovations, hard-won landmarks — **never building count**. A sparse,
  deeply-connected city must read as *richer* than a sprawling shallow one.
- **The one honest surface.** Replace streaks with a single, periodic, *earned*
  reflection: "here's how your understanding changed" — shown through real deltas (a
  concept that deepened, a bridge that formed, a question you finally answered).
  Never fabricated, never a number.

---

## Challenges to the brief (an architect owes you honesty)

1. **"Nothing is discarded" needs a forgetting mechanic.** Infinite retention is
   noise. Design *forgetting as a feature*: untouched concepts fade to "abandoned"
   (greyed, not deleted; history preserved). Meaning stays legible because the City
   is allowed to dim what you've let go.
2. **Story must be the diff.** It can only escape the "AI-summary" feeling by being
   written from *change over time* — which requires versioned concepts. This is the
   single most important dependency in the whole design.
3. **The Future City must be consented.** Its beauty is inseparable from its danger.
   Declared identities + AI scaffolding, never AI projection.
4. **Curiosity-first, not curiosity-only.** Withhold to provoke; never to gatekeep.
5. **The three experiences are one.** The past year's hardest lesson (parallel apps
   that confuse the user) is solved by the Self-Model: build the substance once.

---

## What exists, and the sequence to the heart

| Piece | Today |
|---|---|
| Chat (input organ) | ✅ import + interpreter |
| Story (chapters) | ✅ theme chapters + through-lines + provenance spine |
| City (lens) | ✅ 3D engine, generated from a graph |
| Self-Model (the heart) | 🟡 scattered across stores — **unify it** |

**Build sequence toward the heart:**
1. **Unify the Self-Model** — one store the three lenses read/write.
2. **Add time + confidence to concepts** — so Story becomes a *diff*, not a summary.
3. **Declared-identity Future City** — blueprints for futures you choose.
4. **The diegetic Curator** — the mentor who lives in the city and asks the next
   question.
5. **The one honest reflection surface** — growth recognized, never gamified.

---

## The category

Not a note-taking app. Not a chatbot. Not a knowledge graph. **A cognitive
autobiography — an instrument that helps a person watch their own understanding
evolve over decades, and become who they are trying to become.** A mirror for the
mind. That is the new category, and it is worth building for years.

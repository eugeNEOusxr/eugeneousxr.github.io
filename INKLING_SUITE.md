# The Suite — Orbit · Inkling · Weaver
**App architecture** · decided 2026-07-31

One system became three. Each app is one clear job, so none of them feels like "a
thing with everything bolted on." They share a backend, an account, and a design
language — but each has its own name, home, and purpose.

---

## 🛰️ Orbit — time & planning
*Your days, in motion.*

**What it does:** the calendar, the schedule, and the alerts that keep them.
- 3D month calendar (the constellation/day-cylinder views)
- Schedule / Notebook writer (hour timeline, timed notes)
- **Alerts** — reminders and alarms that fire from your schedule (in-app + web push).
  Alerts live *here*, with the time system that creates them.

**Today it is:** the main PWA (`index.html` + `src/calendar/**`, service worker,
web-push). Splitting = give it the Orbit name/branding and its own install identity.

---

## 🌱 Inkling — knowledge & story
*An evolving autobiography of your understanding.*

**What it does:** turns your thinking into a living, navigable body of knowledge.
- **Chat** — a mentor AI (per the [Charter](INKLING_CHARTER.md)); real model when
  signed in + key set, local fallback otherwise
- **Imports** — bring in your ChatGPT/Claude history (local, private)
- **Galaxy** — conversations as clustered stars
- **Story** — your life as a readable **book**: a Library homepage by category, a
  continuous read, multiple genres, and AI-narrated chapters
- **Knowledge Graph** — concepts, projects, people, realizations & questions as
  living nodes; expand → Story; timeline; memory trails; labeled relationships
- **Atlas** — the 3D city/towers view of the same graph (`/city/`)

**Today it is:** `inkling.html` + `/city/`. Keeps the name — it's the brand and the
Charter subject.

---

## 🧵 Weaver — learning & practice
*Weave subjects into mastery.*

**What it does:** the study side — drilling and building real skill.
- Graded **quizzes** & flashcards (`quiz.html`) — Precalc, Psychology, Circuits,
  Electrician, AI, Biology…
- **Study maps** (EE, Electrician Apprenticeship, Psychology…)
- The **WordWeaver** knowledge canvas (2D spiral + 3D towers of a subject)

**Today it is:** `quiz.html`, `wordweaver.html`, `wordweaver3d.html`,
`src/inkling/study/**`. Splitting = unite them under the Weaver name.

---

## What's shared (the plumbing, not an app)
- **Backend:** Render (`inkling-15yf.onrender.com`) — one auth + LLM service for all three.
- **Account:** one sign-in (`localStorage["eugeneousxr:session"]`) works across apps.
- **Data:** each app owns its store — Orbit (calendar/alerts), Inkling
  (`inkling-mind-v1`), Weaver (quiz progress). Same origin, so they can cross-link.
- **Design language:** shared dark/cosmic aesthetic and components.

## The split plan (files → apps, mostly already separate)
1. **Brand each entry point** with its name + icon (Orbit / Inkling / Weaver).
2. **A simple launcher / app-switcher** so you can hop between the three.
3. **Per-app PWA identity** (manifest + install) so each can live on the home screen
   on its own.
4. Move cross-app links to the switcher; keep the shared account + backend.

*Status: named & specified (this doc). Implementation = incremental, one app at a
time, lowest-risk first (Inkling and Weaver are already standalone pages; Orbit is
the calendar PWA).*

/**
 * Built-in flashcard decks — ready-made questionnaires that ship with the app so
 * there's something to study without sign-in or server generation. Each deck uses
 * the same shape the Haiku generator produces (see flashcardsModel.js), with
 * STABLE ids so re-seeding never duplicates and preserves a learner's progress.
 *
 * Cards: { id, q, a, type, fig?, figA? }
 *   - type: "concept" | "problem"
 *   - fig : optional SVG markup shown under the QUESTION (a small graph)
 *   - figA: optional SVG shown under the ANSWER (e.g. the same graph with the
 *           answer marked); falls back to `fig` when omitted.
 *
 * Bump a deck's `seedVersion` when its cards change; ensureSeedDecks() then
 * refreshes an already-seeded copy (carrying over per-card status by id).
 *
 * The Precalculus deck mirrors OpenStax "Precalculus 2e" §1.1 (CC BY 4.0): every
 * worked Example, every "Try It", and the Verbal exercises are transcribed. The
 * figure-based Graphical/Technology exercises depend on the book's own graphs
 * (whose answer key isn't on the page), so those cards are ORIGINAL problems
 * authored in the same style, with graphs we draw here and answers we control.
 */

// ── Tiny coordinate-grid SVG helpers (domain & range −5…5) ──────────────
const U = 18, O = 100;                         // px per unit, origin offset
const sx = (x) => (O + x * U).toFixed(1);
const sy = (y) => (O - y * U).toFixed(1);

const GRID = (() => {
  let g = "";
  for (let i = -5; i <= 5; i++) {
    g += `<line x1="${sx(i)}" y1="${sy(-5)}" x2="${sx(i)}" y2="${sy(5)}" stroke="rgba(255,255,255,0.06)"/>`;
    g += `<line x1="${sx(-5)}" y1="${sy(i)}" x2="${sx(5)}" y2="${sy(i)}" stroke="rgba(255,255,255,0.06)"/>`;
  }
  // axes
  g += `<line x1="${sx(-5)}" y1="${sy(0)}" x2="${sx(5)}" y2="${sy(0)}" stroke="rgba(255,255,255,0.55)" stroke-width="1.4"/>`;
  g += `<line x1="${sx(0)}" y1="${sy(-5)}" x2="${sx(0)}" y2="${sy(5)}" stroke="rgba(255,255,255,0.55)" stroke-width="1.4"/>`;
  // numbered ticks so values can actually be read off the graph
  const lbl = "fill=\"rgba(255,255,255,0.6)\" font-size=\"7.5\" font-family=\"system-ui\"";
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    g += `<line x1="${sx(i)}" y1="${(+sy(0) - 2.5).toFixed(1)}" x2="${sx(i)}" y2="${(+sy(0) + 2.5).toFixed(1)}" stroke="rgba(255,255,255,0.55)"/>`;
    g += `<text x="${sx(i)}" y="${(+sy(0) + 10).toFixed(1)}" text-anchor="middle" ${lbl}>${i}</text>`;
    g += `<line x1="${(+sx(0) - 2.5).toFixed(1)}" y1="${sy(i)}" x2="${(+sx(0) + 2.5).toFixed(1)}" y2="${sy(i)}" stroke="rgba(255,255,255,0.55)"/>`;
    g += `<text x="${(+sx(0) - 5).toFixed(1)}" y="${(+sy(i) + 2.6).toFixed(1)}" text-anchor="end" ${lbl}>${i}</text>`;
  }
  g += `<text x="${(+sx(0) - 4).toFixed(1)}" y="${(+sy(0) + 10).toFixed(1)}" text-anchor="end" ${lbl}>0</text>`;
  g += `<text x="${(+sx(5) - 1).toFixed(1)}" y="${(+sy(0) - 4).toFixed(1)}" text-anchor="end" ${lbl}>x</text>`;
  g += `<text x="${(+sx(0) + 5).toFixed(1)}" y="${(+sy(5) + 6).toFixed(1)}" ${lbl}>y</text>`;
  return g;
})();

/** Path for y = f(x) over [a,b], lifting the pen when it leaves the view. */
function plot(f, a = -5, b = 5, step = 0.15) {
  let d = "", pen = true;
  for (let x = a; x <= b + 1e-9; x += step) {
    const y = f(x);
    if (!isFinite(y) || y < -5.4 || y > 5.4) { pen = true; continue; }
    d += (pen ? "M" : "L") + sx(x) + " " + sy(y) + " "; pen = false;
  }
  return `<path d="${d.trim()}" fill="none" stroke="#f0abfc" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
}
/** Path for x = g(y) (a sideways curve / relation) over y in [a,b]. */
function plotX(g, a = -5, b = 5, step = 0.15) {
  let d = "", pen = true;
  for (let y = a; y <= b + 1e-9; y += step) {
    const x = g(y);
    if (!isFinite(x) || x < -5.4 || x > 5.4) { pen = true; continue; }
    d += (pen ? "M" : "L") + sx(x) + " " + sy(y) + " "; pen = false;
  }
  return `<path d="${d.trim()}" fill="none" stroke="#f0abfc" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const dot   = (x, y, c = "#86efac") => `<circle cx="${sx(x)}" cy="${sy(y)}" r="3.6" fill="${c}"/>`;
const cdot  = (x, y, c = "#f0abfc") => `<circle cx="${sx(x)}" cy="${sy(y)}" r="3.8" fill="${c}"/>`;              // closed endpoint (included)
const odot  = (x, y, c = "#f0abfc") => `<circle cx="${sx(x)}" cy="${sy(y)}" r="3.6" fill="#0b0f1a" stroke="${c}" stroke-width="1.8"/>`; // open endpoint (excluded)
// a marked answer point with its coordinate label, so the answer ties to the picture
const mark = (x, y, label, c = "#86efac") => dot(x, y, c) +
  `<text x="${(+sx(x) + 6).toFixed(1)}" y="${(+sy(y) - 4).toFixed(1)}" fill="${c}" font-size="8.5" font-family="system-ui" font-weight="700">${label}</text>`;
const hline = (y) => `<line x1="${sx(-5)}" y1="${sy(y)}" x2="${sx(5)}" y2="${sy(y)}" stroke="#facc15" stroke-width="1.6" stroke-dasharray="4 3"/>`;
const seg   = (x1, y1, x2, y2, c = "#facc15") => `<line x1="${sx(x1)}" y1="${sy(y1)}" x2="${sx(x2)}" y2="${sy(y2)}" stroke="${c}" stroke-width="1.9" stroke-dasharray="5 3"/>`; // secant / connector
const circle = `<circle cx="${sx(0)}" cy="${sy(0)}" r="${(3 * U).toFixed(1)}" fill="none" stroke="#f0abfc" stroke-width="2.6"/>`;
function fig(...inner) {
  // No fixed width/height: the viewBox makes it scale to its container, so the
  // same SVG renders small in-card and large in the zoom overlay.
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" ` +
    `style="width:100%;height:auto;display:block;background:rgba(255,255,255,0.03);border-radius:8px">` +
    `${GRID}${inner.join("")}</svg>`;
}

/**
 * A 6-panel "select all that are functions" composite (vertical line test).
 * Recreates a multi-graph homework item in one figure; showAnswer adds ✓/✗.
 */
function vltSelectAll(showAnswer) {
  const S = 8, PW = 100, GAP = 6, cols = 2, rows = 3;
  const W = cols * PW + (cols + 1) * GAP, H = rows * PW + (rows + 1) * GAP;
  const items = [
    { kind: "fn",  f: (x) => 2 * Math.sin(Math.PI * x / 2) },   // 1 sine wave
    { kind: "fn",  f: (x) => -2.8 * x + 1.7 },                  // 2 steep line
    { kind: "fn",  f: (x) => 6 * x * x * x + 9 * x * x - 2 },   // 3 cubic
    { kind: "fn",  f: () => -2 },                               // 4 horizontal line
    { kind: "ellipse", cx: -0.7, cy: -2, rx: 1.2, ry: 1.0 },   // 5 ellipse
    { kind: "fnx", g: (y) => y * y - 2 }                        // 6 sideways parabola
  ];
  const isFn = [true, true, true, true, false, false];
  let out = "";
  items.forEach((it, i) => {
    const col = i % cols, row = (i / cols) | 0;
    const ox = GAP + col * (PW + GAP), oy = GAP + row * (PW + GAP);
    const cx = ox + PW / 2, cy = oy + PW / 2;
    const LX = (x) => (cx + x * S).toFixed(1);
    const LY = (y) => (cy - y * S).toFixed(1);
    out += `<rect x="${ox}" y="${oy}" width="${PW}" height="${PW}" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.14)" rx="6"/>`;
    out += `<line x1="${ox + 6}" y1="${LY(0)}" x2="${ox + PW - 6}" y2="${LY(0)}" stroke="rgba(255,255,255,0.35)"/>`;
    out += `<line x1="${LX(0)}" y1="${oy + 6}" x2="${LX(0)}" y2="${oy + PW - 6}" stroke="rgba(255,255,255,0.35)"/>`;
    const trace = (pts) => { let d = "", pen = true; for (const [x, y] of pts) { if (x == null) { pen = true; continue; } d += (pen ? "M" : "L") + LX(x) + " " + LY(y) + " "; pen = false; } return `<path d="${d.trim()}" fill="none" stroke="#3b82f6" stroke-width="2"/>`; };
    if (it.kind === "fn") {
      const pts = []; for (let x = -4.7; x <= 4.7; x += 0.08) { const y = it.f(x); pts.push((isFinite(y) && y >= -4.7 && y <= 4.7) ? [x, y] : [null]); }
      out += trace(pts);
    } else if (it.kind === "fnx") {
      const pts = []; for (let y = -4.7; y <= 4.7; y += 0.08) { const x = it.g(y); pts.push((isFinite(x) && x >= -4.7 && x <= 4.7) ? [x, y] : [null]); }
      out += trace(pts);
    } else if (it.kind === "ellipse") {
      out += `<ellipse cx="${LX(it.cx)}" cy="${LY(it.cy)}" rx="${(it.rx * S).toFixed(1)}" ry="${(it.ry * S).toFixed(1)}" fill="none" stroke="#3b82f6" stroke-width="2"/>`;
    }
    out += `<text x="${ox + 8}" y="${oy + 16}" fill="rgba(255,255,255,0.85)" font-size="12" font-family="system-ui" font-weight="700">${i + 1}</text>`;
    if (showAnswer) {
      const ok = isFn[i];
      out += `<text x="${ox + PW - 8}" y="${oy + 17}" text-anchor="end" font-size="15" font-family="system-ui" font-weight="800" fill="${ok ? "#22c55e" : "#ef4444"}">${ok ? "✓" : "✗"}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;background:rgba(255,255,255,0.03);border-radius:8px">${out}</svg>`;
}

const VLT_Q = "Does this graph represent y as a function of x?";
const HLT_Q = "Is the function shown one-to-one?";

export const SEED_DECKS = [
  {
    id: "seed_precalc_1_1",
    seedVersion: 5,
    topic: "OpenStax Precalculus",
    section: "1.1 · Functions and Function Notation",
    cards: [
      // ── Worked Examples ──────────────────────────────────────────────
      { id: "pc1_1_ex01", type: "concept",
        q: "A menu lists items and prices, and several items share the same price. (a) Is price a function of the item? (b) Is the item a function of the price?",
        a: "(a) Yes — each item has exactly one price. (b) No — one price can belong to several different items." },
      { id: "pc1_1_ex02", type: "concept",
        q: "A class converts each percent grade to a GPA (e.g. 90–100 → 4.0). (a) Is GPA a function of percent grade? (b) Is percent grade a function of GPA?",
        a: "(a) Yes — each percent grade gives one GPA. (b) No — many percent grades map to the same GPA." },
      { id: "pc1_1_ex03", type: "concept",
        q: "Using the months of the year, write the number of days in a month in function notation.",
        a: "d = f(m), where m is the month and d the number of days. For example, f(March) = 31." },
      { id: "pc1_1_ex04", type: "concept",
        q: "A town's police force is N = f(y), the number of officers in year y. What does f(2005) = 300 mean?",
        a: "In the year 2005 the town had 300 police officers." },
      { id: "pc1_1_ex05", type: "concept",
        q: "When does a table of inputs and outputs fail to represent a function?",
        a: "When the same input value appears with two different outputs (e.g. input 5 paired with two outputs). Then that input has more than one output." },
      { id: "pc1_1_ex06", type: "problem",
        q: "For f(x) = x² + 3x − 4, find (a) f(2), (b) f(a), (c) f(a + h), (d) the difference quotient [f(a + h) − f(a)] / h.",
        a: "(a) 6.  (b) a² + 3a − 4.  (c) a² + 2ah + h² + 3a + 3h − 4.  (d) 2a + h + 3." },
      { id: "pc1_1_ex07", type: "problem",
        q: "Given h(p) = p² + 2p, evaluate h(4).",
        a: "h(4) = 4² + 2(4) = 16 + 8 = 24." },
      { id: "pc1_1_ex08", type: "problem",
        q: "Given h(p) = p² + 2p, solve h(p) = 3.",
        a: "p² + 2p = 3 → p² + 2p − 3 = 0 → (p + 3)(p − 1) = 0 → p = 1 or p = −3." },
      { id: "pc1_1_ex09", type: "problem",
        q: "Express the equation 2n + 6p = 12 as a function p = f(n).",
        a: "6p = 12 − 2n → p = f(n) = 2 − (1/3)n." },
      { id: "pc1_1_ex10", type: "problem",
        q: "Does the circle x² + y² = 1 define y as a function of x?",
        a: "No. Solving gives y = ±√(1 − x²); most x-values produce two y-values, so it fails the definition (and the vertical line test)." },
      { id: "pc1_1_ex11", type: "problem",
        q: "From a table for g: (a) evaluate g(3); (b) solve g(n) = 6, where the table shows g(2) = 6 and g(4) = 6.",
        a: "(a) g(3) = 7 (read off the table).  (b) n = 2 or n = 4 — both inputs whose output is 6." },
      { id: "pc1_1_ex12", type: "problem",
        q: "From the graph of f: (a) evaluate f(2); (b) solve f(x) = 4.",
        a: "(a) f(2) = 1 (the height of the curve at x = 2).  (b) x = −1 or x = 3 (where the curve has height 4)." },
      { id: "pc1_1_ex13", type: "concept",
        q: "The area of a circle is A = πr². (a) Is area a function of radius? (b) Is that function one-to-one?",
        a: "(a) Yes — each radius gives exactly one area. (b) Yes — each positive area comes from exactly one radius." },
      { id: "pc1_1_ex14", type: "concept",
        q: "How can you tell from a graph whether it represents y as a function of x?",
        a: "Use the vertical line test: if any vertical line meets the graph more than once, the graph is NOT a function." },
      { id: "pc1_1_ex15", type: "concept",
        q: "How can you tell from a graph whether a function is one-to-one?",
        a: "Use the horizontal line test: if any horizontal line meets the graph more than once, the function is NOT one-to-one." },

      // ── Try It ───────────────────────────────────────────────────────
      { id: "pc1_1_ti01", type: "concept",
        q: "Players are listed with a unique rank (1, 2, 3, …). (a) Is rank a function of player name? (b) Is player name a function of rank?",
        a: "(a) Yes — each name has one rank. (b) Yes — each rank belongs to one player." },
      { id: "pc1_1_ti02", type: "concept",
        q: "Use function notation to express the weight of a growing pig (in pounds) as a function of its age in days, d.",
        a: "w = f(d): the pig's weight is a function of its age d in days." },
      { id: "pc1_1_ti03", type: "problem",
        q: "A table has inputs 1, 2, 3 with outputs 10, 100, 1000. Does it represent a function?",
        a: "Yes — each input value is paired with exactly one output value." },
      { id: "pc1_1_ti04", type: "problem",
        q: "Given g(m) = √(m − 4), evaluate g(5).",
        a: "g(5) = √(5 − 4) = √1 = 1." },
      { id: "pc1_1_ti05", type: "problem",
        q: "Given g(m) = √(m − 4), solve g(m) = 2.",
        a: "√(m − 4) = 2 → m − 4 = 4 → m = 8." },
      { id: "pc1_1_ti06", type: "problem",
        q: "If x − 8y³ = 0, express y as a function of x.",
        a: "8y³ = x → y³ = x/8 → y = ∛(x/8) = (∛x)/2." },
      { id: "pc1_1_ti07", type: "problem",
        q: "Using the table for g, evaluate g(1).",
        a: "g(1) = 8 (read directly from the table)." },
      { id: "pc1_1_ti08", type: "concept",
        q: "From the graph of f, how do you solve f(x) = 1?",
        a: "Draw the horizontal line y = 1 and read off every x-value where it crosses the graph — those are the solutions." },
      { id: "pc1_1_ti09", type: "concept",
        q: "For bank accounts: (a) Is balance a function of account number? (b) Is account number a function of balance? (c) Is balance one-to-one with account number?",
        a: "(a) Yes — each account has one balance. (b) No — one balance could belong to several accounts. (c) No — two different accounts can share the same balance." },
      { id: "pc1_1_ti10", type: "concept",
        q: "Each percent grade maps to exactly one letter grade. (a) Is letter grade a function of percent grade? (b) Is it one-to-one?",
        a: "(a) Yes — each percent grade gives one letter grade. (b) No — many percent grades produce the same letter grade." },
      { id: "pc1_1_ti11", type: "concept",
        q: "How do you check whether a given graph represents a function?",
        a: "Apply the vertical line test — no vertical line may touch the graph more than once." },
      { id: "pc1_1_ti12", type: "concept",
        q: "A graph fails the vertical line test. Can it still be a one-to-one function?",
        a: "No. If it isn't a function at all, it can't be a one-to-one function." },

      // ── Verbal exercises ────────────────────────────────────────────
      { id: "pc1_1_v1", type: "concept",
        q: "What is the difference between a relation and a function?",
        a: "A relation is any set of ordered pairs. A function is a relation in which each input is paired with exactly one output." },
      { id: "pc1_1_v2", type: "concept",
        q: "What is the difference between the input and the output of a function?",
        a: "The input is the independent value you supply (from the domain); the output is the value the function returns (from the range)." },
      { id: "pc1_1_v3", type: "concept",
        q: "Why does the vertical line test work?",
        a: "A vertical line fixes a single input x. If it meets the graph twice, that input has two outputs, which violates the definition of a function." },
      { id: "pc1_1_v4", type: "concept",
        q: "How does the horizontal line test work, and what does it tell you?",
        a: "If any horizontal line meets the graph more than once, two different inputs share an output — so the function is not one-to-one." },
      { id: "pc1_1_v5", type: "concept",
        q: "If every output of a function comes from exactly one input, what kind of function is it?",
        a: "A one-to-one function." },

      // ── Real-world application ──────────────────────────────────────
      { id: "pc1_1_r1", type: "problem",
        q: "Show that f(x) = 3(x − 5)² + 7 is not a one-to-one function.",
        a: "Inputs equidistant from 5 share an output: f(6) = 3(1)² + 7 = 10 and f(4) = 3(−1)² + 7 = 10. Two inputs give the same output, so it isn't one-to-one." },

      // ── Graphical: vertical line test ───────────────────────────────
      { id: "pc1_1_g01", type: "concept", q: VLT_Q,
        a: "Yes. Every vertical line meets this parabola exactly once, so it passes the vertical line test.",
        fig: fig(plot((x) => x * x - 3)) },
      { id: "pc1_1_g02", type: "concept", q: VLT_Q,
        a: "No. A vertical line through the circle meets it twice, so one input has two outputs — it fails the vertical line test.",
        fig: fig(circle) },
      { id: "pc1_1_g03", type: "concept", q: VLT_Q,
        a: "No. Vertical lines cross this sideways parabola twice, so it fails the vertical line test.",
        fig: fig(plotX((y) => y * y - 3)) },

      // ── Graphical: read values from a graph ─────────────────────────
      { id: "pc1_1_g04", type: "problem",
        q: "Read off the graph: (a) the height of the curve at x = 2, i.e. f(2); and (b) the x-value where the curve reaches a height of 3, i.e. where f(x) = 3.",
        a: "(a) f(2) = 2 — at x = 2 the line is 2 high.   (b) f(x) = 3 at x = 4 — the line reaches height 3 there.",
        fig:  fig(plot((x) => 0.5 * x + 1)),
        figA: fig(plot((x) => 0.5 * x + 1), hline(3), mark(2, 2, "(2, 2)"), mark(4, 3, "(4, 3)")) },
      { id: "pc1_1_g05", type: "problem",
        q: "Read off the graph: (a) the height of the curve at x = 1, i.e. f(1); and (b) every x-value where the curve reaches a height of 3, i.e. where f(x) = 3.",
        a: "(a) f(1) = 0 — at x = 1 the curve sits on the x-axis.   (b) f(x) = 3 at x = −2 and x = 2 — the curve is 3 high at both.",
        fig:  fig(plot((x) => x * x - 1)),
        figA: fig(plot((x) => x * x - 1), hline(3), mark(1, 0, "(1, 0)"), mark(-2, 3, "(−2, 3)"), mark(2, 3, "(2, 3)")) },

      // ── Graphical: horizontal line test ─────────────────────────────
      { id: "pc1_1_g06", type: "concept", q: HLT_Q,
        a: "Yes. Every horizontal line meets this line exactly once, so it passes the horizontal line test.",
        fig:  fig(plot((x) => 0.5 * x + 1)),
        figA: fig(plot((x) => 0.5 * x + 1), hline(2), dot(2, 2)) },
      { id: "pc1_1_g07", type: "concept", q: HLT_Q,
        a: "No. The line y = 3 meets the parabola twice (x = −2 and x = 2), so it fails the horizontal line test.",
        fig:  fig(plot((x) => x * x - 1)),
        figA: fig(plot((x) => x * x - 1), hline(3), dot(-2, 3), dot(2, 3)) },
      { id: "pc1_1_g08", type: "concept", q: HLT_Q,
        a: "Yes. Every horizontal line crosses this increasing cubic exactly once — it passes the horizontal line test.",
        fig:  fig(plot((x) => x * x * x, -1.7, 1.7)),
        figA: fig(plot((x) => x * x * x, -1.7, 1.7), hline(2), dot(Math.cbrt(2), 2)) },

      // ── Technology: graph a toolkit function, state the range ───────
      { id: "pc1_1_g09", type: "problem",
        q: "Graph f(x) = x² on the domain −2 ≤ x ≤ 2 and state the range.",
        a: "Range: 0 ≤ y ≤ 4.",
        fig: fig(plot((x) => x * x, -2, 2), dot(0, 0, "#f0abfc"), dot(-2, 4), dot(2, 4)) },
      { id: "pc1_1_g10", type: "problem",
        q: "Graph f(x) = √x on the domain 0 ≤ x ≤ 4 and state the range.",
        a: "Range: 0 ≤ y ≤ 2.",
        fig: fig(plot(Math.sqrt, 0, 4), dot(0, 0), dot(4, 2)) },
      { id: "pc1_1_g11", type: "problem",
        q: "Graph f(x) = x³ on the domain −1 ≤ x ≤ 1 and state the range.",
        a: "Range: −1 ≤ y ≤ 1.",
        fig: fig(plot((x) => x * x * x, -1, 1), dot(-1, -1), dot(1, 1)) },
      { id: "pc1_1_g12", type: "problem",
        q: "Graph f(x) = |x| on the domain −3 ≤ x ≤ 3 and state the range.",
        a: "Range: 0 ≤ y ≤ 3.",
        fig: fig(plot(Math.abs, -3, 3), dot(0, 0, "#f0abfc"), dot(-3, 3), dot(3, 3)) }
    ]
  },
  {
    id: "seed_precalc_1_2",
    seedVersion: 3,
    topic: "OpenStax Precalculus",
    section: "1.2 · Domain and Range",
    cards: [
      // ── Key definitions ─────────────────────────────────────────────
      { id: "pc1_2_def_dom", type: "concept",
        q: "What is the domain of a function?",
        a: "The set of all possible input (x) values for which the function is defined." },
      { id: "pc1_2_def_rng", type: "concept",
        q: "What is the range of a function?",
        a: "The set of all possible output (y) values the function produces." },
      { id: "pc1_2_def_int", type: "concept",
        q: "In interval notation, when do you use a bracket [ ] versus a parenthesis ( )?",
        a: "A bracket includes the endpoint (≤ or ≥); a parenthesis excludes it (< or >). Always use parentheses with −∞ and ∞." },
      { id: "pc1_2_def_set", type: "concept",
        q: "What does the set-builder notation {x | 10 ≤ x < 30} mean?",
        a: "“The set of all x such that 10 ≤ x < 30.” The bar | reads as “such that.”" },
      { id: "pc1_2_def_pw", type: "concept",
        q: "What is a piecewise-defined function?",
        a: "A function that uses different formulas on different parts of its domain, each formula applying over a stated interval." },

      // ── Worked Examples ─────────────────────────────────────────────
      { id: "pc1_2_ex01", type: "problem",
        q: "Find the domain of {(2, 10), (3, 10), (4, 20), (5, 30), (6, 40)}.",
        a: "{2, 3, 4, 5, 6} — the set of first coordinates." },
      { id: "pc1_2_ex02", type: "problem",
        q: "Find the domain of f(x) = x² − 1.",
        a: "(−∞, ∞) — any real number can be squared and shifted." },
      { id: "pc1_2_ex03", type: "problem",
        q: "Find the domain of f(x) = (x + 1)/(2 − x).",
        a: "Denominator 2 − x = 0 at x = 2, so exclude it: (−∞, 2) ∪ (2, ∞)." },
      { id: "pc1_2_ex04", type: "problem",
        q: "Find the domain of f(x) = √(7 − x).",
        a: "Radicand ≥ 0: 7 − x ≥ 0 → x ≤ 7. Domain (−∞, 7]." },
      { id: "pc1_2_ex05", type: "problem",
        q: "Write “1 ≤ x ≤ 3 or x > 5” in set-builder and interval notation.",
        a: "Set-builder: {x | 1 ≤ x ≤ 3 or x > 5}.  Interval: [1, 3] ∪ (5, ∞)." },
      { id: "pc1_2_ex06", type: "problem",
        q: "A graph runs horizontally from x = −3 (excluded) to x = 1 (included), and vertically from y = −4 to y = 0. Give the domain and range.",
        a: "Domain (−3, 1];  Range [−4, 0]." },
      { id: "pc1_2_ex07", type: "problem",
        q: "An oil-production graph spans the years 1973–2008 with output from 180 to 2010 thousand barrels/day. Give the domain and range.",
        a: "Domain [1973, 2008];  Range [180, 2010]." },
      { id: "pc1_2_ex08", type: "problem",
        q: "Find the domain and range of f(x) = 2x³ − x.",
        a: "Both (−∞, ∞) — an odd-degree polynomial takes every real input and output." },
      { id: "pc1_2_ex09", type: "problem",
        q: "Find the domain and range of f(x) = 2/(x + 1).",
        a: "Domain (−∞, −1) ∪ (−1, ∞);  Range (−∞, 0) ∪ (0, ∞) — the output is never 0." },
      { id: "pc1_2_ex10", type: "problem",
        q: "Find the domain and range of f(x) = 2√(x + 4).",
        a: "Domain [−4, ∞);  Range [0, ∞) — it starts at f(−4) = 0 and increases without bound." },
      { id: "pc1_2_ex11", type: "problem",
        q: "A museum charges $5 per person for groups of 1–9, or a flat $50 for groups of 10+. Write the cost function C(n).",
        a: "C(n) = 5n for 0 < n < 10;  C(n) = 50 for n ≥ 10." },
      { id: "pc1_2_ex12", type: "problem",
        q: "For C(g) = {25 if 0 < g < 2; 25 + 10(g − 2) if g ≥ 2}, find C(1.5) and C(4).",
        a: "C(1.5) = 25 (first piece).  C(4) = 25 + 10(2) = 45 (second piece)." },
      { id: "pc1_2_ex13", type: "concept",
        q: "How do you graph a piecewise function like f(x) = {x² if x ≤ 1; 3 if 1 < x ≤ 2; x if x > 2}?",
        a: "Graph each formula only over its own interval; mark included endpoints with a closed dot and excluded endpoints with an open dot." },

      // ── Try It ──────────────────────────────────────────────────────
      { id: "pc1_2_ti01", type: "problem",
        q: "Find the domain of {(−5, 4), (0, 0), (5, −4), (10, −8), (15, −12)}.",
        a: "{−5, 0, 5, 10, 15}." },
      { id: "pc1_2_ti02", type: "problem",
        q: "Find the domain of f(x) = 5 − x + x³.",
        a: "(−∞, ∞) — it's a polynomial, defined for every real number." },
      { id: "pc1_2_ti03", type: "problem",
        q: "Find the domain of f(x) = (1 + 4x)/(2x − 1).",
        a: "2x − 1 = 0 at x = 1/2, so domain (−∞, 1/2) ∪ (1/2, ∞)." },
      { id: "pc1_2_ti04", type: "problem",
        q: "Find the domain of f(x) = √(5 + 2x).",
        a: "5 + 2x ≥ 0 → x ≥ −5/2. Domain [−5/2, ∞)." },
      { id: "pc1_2_ti05", type: "problem",
        q: "Combine “x ≥ −2” with “−1 ≤ x < 3” into a single interval.",
        a: "The second piece sits inside the first, so the union simplifies to [−2, ∞)." },
      { id: "pc1_2_ti06", type: "problem",
        q: "A world-population graph spans 1950–2010 with values ≈ 2.5 to 7 billion. Give the domain and range.",
        a: "Domain [1950, 2010];  Range [2.5, 7] (billions)." },
      { id: "pc1_2_ti07", type: "problem",
        q: "Find the domain and range of f(x) = −√(2 − x).",
        a: "Domain (−∞, 2] (need 2 − x ≥ 0);  Range (−∞, 0] (the leading − makes every output ≤ 0)." },
      { id: "pc1_2_ti08", type: "problem",
        q: "Find the domain of f(x) = {x³ if x < −1; −2 if −1 < x < 4; x if x > 4}.",
        a: "Every real except the gaps at x = −1 and x = 4: (−∞, −1) ∪ (−1, 4) ∪ (4, ∞)." },

      // ── Verbal exercises ────────────────────────────────────────────
      { id: "pc1_2_v1", type: "concept",
        q: "Why can the domain differ from one function to another?",
        a: "Different operations restrict inputs: division forbids a zero denominator, and an even root forbids a negative radicand, etc." },
      { id: "pc1_2_v2", type: "concept",
        q: "How do you find the domain of a function defined by an equation?",
        a: "Start with all real numbers, then exclude any input that makes a denominator zero or puts a negative under an even root." },
      { id: "pc1_2_v3", type: "concept",
        q: "Why does f(x) = ∛x have a different domain than f(x) = √x?",
        a: "Cube roots accept negatives, so ∛x has domain (−∞, ∞); square roots need a nonnegative radicand, so √x has domain [0, ∞)." },
      { id: "pc1_2_v4", type: "concept",
        q: "When do you use a parenthesis instead of a bracket in interval notation?",
        a: "Use a parenthesis when the endpoint is excluded (< or >) or is ±∞; use a bracket when it is included (≤ or ≥)." },
      { id: "pc1_2_v5", type: "concept",
        q: "How do you graph a piecewise function?",
        a: "Graph each piece only over its own interval, marking included endpoints with closed dots and excluded ones with open dots." },

      // ── Algebraic: find the domain (answers verified) ───────────────
      { id: "pc1_2_a08", type: "problem",
        q: "Find the domain of f(x) = 3/(x − 2).",
        a: "(−∞, 2) ∪ (2, ∞)." },
      { id: "pc1_2_a09", type: "problem",
        q: "Find the domain of f(x) = 3 − √(6 − 2x).",
        a: "6 − 2x ≥ 0 → x ≤ 3. Domain (−∞, 3]." },
      { id: "pc1_2_a10", type: "problem",
        q: "Find the domain of f(x) = √(4 − 3x).",
        a: "4 − 3x ≥ 0 → x ≤ 4/3. Domain (−∞, 4/3]." },
      { id: "pc1_2_a15", type: "problem",
        q: "Find the domain of f(x) = (3x + 1)/(4x + 2).",
        a: "4x + 2 = 0 at x = −1/2. Domain (−∞, −1/2) ∪ (−1/2, ∞)." },
      { id: "pc1_2_a17", type: "problem",
        q: "Find the domain of f(x) = (x − 3)/(x² + 9x − 22).",
        a: "Denominator (x + 11)(x − 2) = 0 at x = −11, 2. Domain (−∞, −11) ∪ (−11, 2) ∪ (2, ∞)." },
      { id: "pc1_2_a18", type: "problem",
        q: "Find the domain of f(x) = 1/(x² − x − 6).",
        a: "Denominator (x − 3)(x + 2) = 0 at x = 3, −2. Domain (−∞, −2) ∪ (−2, 3) ∪ (3, ∞)." },
      { id: "pc1_2_a21", type: "problem",
        q: "Find the domain of f(x) = (2x + 1)/√(5 − x).",
        a: "5 − x must be > 0 (under a root AND in a denominator): x < 5. Domain (−∞, 5)." },
      { id: "pc1_2_a22", type: "problem",
        q: "Find the domain of f(x) = (x − 4)/√(x − 6).",
        a: "x − 6 must be > 0: x > 6. Domain (6, ∞)." },
      { id: "pc1_2_a24", type: "problem",
        q: "Find the domain of f(x) = √x / x.",
        a: "Need x ≥ 0 for the root and x ≠ 0 for the denominator → x > 0. Domain (0, ∞)." },
      { id: "pc1_2_a25", type: "problem",
        q: "Find the domain of f(x) = (x² − 9x)/(x² − 81).",
        a: "Denominator (x − 9)(x + 9) = 0 at x = ±9 (x = 0 is fine). Domain (−∞, −9) ∪ (−9, 9) ∪ (9, ∞)." },

      // ── Numeric: evaluate piecewise functions ───────────────────────
      { id: "pc1_2_n46", type: "problem",
        q: "For f(x) = {x + 1 if x < −2;  −2x − 3 if x ≥ −2}, find f(−3), f(−2), f(−1), f(0).",
        a: "f(−3) = −2;  f(−2) = 1;  f(−1) = −1;  f(0) = −3." },
      { id: "pc1_2_n49", type: "problem",
        q: "For f(x) = {7x + 3 if x < 0;  7x + 6 if x ≥ 0}, find f(−1), f(0), f(2), f(4).",
        a: "f(−1) = −4;  f(0) = 6;  f(2) = 20;  f(4) = 34." },
      { id: "pc1_2_n51", type: "problem",
        q: "For f(x) = {5x if x < 0;  3 if 0 ≤ x ≤ 3;  x² if x > 3}, find f(−1), f(0), f(2), f(4).",
        a: "f(−1) = −5;  f(0) = 3;  f(2) = 3;  f(4) = 16." },

      // ── Real-world applications ─────────────────────────────────────
      { id: "pc1_2_r60", type: "problem",
        q: "A ball's height is h(t) = −16t² + 96t (feet, t in seconds). What is the domain in context?",
        a: "It's airborne from launch until it lands: h = 0 at t = 0 and t = 6, so the domain is [0, 6] seconds." },
      { id: "pc1_2_r61", type: "problem",
        q: "Cost is C(x) = 10x + 500. (a) Fixed cost? (b) Cost of 25 items? (c) Domain and range if cost may not exceed $1500?",
        a: "(a) C(0) = $500.  (b) C(25) = $750.  (c) 10x + 500 ≤ 1500 → x ≤ 100, so domain [0, 100] and range [500, 1500]." },

      // ── Graphical: read domain & range from a graph ─────────────────
      { id: "pc1_2_g01", type: "problem",
        q: "From the graph, write the domain and range in interval notation. (Open dot = excluded, closed dot = included.)",
        a: "Domain (−3, 1];  Range [−4, 0].",
        fig: fig(plot((x) => x - 1, -3, 1), odot(-3, -4), cdot(1, 0)) },
      { id: "pc1_2_g02", type: "problem",
        q: "From the graph of f(x) = 2√(x + 4), write the domain and range.",
        a: "Domain [−4, ∞);  Range [0, ∞).",
        fig: fig(plot((x) => 2 * Math.sqrt(x + 4), -4, 5), cdot(-4, 0)) },
      { id: "pc1_2_g03", type: "problem",
        q: "From the graph of f(x) = 1/x, write the domain and range.",
        a: "Domain (−∞, 0) ∪ (0, ∞);  Range (−∞, 0) ∪ (0, ∞) — the curve never touches either axis.",
        fig: fig(plot((x) => 1 / x, -5, -0.2), plot((x) => 1 / x, 0.2, 5)) },
      { id: "pc1_2_g04", type: "problem",
        q: "The graph shows f(x) = {3 if x < 0;  x if x ≥ 0}. Read off f(−2) and f(2).",
        a: "f(−2) = 3 — left of 0 the graph is the flat line y = 3.  f(2) = 2 — right of 0 it's the line y = x.",
        fig:  fig(plot(() => 3, -5, -0.1), odot(0, 3), plot((x) => x, 0, 5), cdot(0, 0)),
        figA: fig(plot(() => 3, -5, -0.1), odot(0, 3), plot((x) => x, 0, 5), cdot(0, 0), mark(-2, 3, "(−2, 3)"), mark(2, 2, "(2, 2)")) }
    ]
  },
  {
    id: "seed_precalc_1_3",
    seedVersion: 1,
    topic: "OpenStax Precalculus",
    section: "1.3 · Rates of Change & Behavior of Graphs",
    cards: [
      // ── Key definitions ─────────────────────────────────────────────
      { id: "pc1_3_def_arc", type: "concept",
        q: "What is the average rate of change of a function, and what is its formula?",
        a: "How much the output changes per unit change in input over an interval: Δy/Δx = (f(x₂) − f(x₁)) / (x₂ − x₁)." },
      { id: "pc1_3_def_inc", type: "concept",
        q: "What does it mean for a function to be increasing on an interval?",
        a: "As x increases across the interval, f(x) also increases: for any a < b in it, f(a) < f(b). The graph rises left-to-right." },
      { id: "pc1_3_def_dec", type: "concept",
        q: "What does it mean for a function to be decreasing on an interval?",
        a: "As x increases across the interval, f(x) decreases: for any a < b in it, f(a) > f(b). The graph falls left-to-right." },
      { id: "pc1_3_def_lmax", type: "concept",
        q: "What is a local (relative) maximum?",
        a: "A point where the function changes from increasing to decreasing — higher than all nearby points (f(b) ≥ f(x) near b), though not necessarily the highest overall." },
      { id: "pc1_3_def_lmin", type: "concept",
        q: "What is a local (relative) minimum?",
        a: "A point where the function changes from decreasing to increasing — lower than all nearby points (f(b) ≤ f(x) near b)." },
      { id: "pc1_3_def_amax", type: "concept",
        q: "What is the absolute (global) maximum of a function?",
        a: "The single highest output over the entire domain: f(c) ≥ f(x) for every x in the domain." },
      { id: "pc1_3_def_amin", type: "concept",
        q: "What is the absolute (global) minimum of a function?",
        a: "The single lowest output over the entire domain: f(d) ≤ f(x) for every x in the domain." },

      // ── Average rate of change: computations ────────────────────────
      { id: "pc1_3_e01", type: "problem",
        q: "Gas cost $2.84 in 2007 and $2.41 in 2009. Find the average rate of change per year.",
        a: "(2.41 − 2.84) / (2009 − 2007) = −0.43 / 2 = −$0.215 per year (about a 22¢/yr drop)." },
      { id: "pc1_3_e03", type: "problem",
        q: "Over 6 hours, Anna's distance from home goes from 10 mi to 292 mi. Find her average speed.",
        a: "(292 − 10) / 6 = 282 / 6 = 47 miles per hour." },
      { id: "pc1_3_e04", type: "problem",
        q: "Find the average rate of change of f(x) = x² − 1/x on [2, 4].",
        a: "f(2) = 4 − 1/2 = 7/2;  f(4) = 16 − 1/4 = 63/4.  ARC = (63/4 − 7/2)/(4 − 2) = (49/4)/2 = 49/8." },
      { id: "pc1_3_e05", type: "problem",
        q: "The force F(d) = 2/d². Find its average rate of change from d = 2 cm to d = 6 cm.",
        a: "F(2) = 1/2;  F(6) = 1/18.  ARC = (1/18 − 1/2)/(6 − 2) = (−8/18)/4 = −1/9 newton per cm." },
      { id: "pc1_3_e06", type: "problem",
        q: "Find the average rate of change of g(t) = t² + 3t + 1 on [0, a] as an expression in a.",
        a: "g(0) = 1;  g(a) = a² + 3a + 1.  ARC = (a² + 3a)/a = a + 3." },
      { id: "pc1_3_t2", type: "problem",
        q: "Find the average rate of change of f(x) = x − 2/x on [1, 9].",
        a: "f(1) = −1;  f(9) = 79/9.  ARC = (79/9 − (−1))/(9 − 1) = (88/9)/8 = 11/9." },
      { id: "pc1_3_t3", type: "problem",
        q: "Find the average rate of change of f(x) = x² + 2x − 8 on [5, a] as an expression in a.",
        a: "f(5) = 27;  f(a) = a² + 2a − 8.  ARC = (a² + 2a − 35)/(a − 5) = ((a − 5)(a + 7))/(a − 5) = a + 7." },
      { id: "pc1_3_a1", type: "problem",
        q: "Find the average rate of change of f(x) = 4x² − 7 on [1, 3].",
        a: "f(1) = −3;  f(3) = 29.  ARC = (29 − (−3))/(3 − 1) = 32/2 = 16." },
      { id: "pc1_3_a2", type: "problem",
        q: "Find the average rate of change of g(x) = 2x² − 9 on [−2, 2].",
        a: "g(−2) = −1;  g(2) = −1.  ARC = (−1 − (−1))/(2 − (−2)) = 0 — equal endpoints give a flat secant." },
      { id: "pc1_3_a3", type: "concept",
        q: "What is the average rate of change of the linear function p(x) = 3x + 4 on any interval?",
        a: "Always 3 — for a line the average rate of change equals its slope, the same on every interval." },
      { id: "pc1_3_r1", type: "problem",
        q: "A car's odometer reads 4,500 mi at the start of a trip and 4,800 mi five hours later. Find the average speed.",
        a: "(4800 − 4500)/5 = 300/5 = 60 miles per hour." },

      // ── Behavior of graphs: concepts ────────────────────────────────
      { id: "pc1_3_c1", type: "concept",
        q: "Where on a graph do local maxima and minima occur?",
        a: "Exactly where the function switches direction — a local max where it turns from increasing to decreasing, a local min where it turns from decreasing to increasing." },
      { id: "pc1_3_c2", type: "concept",
        q: "How do absolute extrema differ from local extrema?",
        a: "Local extrema are highest/lowest only within a small neighborhood; absolute extrema are the highest/lowest over the entire domain. An absolute extremum may occur at a local extremum or at a domain endpoint." },

      // ── Verbal exercises ────────────────────────────────────────────
      { id: "pc1_3_v1", type: "concept",
        q: "Can the average rate of change of a function be constant?",
        a: "Yes — for a linear function it's constant (the slope). For nonlinear functions it generally varies from interval to interval." },
      { id: "pc1_3_v2", type: "concept",
        q: "On a graph, how is an absolute maximum different from a local maximum?",
        a: "A local maximum is a peak relative to nearby points; the absolute maximum is the single highest point on the whole graph." },
      { id: "pc1_3_v3", type: "concept",
        q: "Compare the graphs of f(x) = |x| and f(x) = x².",
        a: "Both have an absolute minimum at the origin and are symmetric about the y-axis; |x| forms a sharp V (corner), while x² is a smooth curve." },

      // ── Graphical (numbered axes, zoomable) ─────────────────────────
      { id: "pc1_3_g1", type: "problem",
        q: "From the graph, find the average rate of change of g on the interval [−1, 2].",
        a: "Read g(−1) = 4 and g(2) = 1, so ARC = (1 − 4)/(2 − (−1)) = −3/3 = −1 (the slope of the dashed secant).",
        fig:  fig(plot((t) => 0.4 * t * t - 1.4 * t + 2.2, -1.5, 4)),
        figA: fig(plot((t) => 0.4 * t * t - 1.4 * t + 2.2, -1.5, 4), seg(-1, 4, 2, 1), mark(-1, 4, "(−1, 4)"), mark(2, 1, "(2, 1)")) },
      { id: "pc1_3_g2", type: "problem",
        q: "From the graph, on what interval is f decreasing?",
        a: "f decreases between its turning points — roughly (−1.7, 1.7). It increases on (−∞, −1.7) and (1.7, ∞).",
        fig:  fig(plot((x) => 0.1 * x * x * x - 0.9 * x, -4.2, 4.2)),
        figA: fig(plot((x) => 0.1 * x * x * x - 0.9 * x, -4.2, 4.2), mark(-1.73, 1.04, "max"), mark(1.73, -1.04, "min")) },
      { id: "pc1_3_g3", type: "problem",
        q: "From the graph, identify the local maximum and local minimum points.",
        a: "Local maximum ≈ (−1.7, 1.0); local minimum ≈ (1.7, −1.0).",
        fig:  fig(plot((x) => 0.1 * x * x * x - 0.9 * x, -4.2, 4.2)),
        figA: fig(plot((x) => 0.1 * x * x * x - 0.9 * x, -4.2, 4.2), mark(-1.73, 1.04, "(−1.7, 1.0)"), mark(1.73, -1.04, "(1.7, −1.0)")) },
      { id: "pc1_3_g4", type: "problem",
        q: "On the domain −3 ≤ x ≤ 3, find the absolute maximum and minimum of f(x) = x² − 4.",
        a: "Absolute minimum −4 at x = 0 (the vertex); absolute maximum 5 at x = −3 and x = 3 (the endpoints).",
        fig:  fig(plot((x) => x * x - 4, -3, 3), cdot(-3, 5), cdot(3, 5)),
        figA: fig(plot((x) => x * x - 4, -3, 3), mark(0, -4, "min (0, −4)"), mark(-3, 5, "max"), mark(3, 5, "max")) }
    ]
  }
];

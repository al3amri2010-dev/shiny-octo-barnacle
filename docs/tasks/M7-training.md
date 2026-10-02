# Task M7 — Training

Goal: take a total beginner from "what is Sudoku" to XY-Wing. Structure modelled on sudoku.coach (short concept → worked example → lots of hands-on practice on real positions), but **all text, diagrams and puzzles are our own** (puzzles come from our generator).

## Curriculum (`src/training/lessons.ts`)
Typed lesson list `{ id, title, level: 'Beginner'|'Intermediate'|'Advanced', technique?: TechniqueId, pages: Page[], practice?: PracticeKind }`.

Beginner:
1. `rules` — The grid (rows, columns, boxes, givens), the one rule, a solved example. Interactive: tap the one empty cell of a nearly solved grid.
2. `full-house` — last empty cell in a unit.
3. `naked-single` — scanning a cell's row/column/box.
4. `hidden-single` — scanning a digit across a box, then rows/columns ("cross-hatching").
5. `notes` — what candidates are, the pencil button, Auto Notes, why notes unlock the next techniques; removing candidates when a digit is placed.

Intermediate:
6. `pointing`, 7. `claiming`, 8. `naked-pair`, 9. `hidden-pair`, 10. `naked-triple`, 11. `hidden-triple`, 12. `x-wing`.

Advanced:
13. `naked-quad`, 14. `hidden-quad`, 15. `swordfish`, 16. `skyscraper`, 17. `two-string-kite`, 18. `xy-wing`.

Each technique lesson has 2–4 pages:
- **Concept** page: 2–5 short sentences, plain English, why it works (the logic, not just the pattern).
- **Diagram** page(s): a `MiniBoard` (read-only Board variant, reuse `Cell`) showing a real position from the bank with the Step's highlights; caption explains it. A "Step through" control animates: highlight units → highlight pattern cells → show eliminations/placement.
- **Tip** (optional): how to spot it in a real game.

## Practice (`app/training/[id].tsx`, `src/training/practice.ts`)
- A practice position = `{ grid, cands, step }` where `step.technique === lesson.technique` and the technique is *required*: `nextStep(grid, cands, easierTechniques)` returns null.
- Positions come from a prebuilt bank `src/training/bank.json` produced by `scripts/build-training-bank.ts`: generate puzzles (any level up to the technique's level, plus expert for advanced ones), run the logical solver step by step, and whenever the next step is technique T and no easier technique applies, snapshot `{grid string, cands as 81 9-bit ints, step}`. Target 12 positions per technique (fewer OK for rare ones like Swordfish — report counts; if 0, hand-construct 3 valid positions and verify them in tests against brute force). Singles lessons can also use live generation.
- Interaction on the practice board:
  - Placement steps: user taps a cell then a digit (reuse NumberPad).
  - Elimination steps: user taps candidates to strike them (toggle). "Check" button.
  - Correct = placements match exactly / struck set equals the step's eliminations. Partial correct (subset, no wrong) → "Good — there's more to remove." Wrong → "Not quite" + the wrong marks flash red.
  - Progressive help: "Hint" button: 1st press highlights the unit(s), 2nd highlights pattern cells, 3rd shows answer (counts as not-clean).
  - After correct: show step.explanation, "Next" loads another position. Lesson marked complete after 5 correct (clean or not); show progress dots.
- `src/state/trainingStore.ts` (persisted): completed lessons, practice counts per lesson.

## Screens
- `app/training/index.tsx`: header with back; sections Beginner / Intermediate / Advanced; each row: number, title, one-line summary, check icon when complete, progress (e.g. 3/5).
- `app/training/[id].tsx`: pager (pages → practice), back, title, page dots, Next/Prev.
- From the game's hint banner, the technique name is tappable → opens that lesson.
- Same visual language as the game (palette, circles, pills).

## Acceptance
- Tests: every lesson references a valid technique; every bank position (a) its step is found by `nextStep` with all techniques given the position's cands, (b) easier techniques find nothing, (c) all placements/eliminations are sound vs brute-force solution of the grid; practice checking logic (exact / partial / wrong) unit-tested; trainingStore tests.
- `npm test`, `typecheck`, `lint`, `prettier --check`, web export pass.
- Screenshots (390×844) to docs/screenshots/: training list, a concept page, a diagram page, practice elimination (e.g. naked pair) before and after check, rules lesson.

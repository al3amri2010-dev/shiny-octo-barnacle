# Task M1+M2 — Engine core, techniques, logical solver, grader

All code in `src/engine/`, pure TS, tests in `src/engine/__tests__/`.

## M1 Core
- `types.ts`: `Grid = number[]` (length 81, 0 empty), `Digit = 1..9`, `Candidates = number[]` (81 × 9-bit mask, bit d-1 = digit d), `Unit = { kind: 'row'|'col'|'box'; index: 0..8 }`, `TechniqueId` union, `Step` (see PLAN.md).
- `units.ts`: precomputed `ROWS`, `COLS`, `BOXES` (cell index arrays), `UNITS` (27), `PEERS[cell]` (20 each), `rowOf/colOf/boxOf`, `cellName(i)` → `"r1c1"`.
- `candidates.ts`: `computeCandidates(grid)`, `popcount`, `digitsOf(mask)`, `has(mask,d)`.
- `bruteforce.ts`: fast backtracking (MRV heuristic, bitmasks). `solve(grid): Grid | null`, `countSolutions(grid, limit = 2): number`. Random variant `solveRandom(grid, rng)` used by generator.
- `rng.ts`: seedable PRNG (mulberry32) + `shuffle`.
- `parse.ts`: `parseGrid("4...68..." | "400068000...")` accepts `.` or `0`; `gridToString`.
- `validate.ts`: `conflicts(grid): number[]` (cells breaking row/col/box rule).

## M2 Techniques
Each in `techniques/<name>.ts` exporting `find(grid, cands): Step | null` where `cands` is the *current* (possibly pruned) candidate state. Explanations are plain English generated from the concrete cells, e.g. "In box 5, the digit 3 can only go in r5c4." Must only return steps that make progress (≥1 placement or elimination).

Order (cheapest first): fullHouse, nakedSingle, hiddenSingle, pointing, claiming, nakedPair, hiddenPair, nakedTriple, hiddenTriple, xWing, nakedQuad, hiddenQuad, swordfish, skyscraper, twoStringKite, xyWing.

`logicalSolver.ts`:
- `nextStep(grid, cands, allowed?: TechniqueId[]): Step | null`
- `applyStep(grid, cands, step)` → new grid/cands (placing a digit removes it from peers' candidates).
- `solveLogically(grid, allowed?)` → `{ solved: boolean; steps: Step[]; hardest: TechniqueId | null; grid }`.

`grader.ts`: `TECHNIQUE_LEVEL: Record<TechniqueId, Difficulty>` per PLAN.md table, `grade(grid)` → `{ difficulty: Difficulty | 'unsolvable'; hardest; steps }`.

## Tests (acceptance)
- Units/peers sizes; cellName.
- Brute force solves a known hard puzzle; `countSolutions` returns 2 for a puzzle with a removed clue that breaks uniqueness, 0 for a contradictory grid.
- **Each technique** has a test on a hand-constructed candidate state (you may build cands directly instead of a full puzzle) that asserts the exact eliminations/placements, plus a negative test where it must return null.
- Every step the logical solver produces is *sound*: on ≥20 random generated-by-brute-force puzzles, every placement equals the brute-force solution and no elimination removes the solution digit.
- An easy puzzle grades Easy; a known X-Wing puzzle grades Hard or above.
- Brute force: 50 `countSolutions` calls on typical puzzles complete in < 2s total in Jest.

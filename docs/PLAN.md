# Sudoku App — Project Plan

Owner/manager: Opus (planning, specs, review, merge). Developer: Sonnet subagents (one task at a time).

## Decisions (confirmed with user)

| Topic | Decision |
|---|---|
| Platform | React Native + Expo (TypeScript, expo-router). Must also run on web (`expo start --web`) for review screenshots. |
| Puzzles | Generated on-device; difficulty graded by the hardest technique the logical solver needs. |
| Hints | Two-stage: (1) name technique + highlight cells/candidates + explanation, (2) "Show / Apply" reveals the move. |
| Leaderboard | Local only (AsyncStorage). Separate best times for *clean* vs *assisted* games per difficulty. |
| Training | Beginner → Intermediate techniques (list below), curriculum modelled on sudoku.coach. **Original wording and puzzles only — never copy text or puzzles from sudoku.coach.** |
| Language | English only. |
| Theme | Dark (default, matches screenshots) / Light toggle via the palette icon. |

## UI reference (from user screenshots)

Game screen, dark background `#1A1B22`-ish:
- **Header:** back arrow (left), elapsed time centered as `4S`, `1M 04S` style (uppercase), palette icon (right) = theme toggle.
- **Grid:** no outer border. Thick 3×3 box separators in light periwinkle (`#B4C5FF`-ish). Thin cell separators are short, inset dark-grey dashes (not full lines).
- **Digits:** given digits are drawn inside a filled grey circle (`#5A5D68`-ish) with dark text. User-entered digits: circle outline/lighter style so they are distinguishable from givens. Highlighted digits (the currently selected digit) get a filled periwinkle circle with dark text.
- **Input model = digit-first:** tapping a number-pad key selects that digit (key becomes filled periwinkle) and highlights every occurrence on the board. Then tapping an empty cell places it (or toggles a note in notes mode). Tapping a filled cell with the same digit removes a user entry. Also support cell-first: if no digit selected, tapping a cell selects it and the next digit press fills it.
- **Number pad:** 2 rows — `1 2 3 4 5` / `6 7 8 9 X`. Outlined circles; big digit, small remaining-count beneath (9 − placed). Digit with 0 remaining is dimmed/disabled. `X` = eraser mode.
- **Bottom bar:** restart (↻), help (💡), notes toggle (✏, highlighted when active), undo (↶).
- **Help sheet (modal card):** bulb icon, text "Note: Using help transfers your time to a separate leaderboard." Buttons: Hint, Mismatches, Validate, Auto Notes, Close. Any of the first four marks the game as *assisted*.
  - Hint → technique-explanation hint (two-stage).
  - Mismatches → highlight user entries that differ from the solution.
  - Validate → toast: "No errors so far" / "N errors" (rule conflicts + wrong vs solution).
  - Auto Notes → fill every empty cell with all legal candidates.
- Notes render as small 3×3 digits inside the cell; notes of the selected digit are highlighted.
- Placing a digit auto-removes that digit from notes in the same row/col/box.

## Architecture

```
app/                     expo-router screens
  _layout.tsx            theme provider, fonts
  index.tsx              Home: Continue, New Game (difficulty), Training, Stats
  game.tsx               Game screen
  training/index.tsx     Technique list grouped by level, progress ticks
  training/[id].tsx      Lesson: explanation pages → worked example → practice
  stats.tsx              Best/avg times per difficulty, clean vs assisted
src/engine/              PURE TypeScript, no React/RN imports, fully unit-tested
  types.ts               Grid (number[81], 0 = empty), CellIndex, Candidates (9-bit masks)
  units.ts               rows/cols/boxes/peers lookup tables
  candidates.ts          compute candidates, bit helpers
  bruteforce.ts          backtracking solver, countSolutions(limit)
  techniques/*.ts        one file per technique → (state) => Step | null
  logicalSolver.ts       apply techniques in order; returns steps + hardest technique
  grader.ts              technique → difficulty mapping
  generator.ts           full random grid → dig holes (symmetric) keeping uniqueness → grade
  hint.ts                next Step for a game state (respects user notes when present)
src/state/               zustand stores
  gameStore.ts           board, notes, selection, mode, undo stack, timer, assisted flag, persistence
  settingsStore.ts       theme
  statsStore.ts          results per difficulty
src/ui/                  Board, Cell, NumberPad, BottomBar, HelpSheet, HintBanner, theme.ts
src/training/            lesson content (original text) + practice-state generators
```

### Step shape (shared by hints, grader, training)
```ts
interface Step {
  technique: TechniqueId;
  placements: { cell: number; digit: number }[];
  eliminations: { cell: number; digit: number }[];
  highlight: { cells: number[]; candidates: { cell: number; digit: number }[]; units: Unit[] };
  explanation: string; // human readable, generated from the concrete cells e.g. "r4c7"
}
```

### Techniques (v1) and difficulty

| Level | Techniques |
|---|---|
| Easy | Full House, Naked Single, Hidden Single |
| Medium | + Pointing, Claiming (Locked Candidates), Naked Pair, Hidden Pair |
| Hard | + Naked Triple, Hidden Triple, Naked Quad, Hidden Quad, X-Wing |
| Expert | + Swordfish, XY-Wing (Y-Wing), Skyscraper, 2-String Kite |

Generator only accepts puzzles the logical solver fully solves, and whose hardest technique is in the requested level (and, for Medium+, uses at least one technique of that level).

## Milestones

Each milestone = one or more Sonnet tasks → Opus review (diff read, `npm test`, `npx tsc --noEmit`, lint, web screenshot when UI) → commit + push.

- **M0 Scaffold** — Expo + TS + expo-router, jest (jest-expo), eslint/prettier, `npm test`/`typecheck`/`lint` scripts, CLAUDE.md.
- **M1 Engine core** — types, units, candidates, brute-force solver, uniqueness check. Tests.
- **M2 Techniques + logical solver + grader** — each technique tested on a hand-built position that requires it.
- **M3 Generator** — by difficulty, < ~2 s on a phone for Easy–Hard; Expert may retry, run off the UI thread via chunked async. Tests seed RNG.
- **M4 Game state** — store with all actions (digit-first + cell-first input, notes, eraser, undo, restart, timer pause on background, auto notes, mismatches, validate, hint, assisted flag, win detection, persistence). Tests.
- **M5 Game UI** — pixel-close to screenshots.
- **M6 Home, Stats, Theme toggle.**
- **M7 Training** — rules intro + lesson per technique: explanation, animated worked example using Step highlights, endless practice (generate a puzzle, advance with logical solver until the technique is the next step, user must perform it).
- **M8 Polish** — haptics, completion screen, accessibility labels, web check, README.

## M7 notes (training)

- `src/training/lessons.ts` (18 lessons, original text), `bank.json` built offline by `scripts/build-training-bank.ts` (solver snapshots, cands = solver state), `practice.ts` (pure check/reducer logic), `src/state/trainingStore.ts`.
- Practice is digit-first like the game: pick a digit, tap cells to strike it (or place it for singles). Third hint fills the answer in (not clean). Singles accept any valid single, not only the solver's first.
- `BoardView` is the presentational board (props only); `Board` is its store-backed wrapper for the game.

## Follow-ups from review

- **Hard generation is slow (~3.5 s avg, falls back to Medium 4/10).** Puzzles that strictly need triples/quads/X-Wing are rare (~1–2% of attempts). Fix in M5: (1) `scripts/build-puzzle-bank.ts` runs our own generator offline to produce a bundled bank of ~200 Hard puzzles (`src/engine/bank/hard.json`), used when available; (2) background prefetch of the next puzzle per difficulty after app start.
- **M8 polish (done):** rounded geometric font like the reference (e.g. Outfit/Lexend via @expo-google-fonts), undo icon as Material `undo` curved arrow, background prefetch of the next puzzle per difficulty, browser-driven test of a full solve → win dialog.
- **Dependency pins:** react/react-dom/react-test-renderer pinned to 19.2.3 and reanimated 4.5.1 / worklets 0.10.1 to match Expo SDK 57 (`expo/bundledNativeModules.json`). Don't bump them independently of the SDK.

## M8 notes (polish)

- Font: Outfit (`@expo-google-fonts/outfit`), loaded in `app/_layout.tsx`; `src/ui/Text.tsx` wraps RN `Text` and maps `fontWeight` onto the weight files. Use it instead of RN's `Text`.
- Icons: Material `refresh` / `undo` in the bottom bar (matches the reference), Ionicons elsewhere.
- Prefetch: `gameStore.prefetch(d)` keeps one generated puzzle per difficulty in memory (not persisted). Unseeded `newGame` uses it, then prefetches the next. Hard prefers the bank.
- Training captions: diagram pages carry a pattern `caption` and a `result` caption shown at the result stage.
- E2E: `npm run e2e` (`scripts/e2e.cjs`, Playwright + preinstalled Chromium); not part of `npm test`.

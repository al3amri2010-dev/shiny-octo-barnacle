# Task M3+M4 — Generator and game state

## M3 Generator (`src/engine/generator.ts`)
- `generate(difficulty, rng): { puzzle: Grid; solution: Grid; hardest: TechniqueId }`.
- Algorithm: `solveRandom` on empty grid → full solution; remove clues in random 180°-symmetric pairs while `countSolutions(…, 2) === 1`; grade with `grade()`. Accept when graded difficulty === requested. Retry with a new solution otherwise (cap attempts; if cap is hit return the closest-easier result, never an unsolvable one).
- For Easy, stop digging early (target ~36–40 clues) so Easy really feels easy.
- `generateAsync(difficulty, seed?)`: same, but yields to the event loop between attempts (`await new Promise(r => setTimeout(r, 0))`) so the UI does not freeze.
- Tests (seeded): each difficulty returns a unique-solution puzzle whose grade matches; `puzzle` is a subset of `solution`. Easy/Medium/Hard each < 3 s in Jest.

## M4 Game store (`src/state/gameStore.ts`, zustand + persist to AsyncStorage)
State: `puzzle`, `solution`, `values` (81), `notes` (81 bitmasks), `difficulty`, `selectedDigit: Digit|null`, `selectedCell: number|null`, `mode: 'normal'|'notes'|'erase'`, `history` (undo stack of value/notes snapshots or diffs), `elapsedMs`, `running`, `assisted: boolean`, `status: 'idle'|'playing'|'won'`, `hint: { step: Step; stage: 1|2 } | null`, `mismatches: number[]`, `toast: string|null`.

Actions:
- `newGame(difficulty)` (uses generateAsync; sets loading flag), `restart()` (clear entries/notes/history/timer, keep puzzle, keep `assisted`).
- `pressDigit(d)`: if a cell is selected and empty-editable → place/note on it; else toggle `selectedDigit` (digit-first mode).
- `pressCell(i)`: given cell → select its digit as `selectedDigit`. In erase mode → clear user value + notes. If `selectedDigit` set → place (normal) or toggle note (notes mode); tapping a user value equal to `selectedDigit` clears it. Otherwise select cell.
- `toggleNotesMode()`, `toggleEraseMode()` (the X key), `undo()`.
- Placing a value removes that digit from notes of all peers (part of the same undo entry).
- `remaining(d)` selector = 9 − count of d on board.
- Help actions (each sets `assisted = true`): `requestHint()` → uses `nextStep` on current values + candidates (if the user has notes in every empty cell use their notes intersected with legal candidates, else computed candidates) → stage 1; `revealHint()` → stage 2; `applyHint()` → applies the step's placements/eliminations to values/notes (undoable) and clears hint. `showMismatches()` → user cells ≠ solution. `validate()` → toast "No errors so far" or "N errors found". `autoNotes()` → notes = legal candidates for every empty cell (undoable).
- Win: when values === solution → status 'won', stop timer, record result in `statsStore` (`{difficulty, ms, assisted, date}`).
- `tick(ms)` / `pause()` / `resume()` for the timer (UI drives it; pause on AppState background).
- `src/state/statsStore.ts`: persisted list of results + selectors `best(difficulty, assisted)`, `average`, `count`.
- `src/state/settingsStore.ts`: persisted `theme: 'dark'|'light'`, `toggleTheme()`.

Tests: every action incl. undo of placement+peer-note cleanup, digit-first vs cell-first flows, erase on givens is a no-op, assisted flag set by each help action, win detection records stats, hint apply. Mock AsyncStorage with `@react-native-async-storage/async-storage/jest/async-storage-mock`.

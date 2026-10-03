# Task M5+M6 — Game UI, Home, Stats, Theme

Reference: the four user screenshots described in docs/PLAN.md "UI reference". Colors come from `src/ui/theme.ts`; read the active palette from `settingsStore` via a `useTheme()` hook (`src/ui/useTheme.ts`). Everything must work on web (`npx expo export --platform web`) and phone sizes 360–430 px wide.

## Game screen (`app/game.tsx`, components in `src/ui/`)
- **Header** (`GameHeader`): back arrow (`Ionicons arrow-back`) left → router.back(); centered timer in small caps style: `4S`, `59S`, `1M 04S`, `1H 02M`; palette icon right (`Ionicons color-palette`) → `toggleTheme()`. Timer ticks with setInterval(1000) while `status==='playing'`, pauses when AppState is not active and while help sheet is open is NOT required (keep running).
- **Board** (`Board`, `Cell`): square, full width minus 8 px each side, vertically placed in upper half with generous top space like screenshots.
  - No outer border. Box separators: 2 px lines in `accent` drawn between boxes (2 vertical, 2 horizontal), full length.
  - Cell separators: thin `gridThin` dashes inset ~20% from each end (not touching corners), 1 px.
  - Given digit: filled circle `givenCircle`, diameter ~86% of cell, digit in `givenText`, font ~55% of cell, normal weight.
  - User digit: same circle size, transparent fill with 1.5 px `givenCircle` outline? → use: fill `surface`, text `text` color — must be visibly different from givens.
  - Wrong user digit (only once Mismatches shown): text/outline in error red `#FF8A8A` (add `error` to palettes).
  - Highlight: any cell whose value === `selectedDigit` → circle fill `accent`, digit `givenText`.
  - Selected cell (cell-first mode): subtle `surface` rounded-square background.
  - Notes: 3×3 mini grid, font ~22% of cell, `textMuted`; notes equal to `selectedDigit` drawn in `accent` bold.
  - Hint highlight: stage 1 → cells in `step.highlight.cells` get an accent outline ring, units get a faint accent tint; candidates in `highlight.candidates` drawn in accent. Stage 2 → placements shown as ghost digits in accent, eliminations drawn struck in red.
- **HintBanner** (above number pad when a hint is active): technique name (title case, e.g. "Hidden Single"), explanation text, buttons: stage 1 "Show" → revealHint; stage 2 "Apply" → applyHint; and "✕" dismiss.
- **NumberPad**: 2 rows `1 2 3 4 5` / `6 7 8 9 X`, circles ~64 px (scale with width), 1 px `outline` border; big bold digit, tiny remaining count under it. Selected digit key → filled `accent`, dark text. Remaining 0 → opacity 0.3, disabled. `X` key = erase mode toggle (filled accent when active).
- **BottomBar**: 4 icons evenly spaced: `refresh` (restart, confirm via simple modal "Restart this puzzle?"), `bulb` (open HelpSheet), `pencil` (notes mode; filled accent tint when active), `arrow-undo` (undo).
- **HelpSheet** (modal card, rounded 32 px, `background` fill, 1 px `outline` border, dim backdrop): accent bulb icon, muted text "Note: Using help transfers your time to a separate leaderboard.", pill buttons (full-width, outlined, icon + label): Hint (bulb), Mismatches (alert-circle), Validate (checkmark), Auto Notes (pencil); gap; Close. Each action closes the sheet.
- **Toast** for validate messages (bottom, 2 s).
- **Win modal**: "Solved!", time, difficulty, "assisted" tag if applicable, best time, buttons New Game / Home.
- Haptics: light impact on placement (expo-haptics, guard for web).
- Loading state while generating: centered ActivityIndicator + "Generating puzzle…".

## Home (`app/index.tsx`)
Dark minimal style matching the game. Title "Sudoku". Buttons (outlined pills): Continue (only if a game is in progress, shows difficulty + time), New Game → difficulty chooser (Easy / Medium / Hard / Expert pills) → router.push('/game') after `newGame(d)`, Training → '/training', Statistics → '/stats'. Palette icon top-right toggles theme here too.

## Stats (`app/stats.tsx`)
Back header. Per difficulty card: games solved, best time (clean), best time (assisted), average. Empty state text.

## Acceptance
- `npm test`, `typecheck`, `lint`, `prettier --check` pass. Add render tests for NumberPad (remaining count, disabled state) and HelpSheet (buttons call store actions) with @testing-library/react-native.
- `npx expo export --platform web` succeeds.
- Provide screenshots: run the web export with a static server and capture 390×844 screenshots with Playwright (Chromium at /opt/pw-browsers) of: home, game (fresh), game with digit 1 selected, help sheet open, hint stage 1, notes mode with auto notes, light theme game. Save to docs/screenshots/.

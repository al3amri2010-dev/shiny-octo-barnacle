# CLAUDE.md

Sudoku app: React Native + Expo + TypeScript (expo-router, zustand, AsyncStorage, jest-expo).

- Plan, decisions, UI spec and milestones: `docs/PLAN.md`. Keep it updated when decisions change.
- Workflow: the main session (Opus) plans and reviews; implementation is delegated to the `sudoku-dev` agent (Sonnet), one task at a time.
- `src/engine/` is pure TS with no React imports, and every change there needs unit tests.
- Before committing, run `npm test`, `npm run typecheck` and `npm run lint`.
- Training content must be original writing. The curriculum is modelled on sudoku.coach, but no text or puzzles are copied from it.
- Cell notation in explanations: `r1c1`..`r9c9`; boxes `b1`..`b9`.

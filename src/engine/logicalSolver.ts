import { bit, computeCandidates } from './candidates';
import { PEERS } from './units';
import { FINDERS, TECHNIQUE_ORDER } from './techniques';
import type { Candidates, Grid, Step, TechniqueId } from './types';

/** First step found, trying techniques in TECHNIQUE_ORDER (restricted to `allowed` if given). */
export function nextStep(grid: Grid, cands: Candidates, allowed?: TechniqueId[]): Step | null {
  for (const id of TECHNIQUE_ORDER) {
    if (allowed && !allowed.includes(id)) continue;
    const step = FINDERS[id](grid, cands);
    if (step) return step;
  }
  return null;
}

/** Returns new grid/candidates with the step applied (inputs are not mutated). */
export function applyStep(
  grid: Grid,
  cands: Candidates,
  step: Step,
): { grid: Grid; cands: Candidates } {
  const g = grid.slice();
  const c = cands.slice();
  for (const { cell, digit } of step.eliminations) c[cell] &= ~bit(digit);
  for (const { cell, digit } of step.placements) {
    g[cell] = digit;
    c[cell] = 0;
    for (const p of PEERS[cell]) c[p] &= ~bit(digit);
  }
  return { grid: g, cands: c };
}

export interface LogicalResult {
  solved: boolean;
  steps: Step[];
  hardest: TechniqueId | null;
  grid: Grid;
}

export function solveLogically(grid: Grid, allowed?: TechniqueId[]): LogicalResult {
  let g = grid.slice();
  let c = computeCandidates(g);
  const steps: Step[] = [];
  for (;;) {
    if (g.every((d) => d !== 0)) break;
    if (g.some((d, i) => d === 0 && c[i] === 0)) break; // contradiction: stop
    const step = nextStep(g, c, allowed);
    if (!step) break;
    steps.push(step);
    ({ grid: g, cands: c } = applyStep(g, c, step));
  }
  let hardest: TechniqueId | null = null;
  for (const s of steps) {
    if (
      hardest === null ||
      TECHNIQUE_ORDER.indexOf(s.technique) > TECHNIQUE_ORDER.indexOf(hardest)
    ) {
      hardest = s.technique;
    }
  }
  return { solved: g.every((d) => d !== 0), steps, hardest, grid: g };
}

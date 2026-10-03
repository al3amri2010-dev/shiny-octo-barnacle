import { bit, digitsOf, popcount, ALL_DIGITS_MASK } from './candidates';
import { boxOf, colOf, rowOf } from './units';
import { shuffle, type Rng } from './rng';
import type { Grid } from './types';

interface Result {
  count: number;
  solution: Grid | null;
}

function run(grid: Grid, limit: number, rng?: Rng): Result {
  const g = grid.slice();
  const rows = new Array<number>(9).fill(0);
  const cols = new Array<number>(9).fill(0);
  const boxes = new Array<number>(9).fill(0);
  const result: Result = { count: 0, solution: null };
  if (g.length !== 81) return result;

  for (let i = 0; i < 81; i++) {
    const d = g[i];
    if (d === 0) continue;
    if (!Number.isInteger(d) || d < 1 || d > 9) return result;
    const b = bit(d);
    const r = rowOf(i);
    const c = colOf(i);
    const x = boxOf(i);
    if (rows[r] & b || cols[c] & b || boxes[x] & b) return result; // contradictory givens
    rows[r] |= b;
    cols[c] |= b;
    boxes[x] |= b;
  }

  const rec = (): void => {
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const m = ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]) & ALL_DIGITS_MASK;
      const n = popcount(m);
      if (n === 0) return;
      if (n < bestCount) {
        best = i;
        bestMask = m;
        bestCount = n;
        if (n === 1) break;
      }
    }
    if (best === -1) {
      result.count++;
      if (!result.solution) result.solution = g.slice();
      return;
    }
    const digits = digitsOf(bestMask);
    if (rng) shuffle(digits, rng);
    const r = rowOf(best);
    const c = colOf(best);
    const x = boxOf(best);
    for (const d of digits) {
      const b = bit(d);
      g[best] = d;
      rows[r] |= b;
      cols[c] |= b;
      boxes[x] |= b;
      rec();
      g[best] = 0;
      rows[r] &= ~b;
      cols[c] &= ~b;
      boxes[x] &= ~b;
      if (result.count >= limit) return;
    }
  };
  rec();
  return result;
}

/** First solution found, or null if the grid has none. */
export function solve(grid: Grid): Grid | null {
  return run(grid, 1).solution;
}

/** Number of solutions, counting stops at `limit`. */
export function countSolutions(grid: Grid, limit = 2): number {
  return run(grid, limit).count;
}

/** Like `solve`, but tries digits in random order (random full grids from an empty grid). */
export function solveRandom(grid: Grid, rng: Rng): Grid | null {
  return run(grid, 1, rng).solution;
}

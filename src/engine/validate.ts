import { PEERS } from './units';
import type { Grid } from './types';

/** Indices of filled cells that share their digit with a peer (row/col/box rule broken). */
export function conflicts(grid: Grid): number[] {
  const out: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) continue;
    if (PEERS[i].some((p) => grid[p] === grid[i])) out.push(i);
  }
  return out;
}

import { PEERS } from './units';
import type { Candidates, Grid } from './types';

export const ALL_DIGITS_MASK = 0x1ff;

export function popcount(mask: number): number {
  let n = 0;
  let m = mask;
  while (m) {
    m &= m - 1;
    n++;
  }
  return n;
}

/** Digits (1..9) present in the mask, ascending. */
export function digitsOf(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << (d - 1))) out.push(d);
  return out;
}

export function has(mask: number, digit: number): boolean {
  return (mask & (1 << (digit - 1))) !== 0;
}

export function bit(digit: number): number {
  return 1 << (digit - 1);
}

/** Candidates of every empty cell = digits not used by any peer. Filled cells get 0. */
export function computeCandidates(grid: Grid): Candidates {
  const cands: Candidates = new Array(81).fill(0);
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    let mask = ALL_DIGITS_MASK;
    for (const p of PEERS[i]) if (grid[p] !== 0) mask &= ~bit(grid[p]);
    cands[i] = mask;
  }
  return cands;
}

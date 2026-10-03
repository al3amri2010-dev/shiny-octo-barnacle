import { solve } from '../bruteforce';
import { parseGrid } from '../parse';
import type { Rng } from '../rng';
import type { Grid } from '../types';
import hardRaw from './hard.json';

/** Bundled Hard puzzles (81-char strings) produced offline by scripts/build-puzzle-bank.ts. */
export const HARD_BANK: readonly string[] = hardRaw as string[];

export interface BankPuzzle {
  puzzle: Grid;
  solution: Grid;
}

/** Parses a bank entry and computes its solution with the brute-force solver. */
export function loadBankPuzzle(entry: string): BankPuzzle {
  const puzzle = parseGrid(entry);
  const solution = solve(puzzle);
  if (!solution) throw new Error('Bank puzzle has no solution');
  return { puzzle, solution };
}

/** Random index in [0, size) not in `played`, or null when every puzzle has been played. */
export function pickUnplayed(played: readonly number[], size: number, rng: Rng): number | null {
  const seen = new Set(played);
  const free: number[] = [];
  for (let i = 0; i < size; i++) if (!seen.has(i)) free.push(i);
  return free.length ? free[Math.floor(rng() * free.length)] : null;
}

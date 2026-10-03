import { bit } from '../candidates';
import { countSolutions, solveRandom } from '../bruteforce';
import { mulberry32, shuffle } from '../rng';
import { cellName } from '../units';
import type { Candidates, Grid, Step } from '../types';

/** "r3c4" -> cell index. */
export function cell(name: string): number {
  const m = /^r([1-9])c([1-9])$/.exec(name);
  if (!m) throw new Error(`bad cell name ${name}`);
  return (Number(m[1]) - 1) * 9 + (Number(m[2]) - 1);
}

/** Swap rows and columns of a cell name ("r2c7" -> "r7c2"), for testing the other orientation. */
export function transpose(name: string): string {
  const m = /^r([1-9])c([1-9])$/.exec(name);
  if (!m) throw new Error(`bad cell name ${name}`);
  return `r${m[2]}c${m[1]}`;
}

/** Empty grid with hand-written candidates: cells not listed have mask 0 (ignored by techniques). */
export function state(spec: Record<string, number[]>): { grid: Grid; cands: Candidates } {
  const grid: Grid = new Array(81).fill(0);
  const cands: Candidates = new Array(81).fill(0);
  for (const [name, digits] of Object.entries(spec)) {
    cands[cell(name)] = digits.reduce((m, d) => m | bit(d), 0);
  }
  return { grid, cands };
}

/** Like `state`, but every cell is an empty cell with all nine candidates unless overridden. */
export function fullState(spec: Record<string, number[]> = {}): { grid: Grid; cands: Candidates } {
  const s = state(spec);
  for (let i = 0; i < 81; i++) if (!(cellName(i) in spec)) s.cands[i] = 0x1ff;
  return s;
}

export function elimKeys(step: Step): string[] {
  return step.eliminations.map((e) => `${cellName(e.cell)}:${e.digit}`).sort();
}

export function placementKeys(step: Step): string[] {
  return step.placements.map((e) => `${cellName(e.cell)}=${e.digit}`).sort();
}

/** Random uniquely-solvable puzzle (minimal-ish): random full grid, then remove clues. */
export function randomPuzzle(seed: number, maxHoles = 81): { puzzle: Grid; solution: Grid } {
  const rng = mulberry32(seed);
  const solution = solveRandom(new Array(81).fill(0), rng);
  if (!solution) throw new Error('no solution');
  const puzzle = solution.slice();
  let holes = 0;
  for (const i of shuffle([...Array(81).keys()], rng)) {
    if (holes >= maxHoles) break;
    const saved = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) === 1) holes++;
    else puzzle[i] = saved;
  }
  return { puzzle, solution };
}

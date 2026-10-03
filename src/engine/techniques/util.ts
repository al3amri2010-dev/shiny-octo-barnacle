import { has } from '../candidates';
import { cellName } from '../units';
import type { Candidates, CellDigit, Grid } from '../types';

/** "r1c1", "r1c1 and r2c2", "r1c1, r2c2 and r3c3". */
export function listCells(cells: number[]): string {
  const names = cells.map(cellName);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** "3", "3 and 5", "3, 5 and 7". */
export function listDigits(digits: number[]): string {
  const s = digits.map(String);
  if (s.length <= 1) return s.join('');
  return `${s.slice(0, -1).join(', ')} and ${s[s.length - 1]}`;
}

/** Empty cells (per the grid) among `cells` that still have `digit` as a candidate. */
export function cellsWith(grid: Grid, cands: Candidates, cells: number[], digit: number): number[] {
  return cells.filter((c) => grid[c] === 0 && has(cands[c], digit));
}

/** Eliminations of `digit` from those of `cells` that currently hold it as a candidate. */
export function eliminationsOf(
  grid: Grid,
  cands: Candidates,
  cells: number[],
  digit: number,
): CellDigit[] {
  return cellsWith(grid, cands, cells, digit).map((cell) => ({ cell, digit }));
}

export function combinations<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  const pick: T[] = [];
  const rec = (start: number): void => {
    if (pick.length === k) {
      out.push(pick.slice());
      return;
    }
    for (let i = start; i < items.length; i++) {
      pick.push(items[i]);
      rec(i + 1);
      pick.pop();
    }
  };
  rec(0);
  return out;
}

export function dedupeEliminations(list: CellDigit[]): CellDigit[] {
  const seen = new Set<number>();
  return list.filter((e) => {
    const key = e.cell * 10 + e.digit;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function describeEliminations(elims: CellDigit[]): string {
  const byDigit = new Map<number, number[]>();
  for (const e of elims) byDigit.set(e.digit, [...(byDigit.get(e.digit) ?? []), e.cell]);
  return [...byDigit.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([d, cells]) => `${d} from ${listCells(cells)}`)
    .join('; ');
}

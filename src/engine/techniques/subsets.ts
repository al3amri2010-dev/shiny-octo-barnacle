import { bit, digitsOf, has, popcount } from '../candidates';
import { UNITS, unitCells, unitName } from '../units';
import { combinations, describeEliminations, listCells, listDigits } from './util';
import type { Candidates, CellDigit, Grid, Step, TechniqueId } from '../types';

const SIZE_NAME = ['', '', 'pair', 'triple', 'quad'];

/** n cells in a unit whose candidates together are only n digits: those digits leave the rest. */
export function findNakedSubset(
  grid: Grid,
  cands: Candidates,
  n: 2 | 3 | 4,
  technique: TechniqueId,
): Step | null {
  for (const unit of UNITS) {
    const cells = unitCells(unit).filter((c) => grid[c] === 0 && cands[c] !== 0);
    const pool = cells.filter((c) => popcount(cands[c]) >= 2 && popcount(cands[c]) <= n);
    for (const combo of combinations(pool, n)) {
      const union = combo.reduce((m, c) => m | cands[c], 0);
      if (popcount(union) !== n) continue;
      const digits = digitsOf(union);
      const eliminations: CellDigit[] = [];
      for (const c of cells) {
        if (combo.includes(c)) continue;
        for (const d of digits) if (has(cands[c], d)) eliminations.push({ cell: c, digit: d });
      }
      if (eliminations.length === 0) continue;
      return {
        technique,
        placements: [],
        eliminations,
        highlight: {
          cells: combo,
          candidates: combo.flatMap((cell) =>
            digitsOf(cands[cell]).map((digit) => ({ cell, digit })),
          ),
          units: [unit],
        },
        explanation: `In ${unitName(unit)}, ${listCells(combo)} can only hold ${listDigits(digits)} between them (a naked ${SIZE_NAME[n]}), so those digits can be removed elsewhere in the ${unit.kind}: ${describeEliminations(eliminations)}.`,
      };
    }
  }
  return null;
}

/** n digits in a unit that fit only in the same n cells: those cells lose all other digits. */
export function findHiddenSubset(
  grid: Grid,
  cands: Candidates,
  n: 2 | 3 | 4,
  technique: TechniqueId,
): Step | null {
  for (const unit of UNITS) {
    const cells = unitCells(unit);
    const placed = new Set(cells.filter((c) => grid[c] !== 0).map((c) => grid[c]));
    const spots = new Map<number, number[]>();
    for (let d = 1; d <= 9; d++) {
      if (placed.has(d)) continue;
      const where = cells.filter((c) => grid[c] === 0 && has(cands[c], d));
      if (where.length >= 2 && where.length <= n) spots.set(d, where);
    }
    for (const combo of combinations([...spots.keys()], n)) {
      const area = [...new Set(combo.flatMap((d) => spots.get(d) ?? []))];
      if (area.length !== n) continue;
      const keep = combo.reduce((m, d) => m | bit(d), 0);
      const eliminations: CellDigit[] = [];
      for (const c of area) {
        for (const d of digitsOf(cands[c] & ~keep)) eliminations.push({ cell: c, digit: d });
      }
      if (eliminations.length === 0) continue;
      return {
        technique,
        placements: [],
        eliminations,
        highlight: {
          cells: area,
          candidates: area.flatMap((cell) =>
            combo.filter((d) => has(cands[cell], d)).map((digit) => ({ cell, digit })),
          ),
          units: [unit],
        },
        explanation: `In ${unitName(unit)}, the digits ${listDigits(combo)} can only go in ${listCells(area)} (a hidden ${SIZE_NAME[n]}), so every other candidate can be removed from those cells: ${describeEliminations(eliminations)}.`,
      };
    }
  }
  return null;
}

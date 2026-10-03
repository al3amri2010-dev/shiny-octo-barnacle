import { COLS, PEERS, ROWS, cellName } from '../units';
import { cellsWith, combinations, listCells } from './util';
import type { Candidates, CellDigit, Grid, Step, Unit } from '../types';

/**
 * Two parallel lines where the digit has exactly two spots each, and one spot of each lies in the
 * same perpendicular line (the base). The two remaining spots (roofs) cannot both be false, so
 * any cell seeing both roofs loses the digit.
 */
export function find(grid: Grid, cands: Candidates): Step | null {
  for (const orient of ['row', 'col'] as const) {
    const lines = orient === 'row' ? ROWS : COLS;
    for (let digit = 1; digit <= 9; digit++) {
      const pairs: { index: number; cells: [number, number] }[] = [];
      for (let i = 0; i < 9; i++) {
        const cells = cellsWith(grid, cands, lines[i], digit);
        if (cells.length === 2) pairs.push({ index: i, cells: [cells[0], cells[1]] });
      }
      const crossOf = (c: number): number => (orient === 'row' ? c % 9 : Math.floor(c / 9));
      for (const [a, b] of combinations(pairs, 2)) {
        for (let ia = 0; ia < 2; ia++) {
          for (let ib = 0; ib < 2; ib++) {
            const baseA = a.cells[ia];
            const baseB = b.cells[ib];
            const roofA = a.cells[1 - ia];
            const roofB = b.cells[1 - ib];
            if (crossOf(baseA) !== crossOf(baseB)) continue; // bases must share a cross line
            if (crossOf(roofA) === crossOf(roofB)) continue; // that would be an X-Wing
            const targets = cellsWith(grid, cands, PEERS[roofA], digit).filter((c) =>
              PEERS[roofB].includes(c),
            );
            if (targets.length === 0) continue;
            const eliminations: CellDigit[] = targets.map((cell) => ({ cell, digit }));
            const cells = [baseA, baseB, roofA, roofB];
            const baseUnit: Unit = {
              kind: orient === 'row' ? 'col' : 'row',
              index: crossOf(baseA),
            };
            return {
              technique: 'skyscraper',
              placements: [],
              eliminations,
              highlight: {
                cells,
                candidates: cells.map((cell) => ({ cell, digit })),
                units: [
                  { kind: orient, index: a.index },
                  { kind: orient, index: b.index },
                  baseUnit,
                ],
              },
              explanation: `Skyscraper on ${digit}: ${cellName(baseA)} and ${cellName(baseB)} line up, so one of the roof cells ${cellName(roofA)} or ${cellName(roofB)} must be ${digit}; ${listCells(targets)} see both and cannot be ${digit}.`,
            };
          }
        }
      }
    }
  }
  return null;
}

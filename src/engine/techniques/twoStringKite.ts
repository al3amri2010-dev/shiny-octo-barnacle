import { COLS, PEERS, ROWS, boxOf, cellName } from '../units';
import { cellsWith, listCells } from './util';
import type { Candidates, CellDigit, Grid, Step } from '../types';

/**
 * A row and a column each hold the digit in exactly two cells; one cell from each (the "kite
 * knot") sit in the same box. Those two cannot both be true, so one of the two far ends is, and
 * any cell seeing both far ends loses the digit.
 */
export function find(grid: Grid, cands: Candidates): Step | null {
  for (let digit = 1; digit <= 9; digit++) {
    const rowPairs = ROWS.map((r) => cellsWith(grid, cands, r, digit)).filter(
      (s) => s.length === 2,
    );
    const colPairs = COLS.map((c) => cellsWith(grid, cands, c, digit)).filter(
      (s) => s.length === 2,
    );
    for (const rp of rowPairs) {
      for (const cp of colPairs) {
        if (rp.some((c) => cp.includes(c))) continue; // four distinct cells only
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            const rowKnot = rp[i];
            const colKnot = cp[j];
            if (boxOf(rowKnot) !== boxOf(colKnot)) continue;
            const rowEnd = rp[1 - i];
            const colEnd = cp[1 - j];
            const targets = cellsWith(grid, cands, PEERS[rowEnd], digit).filter((c) =>
              PEERS[colEnd].includes(c),
            );
            if (targets.length === 0) continue;
            const eliminations: CellDigit[] = targets.map((cell) => ({ cell, digit }));
            const cells = [rowKnot, colKnot, rowEnd, colEnd];
            return {
              technique: 'twoStringKite',
              placements: [],
              eliminations,
              highlight: {
                cells,
                candidates: cells.map((cell) => ({ cell, digit })),
                units: [
                  { kind: 'row', index: Math.floor(rowKnot / 9) },
                  { kind: 'col', index: colKnot % 9 },
                  { kind: 'box', index: boxOf(rowKnot) },
                ],
              },
              explanation: `2-String Kite on ${digit}: ${cellName(rowKnot)} and ${cellName(colKnot)} share a box so they cannot both be ${digit}; that forces ${cellName(rowEnd)} or ${cellName(colEnd)} to be ${digit}, so ${listCells(targets)} cannot be.`,
            };
          }
        }
      }
    }
  }
  return null;
}

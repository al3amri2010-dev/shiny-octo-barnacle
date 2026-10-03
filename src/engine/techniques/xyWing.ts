import { digitsOf, has, popcount } from '../candidates';
import { PEERS, cellName } from '../units';
import { cellsWith, combinations, listCells } from './util';
import type { Candidates, CellDigit, Grid, Step } from '../types';

/**
 * Pivot {A,B} with pincers {A,C} and {B,C} (both seeing the pivot): whichever value the pivot
 * takes, one pincer becomes C, so any cell seeing both pincers cannot be C.
 */
export function find(grid: Grid, cands: Candidates): Step | null {
  const bivalue = (c: number): boolean => grid[c] === 0 && popcount(cands[c]) === 2;
  for (let pivot = 0; pivot < 81; pivot++) {
    if (!bivalue(pivot)) continue;
    const pincers = PEERS[pivot].filter(bivalue);
    for (const [p1, p2] of combinations(pincers, 2)) {
      const common = cands[p1] & cands[p2];
      if (popcount(common) !== 1 || (common & cands[pivot]) !== 0) continue;
      if ((cands[p1] | cands[p2]) !== (cands[pivot] | common)) continue;
      const digit = digitsOf(common)[0];
      const targets = cellsWith(grid, cands, PEERS[p1], digit).filter(
        (c) => c !== pivot && PEERS[p2].includes(c) && has(cands[c], digit),
      );
      if (targets.length === 0) continue;
      const eliminations: CellDigit[] = targets.map((cell) => ({ cell, digit }));
      const cells = [pivot, p1, p2];
      const [a, b] = digitsOf(cands[pivot]);
      return {
        technique: 'xyWing',
        placements: [],
        eliminations,
        highlight: {
          cells,
          candidates: cells.flatMap((cell) =>
            digitsOf(cands[cell]).map((d) => ({ cell, digit: d })),
          ),
          units: [],
        },
        explanation: `XY-Wing with pivot ${cellName(pivot)} (${a}/${b}) and pincers ${cellName(p1)} and ${cellName(p2)}: whichever way the pivot goes, one pincer becomes ${digit}, so ${listCells(targets)} cannot be ${digit}.`,
      };
    }
  }
  return null;
}

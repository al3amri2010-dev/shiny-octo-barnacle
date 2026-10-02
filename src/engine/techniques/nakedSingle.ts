import { digitsOf, popcount } from '../candidates';
import { cellName } from '../units';
import type { Candidates, Grid, Step } from '../types';

export function find(grid: Grid, cands: Candidates): Step | null {
  for (let cell = 0; cell < 81; cell++) {
    if (grid[cell] !== 0 || popcount(cands[cell]) !== 1) continue;
    const digit = digitsOf(cands[cell])[0];
    return {
      technique: 'nakedSingle',
      placements: [{ cell, digit }],
      eliminations: [],
      highlight: { cells: [cell], candidates: [{ cell, digit }], units: [] },
      explanation: `${cellName(cell)} has only one candidate left, ${digit}, so it must be ${digit}.`,
    };
  }
  return null;
}

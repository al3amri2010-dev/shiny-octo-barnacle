import { UNITS, unitCells, unitName, cellName } from '../units';
import { cellsWith } from './util';
import type { Candidates, Grid, Step } from '../types';

export function find(grid: Grid, cands: Candidates): Step | null {
  for (const unit of UNITS) {
    const cells = unitCells(unit);
    const placed = new Set(cells.filter((c) => grid[c] !== 0).map((c) => grid[c]));
    for (let digit = 1; digit <= 9; digit++) {
      if (placed.has(digit)) continue;
      const spots = cellsWith(grid, cands, cells, digit);
      if (spots.length !== 1) continue;
      const cell = spots[0];
      return {
        technique: 'hiddenSingle',
        placements: [{ cell, digit }],
        eliminations: [],
        highlight: { cells: [cell], candidates: [{ cell, digit }], units: [unit] },
        explanation: `In ${unitName(unit)}, the digit ${digit} can only go in ${cellName(cell)}.`,
      };
    }
  }
  return null;
}

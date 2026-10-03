import { bit } from '../candidates';
import { UNITS, unitCells, unitName, cellName } from '../units';
import type { Candidates, Grid, Step } from '../types';

export function find(grid: Grid, _cands: Candidates): Step | null {
  for (const unit of UNITS) {
    const cells = unitCells(unit);
    const empty = cells.filter((c) => grid[c] === 0);
    if (empty.length !== 1) continue;
    let used = 0;
    for (const c of cells) if (grid[c] !== 0) used |= bit(grid[c]);
    const missing = ~used & 0x1ff;
    if (missing === 0 || (missing & (missing - 1)) !== 0) continue; // inconsistent unit
    const digit = Math.log2(missing) + 1;
    const cell = empty[0];
    return {
      technique: 'fullHouse',
      placements: [{ cell, digit }],
      eliminations: [],
      highlight: { cells: [cell], candidates: [{ cell, digit }], units: [unit] },
      explanation: `${unitName(unit)} has only one empty cell left, ${cellName(cell)}, so it must be ${digit}.`,
    };
  }
  return null;
}

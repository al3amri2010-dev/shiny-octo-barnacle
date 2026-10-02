import { BOXES, COLS, ROWS, boxOf, unitName } from '../units';
import { cellsWith, eliminationsOf, listCells } from './util';
import type { Candidates, Grid, Step, Unit } from '../types';

export function find(grid: Grid, cands: Candidates): Step | null {
  const lines: Unit[] = [
    ...ROWS.map((_, index): Unit => ({ kind: 'row', index })),
    ...COLS.map((_, index): Unit => ({ kind: 'col', index })),
  ];
  for (const line of lines) {
    const lineCells = line.kind === 'row' ? ROWS[line.index] : COLS[line.index];
    for (let digit = 1; digit <= 9; digit++) {
      const spots = cellsWith(grid, cands, lineCells, digit);
      if (spots.length < 2) continue;
      const b = boxOf(spots[0]);
      if (!spots.every((c) => boxOf(c) === b)) continue;
      const eliminations = eliminationsOf(
        grid,
        cands,
        BOXES[b].filter((c) => !lineCells.includes(c)),
        digit,
      );
      if (eliminations.length === 0) continue;
      const boxUnit: Unit = { kind: 'box', index: b };
      return {
        technique: 'claiming',
        placements: [],
        eliminations,
        highlight: {
          cells: spots,
          candidates: spots.map((cell) => ({ cell, digit })),
          units: [line, boxUnit],
        },
        explanation: `In ${unitName(line)}, the digit ${digit} is confined to ${listCells(spots)}, all in ${unitName(boxUnit)}, so ${digit} can be removed from ${listCells(eliminations.map((e) => e.cell))}.`,
      };
    }
  }
  return null;
}

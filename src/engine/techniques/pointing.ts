import { BOXES, COLS, ROWS, boxOf, colOf, rowOf, unitName } from '../units';
import { cellsWith, eliminationsOf, listCells } from './util';
import type { Candidates, Grid, Step, Unit } from '../types';

export function find(grid: Grid, cands: Candidates): Step | null {
  for (let b = 0; b < 9; b++) {
    for (let digit = 1; digit <= 9; digit++) {
      const spots = cellsWith(grid, cands, BOXES[b], digit);
      if (spots.length < 2) continue;
      const lines: { unit: Unit; cells: number[] }[] = [];
      if (spots.every((c) => rowOf(c) === rowOf(spots[0]))) {
        lines.push({ unit: { kind: 'row', index: rowOf(spots[0]) }, cells: ROWS[rowOf(spots[0])] });
      }
      if (spots.every((c) => colOf(c) === colOf(spots[0]))) {
        lines.push({ unit: { kind: 'col', index: colOf(spots[0]) }, cells: COLS[colOf(spots[0])] });
      }
      for (const line of lines) {
        const eliminations = eliminationsOf(
          grid,
          cands,
          line.cells.filter((c) => boxOf(c) !== b),
          digit,
        );
        if (eliminations.length === 0) continue;
        const boxUnit: Unit = { kind: 'box', index: b };
        return {
          technique: 'pointing',
          placements: [],
          eliminations,
          highlight: {
            cells: spots,
            candidates: spots.map((cell) => ({ cell, digit })),
            units: [boxUnit, line.unit],
          },
          explanation: `In ${unitName(boxUnit)}, the digit ${digit} is confined to ${listCells(spots)}, all in ${unitName(line.unit)}, so ${digit} can be removed from ${listCells(eliminations.map((e) => e.cell))}.`,
        };
      }
    }
  }
  return null;
}

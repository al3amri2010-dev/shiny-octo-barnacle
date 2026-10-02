import { COLS, ROWS } from '../units';
import { cellsWith, combinations, listCells } from './util';
import type { Candidates, CellDigit, Grid, Step, TechniqueId, Unit } from '../types';

const FISH_NAME: Record<number, string> = { 2: 'X-Wing', 3: 'Swordfish' };

/** Basic fish of size n (2 = X-Wing, 3 = Swordfish) in both orientations. */
export function findFish(
  grid: Grid,
  cands: Candidates,
  n: 2 | 3,
  technique: TechniqueId,
): Step | null {
  for (const orient of ['row', 'col'] as const) {
    const bases = orient === 'row' ? ROWS : COLS;
    const covers = orient === 'row' ? COLS : ROWS;
    const baseWord = orient === 'row' ? 'rows' : 'columns';
    const coverWord = orient === 'row' ? 'columns' : 'rows';
    for (let digit = 1; digit <= 9; digit++) {
      // For each base line: which cover-line indices hold the digit.
      const lines: { index: number; cells: number[]; cover: number[] }[] = [];
      for (let i = 0; i < 9; i++) {
        const cells = cellsWith(grid, cands, bases[i], digit);
        if (cells.length < 2 || cells.length > n) continue;
        const cover = cells.map((c) => (orient === 'row' ? c % 9 : Math.floor(c / 9)));
        lines.push({ index: i, cells, cover });
      }
      for (const combo of combinations(lines, n)) {
        const coverIdx = [...new Set(combo.flatMap((l) => l.cover))];
        if (coverIdx.length !== n) continue;
        const baseIdx = combo.map((l) => l.index);
        const eliminations: CellDigit[] = [];
        for (const ci of coverIdx) {
          for (const c of cellsWith(grid, cands, covers[ci], digit)) {
            const baseOfCell = orient === 'row' ? Math.floor(c / 9) : c % 9;
            if (!baseIdx.includes(baseOfCell)) eliminations.push({ cell: c, digit });
          }
        }
        if (eliminations.length === 0) continue;
        const cells = combo.flatMap((l) => l.cells);
        const unitOf = (kind: 'row' | 'col', index: number): Unit => ({ kind, index });
        const coverKind = orient === 'row' ? 'col' : 'row';
        const nameOf = (i: number): number => i + 1;
        return {
          technique,
          placements: [],
          eliminations,
          highlight: {
            cells,
            candidates: cells.map((cell) => ({ cell, digit })),
            units: [
              ...baseIdx.map((i) => unitOf(orient, i)),
              ...coverIdx.map((i) => unitOf(coverKind, i)),
            ],
          },
          explanation: `${FISH_NAME[n]} on ${digit}: in ${baseWord} ${baseIdx.map(nameOf).join(', ')} the digit ${digit} only appears in ${coverWord} ${coverIdx.map(nameOf).join(', ')} (${listCells(cells)}), so ${digit} can be removed from ${listCells(eliminations.map((e) => e.cell))}.`,
        };
      }
    }
  }
  return null;
}

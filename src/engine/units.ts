import type { Unit } from './types';

const range9 = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export const ROWS: number[][] = range9.map((r) => range9.map((c) => r * 9 + c));
export const COLS: number[][] = range9.map((c) => range9.map((r) => r * 9 + c));
export const BOXES: number[][] = range9.map((b) => {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  return range9.map((i) => (br + Math.floor(i / 3)) * 9 + bc + (i % 3));
});

/** All 27 units: 9 rows, 9 columns, 9 boxes (in that order). */
export const UNITS: Unit[] = [
  ...range9.map((index): Unit => ({ kind: 'row', index })),
  ...range9.map((index): Unit => ({ kind: 'col', index })),
  ...range9.map((index): Unit => ({ kind: 'box', index })),
];

export function unitCells(unit: Unit): number[] {
  return unit.kind === 'row'
    ? ROWS[unit.index]
    : unit.kind === 'col'
      ? COLS[unit.index]
      : BOXES[unit.index];
}

export const rowOf = (cell: number): number => Math.floor(cell / 9);
export const colOf = (cell: number): number => cell % 9;
export const boxOf = (cell: number): number =>
  Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);

/** PEERS[cell]: the 20 other cells sharing a row, column or box. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, cell) => {
  const set = new Set<number>([...ROWS[rowOf(cell)], ...COLS[colOf(cell)], ...BOXES[boxOf(cell)]]);
  set.delete(cell);
  return [...set].sort((a, b) => a - b);
});

export function cellName(cell: number): string {
  return `r${rowOf(cell) + 1}c${colOf(cell) + 1}`;
}

export function unitName(unit: Unit): string {
  const n = unit.index + 1;
  return unit.kind === 'row' ? `row ${n}` : unit.kind === 'col' ? `column ${n}` : `box ${n}`;
}

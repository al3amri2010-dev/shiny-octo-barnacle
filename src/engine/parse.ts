import type { Grid } from './types';

/** Parses 81 characters of 1-9 and `.`/`0` (whitespace ignored). Throws on bad input. */
export function parseGrid(text: string): Grid {
  const chars = text.replace(/\s+/g, '');
  if (chars.length !== 81) throw new Error(`Expected 81 cells, got ${chars.length}`);
  return [...chars].map((ch) => {
    if (ch === '.' || ch === '0') return 0;
    if (ch >= '1' && ch <= '9') return Number(ch);
    throw new Error(`Invalid character "${ch}"`);
  });
}

/** Inverse of parseGrid; empty cells are written as `.`. */
export function gridToString(grid: Grid): string {
  return grid.map((d) => (d === 0 ? '.' : String(d))).join('');
}

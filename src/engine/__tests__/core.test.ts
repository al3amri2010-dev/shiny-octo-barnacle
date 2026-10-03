import { countSolutions, solve, solveRandom } from '../bruteforce';
import { computeCandidates, digitsOf, has, popcount } from '../candidates';
import { gridToString, parseGrid } from '../parse';
import { mulberry32, shuffle } from '../rng';
import {
  BOXES,
  COLS,
  PEERS,
  ROWS,
  UNITS,
  boxOf,
  cellName,
  colOf,
  rowOf,
  unitCells,
} from '../units';
import { conflicts } from '../validate';
import { randomPuzzle } from '../__testutils__/helpers';

const HARD = '8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..';
const EASY = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';

describe('units', () => {
  it('has correctly sized lookup tables', () => {
    expect(ROWS).toHaveLength(9);
    expect(COLS).toHaveLength(9);
    expect(BOXES).toHaveLength(9);
    expect(UNITS).toHaveLength(27);
    for (const u of UNITS) expect(new Set(unitCells(u)).size).toBe(9);
    expect(PEERS).toHaveLength(81);
    for (const p of PEERS) expect(p).toHaveLength(20);
  });
  it('is symmetric and consistent', () => {
    for (let i = 0; i < 81; i++) {
      for (const p of PEERS[i]) expect(PEERS[p]).toContain(i);
      expect(BOXES[boxOf(i)]).toContain(i);
      expect(ROWS[rowOf(i)][colOf(i)]).toBe(i);
    }
  });
  it('names cells', () => {
    expect(cellName(0)).toBe('r1c1');
    expect(cellName(80)).toBe('r9c9');
    expect(cellName(13)).toBe('r2c5');
  });
});

describe('candidates / parse / validate / rng', () => {
  it('computes candidates', () => {
    const g = parseGrid(EASY);
    const c = computeCandidates(g);
    expect(c[0]).toBe(0); // filled
    expect(digitsOf(c[2])).toEqual([1, 2, 4]); // r1c3
    expect(has(c[2], 4)).toBe(true);
    expect(popcount(c[2])).toBe(3);
  });
  it('round-trips parse', () => {
    expect(gridToString(parseGrid(HARD))).toBe(HARD);
    expect(parseGrid(HARD.replace(/\./g, '0'))).toEqual(parseGrid(HARD));
    expect(() => parseGrid('123')).toThrow();
    expect(() => parseGrid('x'.repeat(81))).toThrow();
  });
  it('finds conflicts', () => {
    const g = new Array(81).fill(0);
    expect(conflicts(g)).toEqual([]);
    g[0] = 5;
    g[8] = 5;
    g[40] = 5;
    expect(conflicts(g).sort((a, b) => a - b)).toEqual([0, 8]);
  });
  it('is deterministic for a seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(1)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('bruteforce', () => {
  it('solves a known hard puzzle uniquely', () => {
    const g = parseGrid(HARD);
    const s = solve(g);
    expect(s).not.toBeNull();
    expect(s!.every((d) => d !== 0)).toBe(true);
    expect(conflicts(s!)).toEqual([]);
    g.forEach((d, i) => d && expect(s![i]).toBe(d));
    expect(countSolutions(g)).toBe(1);
  });
  it('counts 2 when uniqueness is broken, 0 when contradictory', () => {
    const g = parseGrid(HARD);
    // Removing a clue from a puzzle that is minimal at that clue breaks uniqueness.
    const { puzzle } = randomPuzzle(7);
    const i = puzzle.findIndex((d) => d !== 0);
    const loosened = puzzle.slice();
    loosened[i] = 0;
    expect(countSolutions(puzzle)).toBe(1);
    expect(countSolutions(loosened)).toBe(2);
    expect(countSolutions(new Array(81).fill(0), 2)).toBe(2);
    const bad = g.slice();
    bad[1] = 8; // 8 twice in row 1
    expect(countSolutions(bad)).toBe(0);
    const dead = new Array(81).fill(0);
    [1, 2, 3, 4, 5, 6, 7, 8].forEach((d, k) => (dead[k] = d));
    dead[9 + 8] = 9; // r2c9: r1c9 now has no candidate
    expect(countSolutions(dead)).toBe(0);
  });
  it('solveRandom gives valid, seed-dependent grids', () => {
    const empty = new Array(81).fill(0);
    const a = solveRandom(empty, mulberry32(1))!;
    const b = solveRandom(empty, mulberry32(2))!;
    expect(conflicts(a)).toEqual([]);
    expect(a.every((d) => d !== 0)).toBe(true);
    expect(a).not.toEqual(b);
    expect(solveRandom(empty, mulberry32(1))).toEqual(a);
  });
  it('is fast: 50 countSolutions calls under 2s', () => {
    const puzzles = Array.from({ length: 5 }, (_, k) => randomPuzzle(100 + k).puzzle);
    const t = Date.now();
    for (let i = 0; i < 50; i++) expect(countSolutions(puzzles[i % 5])).toBe(1);
    expect(Date.now() - t).toBeLessThan(2000);
  });
});

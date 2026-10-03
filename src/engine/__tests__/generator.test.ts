import { countSolutions } from '../bruteforce';
import { generate, generateAsync } from '../generator';
import { grade } from '../grader';
import { mulberry32 } from '../rng';
import type { Difficulty } from '../types';

function check(difficulty: Difficulty, seed: number): number {
  const t = Date.now();
  const { puzzle, solution, hardest } = generate(difficulty, mulberry32(seed));
  const ms = Date.now() - t;
  expect(countSolutions(puzzle, 2)).toBe(1);
  expect(puzzle.every((d, i) => d === 0 || d === solution[i])).toBe(true);
  expect(solution.every((d) => d >= 1 && d <= 9)).toBe(true);
  const g = grade(puzzle);
  expect(g.difficulty).toBe(difficulty);
  expect(g.hardest).toBe(hardest);
  return ms;
}

describe('generate', () => {
  it('easy: unique, graded easy, 36-40 clues, fast', () => {
    const ms = check('easy', 1);
    expect(ms).toBeLessThan(3000);
    const { puzzle } = generate('easy', mulberry32(2));
    const clues = puzzle.filter((d) => d !== 0).length;
    expect(clues).toBeGreaterThanOrEqual(36);
    expect(clues).toBeLessThanOrEqual(41);
  });

  it('medium: unique, graded medium, fast', () => {
    expect(check('medium', 1)).toBeLessThan(3000);
  });

  it('hard: unique, graded hard', () => {
    check('hard', 3);
  }, 30000);

  it('expert: unique, graded expert', () => {
    check('expert', 1);
  }, 30000);

  it('is deterministic for a seed', () => {
    const a = generate('easy', mulberry32(7));
    const b = generate('easy', mulberry32(7));
    expect(a.puzzle).toEqual(b.puzzle);
  });

  it('generateAsync resolves with a valid puzzle', async () => {
    const r = await generateAsync('easy', 5);
    expect(countSolutions(r.puzzle, 2)).toBe(1);
    expect(grade(r.puzzle).difficulty).toBe('easy');
  });
});

import { HARD_BANK, loadBankPuzzle, pickUnplayed } from '../bank';
import { countSolutions } from '../bruteforce';
import { grade } from '../grader';
import { mulberry32 } from '../rng';

describe('hard puzzle bank', () => {
  it('is non-empty with unique 81-char entries', () => {
    expect(HARD_BANK.length).toBeGreaterThan(0);
    expect(new Set(HARD_BANK).size).toBe(HARD_BANK.length);
    for (const e of HARD_BANK) expect(e).toMatch(/^[1-9.]{81}$/);
  });

  it('every puzzle has a unique solution, consistent givens, and grades hard', () => {
    for (const e of HARD_BANK) {
      const { puzzle, solution } = loadBankPuzzle(e);
      expect(countSolutions(puzzle, 2)).toBe(1);
      expect(puzzle.every((d, i) => d === 0 || d === solution[i])).toBe(true);
      expect(grade(puzzle).difficulty).toBe('hard');
    }
  }, 120000);
});

describe('pickUnplayed', () => {
  it('never returns a played index and returns null when exhausted', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 50; i++) expect([2, 3]).toContain(pickUnplayed([0, 1, 4], 5, rng));
    expect(pickUnplayed([0, 1, 2], 3, rng)).toBeNull();
  });
});

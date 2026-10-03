import { computeCandidates, has } from '../candidates';
import { TECHNIQUE_LEVEL, grade } from '../grader';
import { applyStep, nextStep, solveLogically } from '../logicalSolver';
import { parseGrid } from '../parse';
import { FINDERS, TECHNIQUE_ORDER } from '../techniques';
import { PEERS } from '../units';
import { randomPuzzle, state } from '../__testutils__/helpers';
import type { Step, TechniqueId } from '../types';

jest.setTimeout(60000);

const EASY = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const XWING = '100000569492056108056109240009640801064010000218035604040500016905061402621000005';

function checkSound(step: Step, solution: number[], cands: number[]): void {
  for (const p of step.placements) expect(solution[p.cell]).toBe(p.digit);
  for (const e of step.eliminations) {
    expect(solution[e.cell]).not.toBe(e.digit);
    expect(has(cands[e.cell], e.digit)).toBe(true); // real progress
  }
  expect(step.placements.length + step.eliminations.length).toBeGreaterThan(0);
  expect(step.explanation).toMatch(/r[1-9]c[1-9]/);
}

describe('soundness against brute force', () => {
  it('every step of every technique is sound on random puzzles', () => {
    const exercised = new Set<TechniqueId>();
    for (let seed = 1; seed <= 30; seed++) {
      const { puzzle, solution } = randomPuzzle(seed);
      let grid = puzzle.slice();
      let cands = computeCandidates(grid);
      for (;;) {
        // Every technique's finder must be sound in the current state, not just the first hit.
        for (const id of TECHNIQUE_ORDER) {
          const step = FINDERS[id](grid, cands);
          if (!step) continue;
          expect(step.technique).toBe(id);
          checkSound(step, solution, cands);
          exercised.add(id);
        }
        const step = nextStep(grid, cands);
        if (!step) break;
        ({ grid, cands } = applyStep(grid, cands, step));
        grid.forEach((d, i) => d && expect(d).toBe(solution[i]));
        grid.forEach((d, i) => !d && expect(has(cands[i], solution[i])).toBe(true));
      }
    }
    for (const id of ['hiddenSingle', 'pointing', 'claiming', 'nakedPair', 'xyWing'] as const) {
      expect(exercised).toContain(id);
    }
  });

  it('solveLogically reaches the unique solution when it solves', () => {
    for (let seed = 40; seed < 55; seed++) {
      const { puzzle, solution } = randomPuzzle(seed, 45);
      const result = solveLogically(puzzle);
      if (result.solved) expect(result.grid).toEqual(solution);
      for (const s of result.steps) checkSound(s, solution, computeCandidates(puzzle));
    }
  });
});

describe('logical solver', () => {
  it('solves an easy puzzle with singles only', () => {
    const r = solveLogically(parseGrid(EASY));
    expect(r.solved).toBe(true);
    expect(r.grid.every((d) => d !== 0)).toBe(true);
    for (const s of r.steps) expect(TECHNIQUE_LEVEL[s.technique]).toBe('easy');
  });

  it('respects the allowed list', () => {
    const r = solveLogically(parseGrid(XWING), ['nakedSingle', 'hiddenSingle', 'fullHouse']);
    expect(r.solved).toBe(false);
    expect(r.steps.every((s) => TECHNIQUE_LEVEL[s.technique] === 'easy')).toBe(true);
  });

  it('nextStep returns the first technique in the spec order', () => {
    // Both a naked single (r1c1) and a naked pair exist; the single must win.
    const { grid, cands } = state({ r1c1: [4], r5c1: [1, 2], r5c2: [1, 2], r5c3: [1, 2, 3] });
    expect(nextStep(grid, cands)!.technique).toBe('nakedSingle');
    expect(nextStep(grid, cands, ['nakedPair'])!.technique).toBe('nakedPair');
    expect(nextStep(grid, cands, ['xWing'])).toBeNull();
  });

  it('nextStep on a real X-Wing puzzle only uses an X-Wing once simpler steps run out', () => {
    let grid = parseGrid(XWING);
    let cands = computeCandidates(grid);
    for (;;) {
      const step = nextStep(grid, cands)!;
      if (step.technique === 'xWing') {
        for (const id of TECHNIQUE_ORDER.slice(0, TECHNIQUE_ORDER.indexOf('xWing'))) {
          expect(FINDERS[id](grid, cands)).toBeNull();
        }
        break;
      }
      ({ grid, cands } = applyStep(grid, cands, step));
    }
  });

  it('applyStep places digits, prunes peers and does not mutate its inputs', () => {
    const grid = new Array(81).fill(0);
    const cands = new Array(81).fill(0x1ff);
    const before = cands.slice();
    const step: Step = {
      technique: 'nakedSingle',
      placements: [{ cell: 10, digit: 5 }],
      eliminations: [{ cell: 0, digit: 9 }],
      highlight: { cells: [], candidates: [], units: [] },
      explanation: '',
    };
    const next = applyStep(grid, cands, step);
    expect(grid[10]).toBe(0);
    expect(cands).toEqual(before);
    expect(next.grid[10]).toBe(5);
    expect(next.cands[10]).toBe(0);
    for (const p of PEERS[10]) expect(has(next.cands[p], 5)).toBe(false);
    expect(has(next.cands[0], 9)).toBe(false);
    expect(has(next.cands[80], 5)).toBe(true);
  });
});

describe('grader', () => {
  it('grades an easy puzzle Easy', () => {
    const g = grade(parseGrid(EASY));
    expect(g.difficulty).toBe('easy');
    expect(['fullHouse', 'nakedSingle', 'hiddenSingle']).toContain(g.hardest);
  });
  it('grades a known X-Wing puzzle Hard or above', () => {
    const g = grade(parseGrid(XWING));
    expect(['hard', 'expert']).toContain(g.difficulty);
    expect(g.steps.some((s) => s.technique === 'xWing')).toBe(true);
  });
  it('reports puzzles the solver cannot finish as unsolvable', () => {
    expect(grade(new Array(81).fill(0)).difficulty).toBe('unsolvable');
  });
  it('maps every technique to a level per the plan', () => {
    expect(TECHNIQUE_LEVEL.hiddenSingle).toBe('easy');
    expect(TECHNIQUE_LEVEL.hiddenPair).toBe('medium');
    expect(TECHNIQUE_LEVEL.xWing).toBe('hard');
    expect(TECHNIQUE_LEVEL.xyWing).toBe('expert');
    expect(Object.keys(TECHNIQUE_LEVEL).sort()).toEqual([...TECHNIQUE_ORDER].sort());
  });
});

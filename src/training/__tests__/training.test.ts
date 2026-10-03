import { solve } from '../../engine/bruteforce';
import { has } from '../../engine/candidates';
import { nextStep } from '../../engine/logicalSolver';
import { mulberry32 } from '../../engine/rng';
import { TECHNIQUE_ORDER } from '../../engine/techniques';
import type { CellDigit, Step, TechniqueId } from '../../engine/types';
import { BANK, bankSize, toPosition } from '../bank';
import {
  checkEliminations,
  checkPlacement,
  isClean,
  isPlacementStep,
  isValidPlacement,
  newPractice,
  pickPosition,
  practiceReducer,
  struckMasks,
} from '../practice';
import { LESSONS, RULES_BLANK, RULES_SOLUTION, lessonById, lessonForTechnique } from '../lessons';

const keys = (l: CellDigit[]): string[] => l.map((x) => `${x.cell}:${x.digit}`).sort();

describe('lessons', () => {
  it('has the 18 lessons of the curriculum with unique ids', () => {
    expect(LESSONS).toHaveLength(18);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(18);
    expect(LESSONS.slice(0, 5).every((l) => l.level === 'Beginner')).toBe(true);
    expect(LESSONS.slice(5, 12).every((l) => l.level === 'Intermediate')).toBe(true);
    expect(LESSONS.slice(12).every((l) => l.level === 'Advanced')).toBe(true);
  });

  it('every technique lesson references a valid technique with bank positions', () => {
    for (const l of LESSONS) {
      if (!l.technique) {
        expect(l.practice).toBeUndefined();
        continue;
      }
      expect(TECHNIQUE_ORDER).toContain(l.technique);
      expect(lessonForTechnique(l.technique)).toBe(l);
      expect(l.practice).toBe('bank');
      expect(bankSize(l.technique)).toBeGreaterThanOrEqual(3);
    }
    expect(new Set(LESSONS.map((l) => l.technique).filter(Boolean)).size).toBe(16);
  });

  it('technique lessons have 2-4 pages and diagram pages point into the bank', () => {
    for (const l of LESSONS) {
      if (!l.technique) continue;
      expect(l.pages.length).toBeGreaterThanOrEqual(2);
      expect(l.pages.length).toBeLessThanOrEqual(4);
      for (const p of l.pages) {
        if (p.kind === 'diagram') expect(p.example).toBeLessThan(bankSize(l.technique));
      }
    }
  });

  it('looks lessons up by id', () => {
    expect(lessonById('x-wing')?.technique).toBe('xWing');
    expect(lessonById('nope')).toBeUndefined();
  });

  it('rules grid is a valid solved grid', () => {
    const grid = [...RULES_SOLUTION].map(Number);
    const blanked = grid.slice();
    blanked[RULES_BLANK] = 0;
    expect(solve(blanked)).toEqual(grid);
  });
});

describe('training bank', () => {
  const techniques = TECHNIQUE_ORDER as TechniqueId[];

  it('has at least 12 positions per technique', () => {
    for (const t of techniques) expect(bankSize(t)).toBeGreaterThanOrEqual(12);
  });

  it.each(techniques)('%s positions are required, found by the solver and sound', (t) => {
    const easier = TECHNIQUE_ORDER.slice(0, TECHNIQUE_ORDER.indexOf(t));
    const seen = new Set<string>();
    for (let i = 0; i < bankSize(t); i++) {
      const pos = toPosition(t, i);
      const label = `${t}#${i}`;
      expect(pos.grid).toHaveLength(81);
      expect(pos.cands).toHaveLength(81);
      seen.add(BANK[t][i].g + JSON.stringify(pos.step.eliminations));

      // (a) the stored step is what the solver finds with every technique allowed
      const found = nextStep(pos.grid, pos.cands);
      expect({ label, t: found?.technique }).toEqual({ label, t });
      expect(keys(found!.eliminations)).toEqual(keys(pos.step.eliminations));
      expect(keys(found!.placements)).toEqual(keys(pos.step.placements));

      // (b) nothing easier applies, so the technique is required
      expect(nextStep(pos.grid, pos.cands, easier)).toBeNull();

      // (c) the step is sound against the brute-force solution; candidates never lose it
      const solution = solve(pos.grid)!;
      expect(solution).not.toBeNull();
      for (let c = 0; c < 81; c++) {
        if (pos.grid[c] === 0) expect(has(pos.cands[c], solution[c])).toBe(true);
      }
      for (const p of pos.step.placements) expect(solution[p.cell]).toBe(p.digit);
      for (const e of pos.step.eliminations) {
        expect(pos.grid[e.cell]).toBe(0);
        expect(has(pos.cands[e.cell], e.digit)).toBe(true);
        expect(solution[e.cell]).not.toBe(e.digit);
      }
      expect(pos.step.placements.length + pos.step.eliminations.length).toBeGreaterThan(0);
    }
    expect(seen.size).toBe(bankSize(t));
  });
});

describe('placement checking', () => {
  const pos = toPosition('nakedSingle', 0);
  const ans = pos.step.placements[0];

  it('accepts the step placement and rejects other digits', () => {
    expect(checkPlacement(pos, ans).status).toBe('correct');
    const wrongDigit = (ans.digit % 9) + 1;
    expect(checkPlacement(pos, { cell: ans.cell, digit: wrongDigit })).toMatchObject({
      status: 'wrong',
      wrong: [{ cell: ans.cell, digit: wrongDigit }],
    });
    expect(checkPlacement(pos, null).status).toBe('empty');
  });

  it('accepts any valid single of the technique, not only the one the solver found first', () => {
    for (const t of ['fullHouse', 'nakedSingle', 'hiddenSingle'] as const) {
      for (let i = 0; i < bankSize(t); i++) {
        const p = toPosition(t, i);
        const solution = solve(p.grid)!;
        for (let c = 0; c < 81; c++) {
          if (p.grid[c] !== 0) continue;
          for (let d = 1; d <= 9; d++) {
            if (isValidPlacement(t, p.grid, p.cands, c, d)) expect(solution[c]).toBe(d);
          }
        }
        const s = p.step.placements[0];
        expect(isValidPlacement(t, p.grid, p.cands, s.cell, s.digit)).toBe(true);
      }
    }
  });
});

describe('elimination checking', () => {
  const pos = toPosition('nakedPair', 0);
  const step = pos.step;
  const answer = step.eliminations;

  it('exact answer is correct', () => {
    expect(checkEliminations(step, answer).status).toBe('correct');
    expect(checkEliminations(step, [...answer].reverse()).status).toBe('correct');
  });

  it('a strict subset is partial', () => {
    if (answer.length > 1) {
      const r = checkEliminations(step, answer.slice(0, 1));
      expect(r.status).toBe('partial');
      expect(r.wrong).toEqual([]);
    }
  });

  it('any mark outside the answer is wrong and reported', () => {
    const stray = { cell: step.highlight.cells[0], digit: 1 };
    const struck = [...answer, stray];
    const r = checkEliminations(step, struck);
    expect(r.status).toBe('wrong');
    expect(r.wrong).toEqual([stray]);
  });

  it('nothing struck is empty', () => {
    expect(checkEliminations(step, []).status).toBe('empty');
  });
});

describe('practice reducer', () => {
  const fresh = (t: TechniqueId, i = 0) => newPractice(toPosition(t, i));

  it('toggles strikes only on real candidates', () => {
    let s = fresh('nakedPair');
    const e = s.position.step.eliminations[0];
    s = practiceReducer(s, { type: 'strike', cell: e.cell, digit: e.digit });
    expect(s.struck).toEqual([e]);
    s = practiceReducer(s, { type: 'strike', cell: e.cell, digit: e.digit });
    expect(s.struck).toEqual([]);
    const filled = s.position.grid.findIndex((v) => v !== 0);
    s = practiceReducer(s, { type: 'strike', cell: filled, digit: 1 });
    expect(s.struck).toEqual([]);
  });

  it('exact solve is clean; wrong check makes it not clean', () => {
    let s = fresh('nakedPair');
    for (const e of s.position.step.eliminations) {
      s = practiceReducer(s, { type: 'strike', cell: e.cell, digit: e.digit });
    }
    s = practiceReducer(s, { type: 'check' });
    expect(s.status).toBe('correct');
    expect(isClean(s)).toBe(true);

    let t = fresh('nakedPair');
    // find a real candidate that is not part of the answer
    const c = t.position.step.highlight.cells[0];
    const digit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(
      (d) =>
        has(t.position.cands[c], d) &&
        !t.position.step.eliminations.some((e) => e.cell === c && e.digit === d),
    )!;
    t = practiceReducer(t, { type: 'strike', cell: c, digit });
    t = practiceReducer(t, { type: 'check' });
    expect(t.status).toBe('wrong');
    expect(t.wrong).toEqual([{ cell: c, digit }]);
    expect(t.mistakes).toBe(1);
    // fix it and solve: correct, but no longer clean
    t = practiceReducer(t, { type: 'strike', cell: c, digit });
    for (const e of t.position.step.eliminations) {
      t = practiceReducer(t, { type: 'strike', cell: e.cell, digit: e.digit });
    }
    t = practiceReducer(t, { type: 'check' });
    expect(t.status).toBe('correct');
    expect(isClean(t)).toBe(false);
  });

  it('partial then complete', () => {
    let s = fresh('xWing');
    const [first, ...rest] = s.position.step.eliminations;
    expect(rest.length).toBeGreaterThan(0);
    s = practiceReducer(s, { type: 'strike', cell: first.cell, digit: first.digit });
    s = practiceReducer(s, { type: 'check' });
    expect(s.status).toBe('partial');
    for (const e of rest) s = practiceReducer(s, { type: 'strike', cell: e.cell, digit: e.digit });
    s = practiceReducer(s, { type: 'check' });
    expect(s.status).toBe('correct');
  });

  it('progressive help: units, pattern, then the answer (not clean)', () => {
    let s = fresh('nakedPair');
    s = practiceReducer(s, { type: 'hint' });
    expect(s.help).toBe(1);
    s = practiceReducer(s, { type: 'hint' });
    expect(s.help).toBe(2);
    expect(s.status).toBe('idle');
    s = practiceReducer(s, { type: 'hint' });
    expect(s.help).toBe(3);
    expect(s.status).toBe('correct');
    expect(keys(s.struck)).toEqual(keys(s.position.step.eliminations));
    expect(isClean(s)).toBe(false);
    // locked once solved
    expect(practiceReducer(s, { type: 'hint' })).toBe(s);
  });

  it('placements are checked immediately; wrong digit can be retried', () => {
    let s = fresh('hiddenSingle');
    expect(isPlacementStep(s.position.step)).toBe(true);
    const ans = s.position.step.placements[0];
    s = practiceReducer(s, { type: 'place', cell: ans.cell, digit: (ans.digit % 9) + 1 });
    expect(s.status).toBe('wrong');
    expect(s.wrong).toHaveLength(1);
    s = practiceReducer(s, { type: 'place', cell: ans.cell, digit: ans.digit });
    expect(s.status).toBe('correct');
    expect(isClean(s)).toBe(false); // one mistake
  });

  it('hint 3 fills the placement; reset starts a new position', () => {
    let s = fresh('nakedSingle');
    for (let i = 0; i < 3; i++) s = practiceReducer(s, { type: 'hint' });
    expect(s.placed).toEqual(s.position.step.placements[0]);
    expect(s.status).toBe('correct');
    s = practiceReducer(s, { type: 'reset', position: toPosition('nakedSingle', 1) });
    expect(s).toEqual(fresh('nakedSingle', 1));
  });

  it('struckMasks groups digits per cell', () => {
    const m = struckMasks([
      { cell: 3, digit: 1 },
      { cell: 3, digit: 4 },
      { cell: 5, digit: 9 },
    ]);
    expect(m.get(3)).toBe(0b1001);
    expect(m.get(5)).toBe(1 << 8);
  });
});

describe('pickPosition', () => {
  it('avoids seen positions until all were seen', () => {
    const n = bankSize('xyWing');
    const rng = mulberry32(5);
    const seen: string[] = [];
    for (let i = 0; i < n; i++) {
      const p = pickPosition('xyWing', rng, seen)!;
      expect(seen).not.toContain(p.key);
      seen.push(p.key);
    }
    const again = pickPosition('xyWing', rng, seen)!;
    expect(again.key).not.toBe(seen[seen.length - 1]);
  });
});

describe('step typing sanity', () => {
  it('bank steps carry an explanation', () => {
    for (const t of TECHNIQUE_ORDER) {
      const s: Step = toPosition(t, 0).step;
      expect(s.explanation.length).toBeGreaterThan(10);
    }
  });
});

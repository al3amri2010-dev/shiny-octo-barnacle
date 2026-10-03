import { bit } from '../../engine/candidates';
import { generate } from '../../engine/generator';
import { mulberry32 } from '../../engine/rng';
import type { Digit } from '../../engine/types';
import * as L from '../gameLogic';
import type { GameData } from '../gameLogic';

const gen = generate('easy', mulberry32(11));
const fresh = (): GameData => L.newGameData('easy', gen.puzzle, gen.solution);
const emptyCells = (s: GameData): number[] =>
  s.values.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
const givenCell = (s: GameData): number => s.puzzle.findIndex((v) => v !== 0);
const wrongDigit = (s: GameData, i: number): Digit => ((s.solution[i] % 9) + 1) as Digit;

/** An empty cell plus a digit that is not its solution (so it never wins by accident). */
function setup(s: GameData): { cell: number; good: Digit; bad: Digit } {
  const cell = emptyCells(s)[0];
  return { cell, good: s.solution[cell] as Digit, bad: wrongDigit(s, cell) };
}

describe('input flows', () => {
  it('cell-first: select cell then press digit places it', () => {
    let s = fresh();
    const { cell, good } = setup(s);
    s = L.pressCell(s, cell);
    expect(s.selectedCell).toBe(cell);
    s = L.pressDigit(s, good);
    expect(s.values[cell]).toBe(good);
    expect(s.history).toHaveLength(1);
  });

  it('digit-first: pressing a digit with no cell selected selects/deselects the digit', () => {
    let s = fresh();
    s = L.pressDigit(s, 5);
    expect(s.selectedDigit).toBe(5);
    s = L.pressDigit(s, 5);
    expect(s.selectedDigit).toBeNull();
  });

  it('digit-first: tapping an empty cell places the selected digit; tapping it again clears', () => {
    let s = fresh();
    const { cell, good } = setup(s);
    s = L.pressDigit(s, good);
    s = L.pressCell(s, cell);
    expect(s.values[cell]).toBe(good);
    s = L.pressCell(s, cell);
    expect(s.values[cell]).toBe(0);
  });

  it('tapping a given selects its digit and never edits it', () => {
    let s = fresh();
    const g = givenCell(s);
    s = L.pressCell(s, g);
    expect(s.selectedDigit).toBe(s.puzzle[g]);
    s = L.pressCell(s, g);
    expect(s.values[g]).toBe(s.puzzle[g]);
    expect(s.history).toHaveLength(0);
  });

  it('notes mode toggles notes instead of placing', () => {
    let s = fresh();
    const { cell } = setup(s);
    s = L.toggleNotesMode(s);
    s = L.pressDigit(s, 3);
    s = L.pressCell(s, cell);
    expect(s.values[cell]).toBe(0);
    expect(s.notes[cell]).toBe(bit(3));
    s = L.pressCell(s, cell); // digit still selected: toggles off
    expect(s.notes[cell]).toBe(0);
  });

  it('notes mode with a selected cell toggles via pressDigit', () => {
    let s = fresh();
    const { cell } = setup(s);
    s = L.toggleNotesMode(s);
    s = L.pressCell(s, cell);
    s = L.pressDigit(s, 2);
    s = L.pressDigit(s, 4);
    expect(s.notes[cell]).toBe(bit(2) | bit(4));
  });

  it('erase mode clears user value and notes, no-op on givens', () => {
    let s = fresh();
    const { cell, bad } = setup(s);
    s = L.pressCell(L.pressDigit(s, bad), cell);
    s = L.toggleEraseMode(s);
    s = L.pressCell(s, cell);
    expect(s.values[cell]).toBe(0);
    const before = s.history.length;
    const g = givenCell(s);
    const after = L.pressCell(s, g);
    expect(after.values[g]).toBe(s.puzzle[g]);
    expect(after.history).toHaveLength(before);
  });

  it('erase mode removes notes of an empty cell', () => {
    let s = fresh();
    const { cell } = setup(s);
    s = L.pressDigit(L.toggleNotesMode(L.pressCell(s, cell)), 7);
    expect(s.notes[cell]).toBe(bit(7));
    s = L.toggleEraseMode(L.toggleNotesMode(s));
    s = L.pressCell(s, cell);
    expect(s.notes[cell]).toBe(0);
    expect(L.undo(s).notes[cell]).toBe(bit(7));
  });

  it('remaining counts placed digits', () => {
    const s = fresh();
    const d = 4;
    const placed = s.values.filter((v) => v === d).length;
    expect(L.remaining(s, d)).toBe(9 - placed);
  });
});

describe('placing and undo', () => {
  it('placement removes the digit from peer notes, and undo restores values and notes exactly', () => {
    let s = fresh();
    s = L.autoNotes(s);
    const { cell, bad } = setup(s);
    const withNotes = s;
    s = L.pressCell(L.pressDigit(s, bad), cell);
    // wrong digit placed, peers lost that note, cell notes cleared
    expect(s.notes[cell]).toBe(0);
    for (let i = 0; i < 81; i++) {
      if (i !== cell && s.values[i] === 0 && withNotes.notes[i] & bit(bad)) {
        // peers lose it, non-peers keep it
        const peer = (a: number, b: number): boolean =>
          Math.floor(a / 9) === Math.floor(b / 9) ||
          a % 9 === b % 9 ||
          (Math.floor(a / 27) === Math.floor(b / 27) &&
            Math.floor((a % 9) / 3) === Math.floor((b % 9) / 3));
        expect((s.notes[i] & bit(bad)) !== 0).toBe(!peer(i, cell));
      }
    }
    const u = L.undo(s);
    expect(u.values).toEqual(withNotes.values);
    expect(u.notes).toEqual(withNotes.notes);
    expect(u.history).toHaveLength(withNotes.history.length);
  });

  it('undo on empty history is a no-op', () => {
    const s = fresh();
    expect(L.undo(s)).toBe(s);
  });

  it('undo reverses several actions in order', () => {
    let s = fresh();
    const cells = emptyCells(s).slice(0, 3);
    const snaps = [s];
    for (const c of cells) {
      s = L.pressCell(L.pressDigit(s, wrongDigit(s, c)), c);
      s = { ...s, selectedDigit: null };
      snaps.push(s);
    }
    for (let k = snaps.length - 2; k >= 0; k--) {
      s = L.undo(s);
      expect(s.values).toEqual(snaps[k].values);
      expect(s.notes).toEqual(snaps[k].notes);
    }
  });

  it('restart keeps puzzle and assisted flag but clears entries, notes, history, timer', () => {
    let s = fresh();
    const { cell, bad } = setup(s);
    s = L.pressCell(L.pressDigit(s, bad), cell);
    s = L.tick(s, 5000);
    s = L.validate(s);
    const r = L.restart(s);
    expect(r.values).toEqual(s.puzzle);
    expect(r.notes.every((n) => n === 0)).toBe(true);
    expect(r.history).toHaveLength(0);
    expect(r.elapsedMs).toBe(0);
    expect(r.assisted).toBe(true);
    expect(r.puzzle).toEqual(s.puzzle);
    expect(r.status).toBe('playing');
  });
});

describe('help actions', () => {
  it('each help action sets assisted', () => {
    const s = fresh();
    expect(s.assisted).toBe(false);
    expect(L.requestHint(s).assisted).toBe(true);
    expect(L.showMismatches(s).assisted).toBe(true);
    expect(L.validate(s).assisted).toBe(true);
    expect(L.autoNotes(s).assisted).toBe(true);
    const h = L.requestHint(s);
    expect(L.revealHint({ ...s, hint: h.hint }).assisted).toBe(true);
    expect(L.applyHint(h).assisted).toBe(true);
  });

  it('showMismatches lists wrong user cells only', () => {
    let s = fresh();
    const [a, b] = emptyCells(s);
    s = L.pressCell(L.pressDigit(s, wrongDigit(s, a)), a);
    s = { ...s, selectedDigit: null };
    s = L.pressCell(L.pressDigit(s, s.solution[b] as Digit), b);
    expect(L.showMismatches(s).mismatches).toEqual([a]);
  });

  it('validate toasts', () => {
    let s = fresh();
    expect(L.validate(s).toast).toBe('No errors so far');
    const [a, b] = emptyCells(s);
    s = L.pressCell(L.pressDigit(s, wrongDigit(s, a)), a);
    expect(L.validate(s).toast).toBe('1 error found');
    s = { ...s, selectedDigit: null };
    s = L.pressCell(L.pressDigit(s, wrongDigit(s, b)), b);
    expect(L.validate(s).toast).toBe('2 errors found');
  });

  it('autoNotes fills legal candidates and is undoable', () => {
    const s = fresh();
    const a = L.autoNotes(s);
    for (const i of emptyCells(s)) expect(a.notes[i]).not.toBe(0);
    for (let i = 0; i < 81; i++) if (s.values[i] !== 0) expect(a.notes[i]).toBe(0);
    const u = L.undo(a);
    expect(u.notes).toEqual(s.notes);
  });

  it('hint: stage 1, reveal -> stage 2, apply places/eliminates and is undoable', () => {
    const s = fresh();
    let h = L.requestHint(s);
    expect(h.hint?.stage).toBe(1);
    expect(h.hint?.step.technique).toBeDefined();
    h = L.revealHint(h);
    expect(h.hint?.stage).toBe(2);
    const step = h.hint!.step;
    const applied = L.applyHint(h);
    expect(applied.hint).toBeNull();
    for (const { cell, digit } of step.placements) expect(applied.values[cell]).toBe(digit);
    const u = L.undo(applied);
    expect(u.values).toEqual(s.values);
    expect(u.notes).toEqual(s.notes);
  });

  it('hint on an elimination step shows notes and removes the eliminated candidates', () => {
    // Medium puzzle: the first step is usually still a single, so walk until an elimination step.
    const m = generate('medium', mulberry32(1));
    let s = L.newGameData('medium', m.puzzle, m.solution);
    let found = false;
    for (let k = 0; k < 80 && !found; k++) {
      const h = L.requestHint(s);
      if (!h.hint) break;
      if (h.hint.step.eliminations.length > 0) {
        const step = h.hint.step;
        const a = L.applyHint(h);
        for (const { cell, digit } of step.eliminations) {
          expect(a.notes[cell] & bit(digit)).toBe(0);
        }
        expect(L.undo(a).notes).toEqual(s.notes);
        found = true;
      } else {
        s = L.applyHint(h);
      }
    }
    expect(found).toBe(true);
  });

  it('hint uses user notes when every empty cell has notes', () => {
    let s = L.autoNotes(fresh());
    const h = L.requestHint(s);
    expect(h.hint).not.toBeNull();
    s = L.applyHint(h);
    expect(s.hint).toBeNull();
  });

  it('hint refuses while a wrong entry is on the board', () => {
    let s = fresh();
    const { cell, bad } = setup(s);
    s = L.pressCell(L.pressDigit(s, bad), cell);
    const h = L.requestHint(s);
    expect(h.hint).toBeNull();
    expect(h.toast).toMatch(/wrong/i);
  });

  it('editing clears a pending hint', () => {
    let s = L.requestHint(fresh());
    expect(s.hint).not.toBeNull();
    const { cell, bad } = setup(s);
    s = L.pressCell(L.pressDigit(s, bad), cell);
    expect(s.hint).toBeNull();
  });
});

describe('win and timer', () => {
  it('filling the last cell correctly wins and stops the timer', () => {
    let s = fresh();
    const cells = emptyCells(s);
    const last = cells[cells.length - 1];
    for (const c of cells.slice(0, -1))
      s = { ...s, values: s.values.map((v, i) => (i === c ? s.solution[c] : v)) };
    expect(s.status).toBe('playing');
    s = L.pressCell(L.pressDigit(s, s.solution[last] as Digit), last);
    expect(s.status).toBe('won');
    expect(s.running).toBe(false);
  });

  it('tick only counts while running; pause/resume', () => {
    let s = fresh();
    s = L.tick(s, 1000);
    expect(s.elapsedMs).toBe(1000);
    s = L.pause(s);
    s = L.tick(s, 1000);
    expect(s.elapsedMs).toBe(1000);
    s = L.resume(s);
    s = L.tick(s, 500);
    expect(s.elapsedMs).toBe(1500);
  });
});

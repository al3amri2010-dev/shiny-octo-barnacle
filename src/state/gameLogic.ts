import { bit, computeCandidates } from '../engine/candidates';
import { nextStep } from '../engine/logicalSolver';
import { PEERS } from '../engine/units';
import type { Candidates, Difficulty, Digit, Grid, Step } from '../engine/types';

/** Pure game state and reducers; the zustand store is a thin wrapper around these. */

export type Mode = 'normal' | 'notes' | 'erase';
export type Status = 'idle' | 'playing' | 'won';

/** Previous value/notes of every cell one user action changed. */
export type HistoryEntry = { cell: number; value: number; notes: number }[];

export interface GameData {
  puzzle: Grid;
  solution: Grid;
  values: Grid;
  notes: number[];
  difficulty: Difficulty;
  selectedDigit: Digit | null;
  selectedCell: number | null;
  mode: Mode;
  history: HistoryEntry[];
  elapsedMs: number;
  running: boolean;
  assisted: boolean;
  status: Status;
  hint: { step: Step; stage: 1 | 2 } | null;
  mismatches: number[];
  toast: string | null;
}

const empty81 = (): number[] => new Array<number>(81).fill(0);

export function initialGameData(): GameData {
  return {
    puzzle: empty81(),
    solution: empty81(),
    values: empty81(),
    notes: empty81(),
    difficulty: 'easy',
    selectedDigit: null,
    selectedCell: null,
    mode: 'normal',
    history: [],
    elapsedMs: 0,
    running: false,
    assisted: false,
    status: 'idle',
    hint: null,
    mismatches: [],
    toast: null,
  };
}

export function newGameData(difficulty: Difficulty, puzzle: Grid, solution: Grid): GameData {
  return {
    ...initialGameData(),
    puzzle: puzzle.slice(),
    solution: solution.slice(),
    values: puzzle.slice(),
    difficulty,
    running: true,
    status: 'playing',
  };
}

export function restart(s: GameData): GameData {
  return {
    ...initialGameData(),
    puzzle: s.puzzle,
    solution: s.solution,
    values: s.puzzle.slice(),
    difficulty: s.difficulty,
    assisted: s.assisted,
    running: true,
    status: 'playing',
  };
}

/** Number of placed copies of d on the board, subtracted from 9. */
export function remaining(s: GameData, d: number): number {
  let n = 0;
  for (const v of s.values) if (v === d) n++;
  return 9 - n;
}

const isGiven = (s: GameData, i: number): boolean => s.puzzle[i] !== 0;
const isEditable = (s: GameData, i: number): boolean => s.puzzle[i] === 0;
const isPlaying = (s: GameData): boolean => s.status === 'playing';

/** Working copy that records the pre-change state of each touched cell once. */
class Edit {
  values: Grid;
  notes: number[];
  private before = new Map<number, { value: number; notes: number }>();
  constructor(s: GameData) {
    this.values = s.values.slice();
    this.notes = s.notes.slice();
  }
  private touch(cell: number): void {
    if (!this.before.has(cell)) {
      this.before.set(cell, { value: this.values[cell], notes: this.notes[cell] });
    }
  }
  setValue(cell: number, value: number): void {
    this.touch(cell);
    this.values[cell] = value;
  }
  setNotes(cell: number, notes: number): void {
    this.touch(cell);
    this.notes[cell] = notes;
  }
  /** Place a digit: clears the cell's notes and removes the digit from all peers' notes. */
  place(cell: number, digit: number): void {
    this.setValue(cell, digit);
    this.setNotes(cell, 0);
    for (const p of PEERS[cell]) {
      if (this.notes[p] & bit(digit)) this.setNotes(p, this.notes[p] & ~bit(digit));
    }
  }
  clear(cell: number): void {
    this.setValue(cell, 0);
    this.setNotes(cell, 0);
  }
  /** History entry containing only cells that really changed, or null if nothing did. */
  entry(): HistoryEntry | null {
    const out: HistoryEntry = [];
    for (const [cell, b] of this.before) {
      if (b.value !== this.values[cell] || b.notes !== this.notes[cell]) out.push({ cell, ...b });
    }
    return out.length ? out : null;
  }
}

/** Commits an edit: pushes history, clears transient help state, detects the win. */
function commit(s: GameData, e: Edit, extra: Partial<GameData> = {}): GameData {
  const entry = e.entry();
  if (!entry) return { ...s, ...extra };
  const next: GameData = {
    ...s,
    ...extra,
    values: e.values,
    notes: e.notes,
    history: [...s.history, entry],
    hint: null,
    mismatches: [],
    toast: null,
  };
  if (next.values.every((v, i) => v === next.solution[i])) {
    next.status = 'won';
    next.running = false;
  }
  return next;
}

function placeOrNote(s: GameData, cell: number, digit: number, extra: Partial<GameData>): GameData {
  if (!isPlaying(s) || !isEditable(s, cell) || s.values[cell] !== 0) return { ...s, ...extra };
  const e = new Edit(s);
  if (s.mode === 'notes') e.setNotes(cell, s.notes[cell] ^ bit(digit));
  else e.place(cell, digit);
  return commit(s, e, extra);
}

export function pressDigit(s: GameData, d: Digit): GameData {
  const c = s.selectedCell;
  if (c !== null && isEditable(s, c) && s.values[c] === 0) return placeOrNote(s, c, d, {});
  return { ...s, selectedDigit: s.selectedDigit === d ? null : d };
}

export function pressCell(s: GameData, i: number): GameData {
  if (s.mode === 'erase') {
    if (!isPlaying(s) || !isEditable(s, i)) return s;
    const e = new Edit(s);
    e.clear(i);
    return commit(s, e, { selectedCell: i });
  }
  const v = s.values[i];
  if (isGiven(s, i)) return { ...s, selectedDigit: v as Digit, selectedCell: null };
  if (v !== 0) {
    if (s.selectedDigit === v && isPlaying(s)) {
      const e = new Edit(s);
      e.clear(i);
      return commit(s, e, { selectedCell: i });
    }
    return { ...s, selectedDigit: v as Digit, selectedCell: null };
  }
  if (s.selectedDigit !== null) return placeOrNote(s, i, s.selectedDigit, { selectedCell: i });
  return { ...s, selectedCell: i };
}

export function toggleNotesMode(s: GameData): GameData {
  return { ...s, mode: s.mode === 'notes' ? 'normal' : 'notes' };
}

export function toggleEraseMode(s: GameData): GameData {
  return { ...s, mode: s.mode === 'erase' ? 'normal' : 'erase' };
}

export function undo(s: GameData): GameData {
  if (!isPlaying(s) || s.history.length === 0) return s;
  const entry = s.history[s.history.length - 1];
  const values = s.values.slice();
  const notes = s.notes.slice();
  for (const { cell, value, notes: n } of entry) {
    values[cell] = value;
    notes[cell] = n;
  }
  return {
    ...s,
    values,
    notes,
    history: s.history.slice(0, -1),
    hint: null,
    mismatches: [],
    toast: null,
  };
}

/* ---------- help ---------- */

/** True when every empty cell has at least one note. */
function hasFullNotes(s: GameData): boolean {
  let any = false;
  for (let i = 0; i < 81; i++) {
    if (s.values[i] !== 0) continue;
    if (s.notes[i] === 0) return false;
    any = true;
  }
  return any;
}

/** User notes intersected with legal candidates when usable, else the computed candidates. */
function hintCandidates(s: GameData): { cands: Candidates; fromNotes: boolean } {
  const legal = computeCandidates(s.values);
  if (!hasFullNotes(s)) return { cands: legal, fromNotes: false };
  const cands = legal.map((m, i) => (s.values[i] === 0 ? m & s.notes[i] : 0));
  if (cands.some((m, i) => s.values[i] === 0 && m === 0)) return { cands: legal, fromNotes: false };
  return { cands, fromNotes: true };
}

const wrongCells = (s: GameData): number[] => {
  const out: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (s.puzzle[i] === 0 && s.values[i] !== 0 && s.values[i] !== s.solution[i]) out.push(i);
  }
  return out;
};

export function requestHint(s: GameData): GameData {
  if (!isPlaying(s)) return s;
  const base: GameData = { ...s, assisted: true };
  if (wrongCells(s).length > 0) {
    return { ...base, hint: null, toast: 'Fix the wrong entries first (try Mismatches)' };
  }
  const step = nextStep(s.values, hintCandidates(s).cands);
  if (!step) return { ...base, hint: null, toast: 'No hint available' };
  return { ...base, hint: { step, stage: 1 }, toast: null };
}

export function revealHint(s: GameData): GameData {
  if (!s.hint) return s;
  return { ...s, assisted: true, hint: { ...s.hint, stage: 2 } };
}

export function applyHint(s: GameData): GameData {
  if (!s.hint || !isPlaying(s)) return s;
  const { step } = s.hint;
  const e = new Edit(s);
  if (step.eliminations.length > 0 && !hintCandidates(s).fromNotes) {
    // Eliminations only mean something on the board as notes, so show the computed notes first.
    const legal = computeCandidates(s.values);
    for (let i = 0; i < 81; i++) if (s.values[i] === 0) e.setNotes(i, legal[i]);
  }
  for (const { cell, digit } of step.eliminations) e.setNotes(cell, e.notes[cell] & ~bit(digit));
  for (const { cell, digit } of step.placements) e.place(cell, digit);
  return commit(s, e, { assisted: true, hint: null });
}

export function showMismatches(s: GameData): GameData {
  return { ...s, assisted: true, mismatches: wrongCells(s) };
}

export function validate(s: GameData): GameData {
  const n = wrongCells(s).length;
  const toast = n === 0 ? 'No errors so far' : `${n} ${n === 1 ? 'error' : 'errors'} found`;
  return { ...s, assisted: true, toast };
}

export function autoNotes(s: GameData): GameData {
  if (!isPlaying(s)) return s;
  const legal = computeCandidates(s.values);
  const e = new Edit(s);
  for (let i = 0; i < 81; i++) if (s.values[i] === 0) e.setNotes(i, legal[i]);
  return commit(s, e, { assisted: true });
}

/* ---------- timer ---------- */

export function tick(s: GameData, ms: number): GameData {
  return s.running && isPlaying(s) ? { ...s, elapsedMs: s.elapsedMs + ms } : s;
}
export const pause = (s: GameData): GameData => (s.running ? { ...s, running: false } : s);
export const resume = (s: GameData): GameData =>
  isPlaying(s) && !s.running ? { ...s, running: true } : s;

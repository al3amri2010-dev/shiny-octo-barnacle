import { bit, has, popcount } from '../engine/candidates';
import type { Rng } from '../engine/rng';
import { BOXES, COLS, ROWS } from '../engine/units';
import type { Candidates, CellDigit, Grid, Step, TechniqueId } from '../engine/types';
import { bankSize, toPosition, type Position } from './bank';

/** Placement steps (singles) are answered by placing a digit, the rest by striking candidates. */
export function isPlacementStep(step: Step): boolean {
  return step.placements.length > 0;
}

const sameCd = (a: CellDigit, b: CellDigit): boolean => a.cell === b.cell && a.digit === b.digit;
const hasCd = (list: CellDigit[], x: CellDigit): boolean => list.some((y) => sameCd(x, y));

export type CheckStatus = 'empty' | 'correct' | 'partial' | 'wrong';

export interface CheckResult {
  status: CheckStatus;
  /** The marks that are not part of the answer (these flash red). */
  wrong: CellDigit[];
  message: string;
}

/** Every digit in the empty cells of `unit` that has exactly one candidate cell there. */
function onlyPlaceInSomeUnit(grid: Grid, cands: Candidates, cell: number, digit: number): boolean {
  for (const unit of [ROWS, COLS, BOXES]) {
    const cells = unit.find((u) => u.includes(cell));
    if (!cells) continue;
    if (cells.some((c) => grid[c] === digit)) continue;
    if (cells.filter((c) => grid[c] === 0 && has(cands[c], digit)).length === 1) return true;
  }
  return false;
}

/**
 * Is placing `digit` in `cell` a valid use of the singles technique? Several singles may exist
 * in one position, so any of them is accepted, not just the one the solver found first.
 */
export function isValidPlacement(
  technique: TechniqueId,
  grid: Grid,
  cands: Candidates,
  cell: number,
  digit: number,
): boolean {
  if (grid[cell] !== 0 || !has(cands[cell], digit)) return false;
  if (technique === 'nakedSingle') return popcount(cands[cell]) === 1;
  if (technique === 'hiddenSingle') return onlyPlaceInSomeUnit(grid, cands, cell, digit);
  if (technique === 'fullHouse') {
    return [ROWS, COLS, BOXES].some((units) =>
      units.some(
        (cells) => cells.includes(cell) && cells.filter((c) => grid[c] === 0).length === 1,
      ),
    );
  }
  return false;
}

export function checkPlacement(position: Position, placed: CellDigit | null): CheckResult {
  if (!placed) return { status: 'empty', wrong: [], message: 'Pick a cell and a digit first.' };
  const { step, grid, cands } = position;
  const exact = step.placements.some((p) => sameCd(p, placed));
  if (exact || isValidPlacement(step.technique, grid, cands, placed.cell, placed.digit)) {
    return { status: 'correct', wrong: [], message: 'Correct!' };
  }
  return { status: 'wrong', wrong: [placed], message: 'Not quite. Try again or ask for a hint.' };
}

export function checkEliminations(step: Step, struck: CellDigit[]): CheckResult {
  if (struck.length === 0) {
    return { status: 'empty', wrong: [], message: 'Tap the candidates you want to strike first.' };
  }
  const wrong = struck.filter((s) => !hasCd(step.eliminations, s));
  if (wrong.length > 0) {
    return { status: 'wrong', wrong, message: 'Not quite. The red marks do not belong.' };
  }
  if (struck.length === step.eliminations.length) {
    return { status: 'correct', wrong: [], message: 'Correct!' };
  }
  return { status: 'partial', wrong: [], message: 'Good, there is more to remove.' };
}

export type Help = 0 | 1 | 2 | 3;

export interface PracticeState {
  position: Position;
  /** Candidates the player has struck (elimination steps). */
  struck: CellDigit[];
  /** The digit the player placed (placement steps). */
  placed: CellDigit | null;
  /** 0 none, 1 units shown, 2 pattern shown, 3 answer filled in. */
  help: Help;
  /** Number of wrong checks so far. */
  mistakes: number;
  status: CheckStatus | 'idle';
  wrong: CellDigit[];
  message: string;
}

export function newPractice(position: Position): PracticeState {
  return {
    position,
    struck: [],
    placed: null,
    help: 0,
    mistakes: 0,
    status: 'idle',
    wrong: [],
    message: '',
  };
}

/** A solved position earns "clean" credit when no answer was revealed and nothing was wrong. */
export function isClean(s: PracticeState): boolean {
  return s.help < 3 && s.mistakes === 0;
}

export type PracticeAction =
  | { type: 'strike'; cell: number; digit: number }
  | { type: 'place'; cell: number; digit: number }
  | { type: 'check' }
  | { type: 'hint' }
  | { type: 'reset'; position: Position };

function applyCheck(s: PracticeState, r: CheckResult): PracticeState {
  return {
    ...s,
    status: r.status,
    wrong: r.wrong,
    message: r.message,
    mistakes: s.mistakes + (r.status === 'wrong' ? 1 : 0),
  };
}

export function practiceReducer(s: PracticeState, a: PracticeAction): PracticeState {
  if (a.type === 'reset') return newPractice(a.position);
  if (s.status === 'correct') return s; // solved: the position is locked until "Next"
  const { step } = s.position;
  switch (a.type) {
    case 'strike': {
      if (isPlacementStep(step)) return s;
      const target = { cell: a.cell, digit: a.digit };
      if (s.position.grid[a.cell] !== 0 || !has(s.position.cands[a.cell], a.digit)) return s;
      const struck = hasCd(s.struck, target)
        ? s.struck.filter((x) => !sameCd(x, target))
        : [...s.struck, target];
      return { ...s, struck, status: 'idle', wrong: [], message: '' };
    }
    case 'place': {
      if (!isPlacementStep(step) || s.position.grid[a.cell] !== 0) return s;
      const placed = { cell: a.cell, digit: a.digit };
      return applyCheck({ ...s, placed }, checkPlacement(s.position, placed));
    }
    case 'check': {
      if (isPlacementStep(step)) return applyCheck(s, checkPlacement(s.position, s.placed));
      return applyCheck(s, checkEliminations(step, s.struck));
    }
    case 'hint': {
      const help = Math.min(3, s.help + 1) as Help;
      if (help < 3) return { ...s, help, status: 'idle', wrong: [], message: '' };
      // Third hint: fill in the answer. It counts as solved, but not clean.
      if (isPlacementStep(step)) {
        const placed = step.placements[0];
        return { ...s, help, placed, status: 'correct', wrong: [], message: 'Here is the answer.' };
      }
      return {
        ...s,
        help,
        struck: step.eliminations.slice(),
        status: 'correct',
        wrong: [],
        message: 'Here is the answer.',
      };
    }
  }
}

/** Mask of struck candidates per cell. */
export function struckMasks(struck: CellDigit[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const { cell, digit } of struck) m.set(cell, (m.get(cell) ?? 0) | bit(digit));
  return m;
}

/**
 * Picks a bank position for `technique`, preferring ones not in `seen`; once all were seen the
 * history starts over (but never repeats `last` straight away when there is a choice).
 */
export function pickPosition(
  technique: TechniqueId,
  rng: Rng,
  seen: string[] = [],
): Position | null {
  const n = bankSize(technique);
  if (n === 0) return null;
  const keys = Array.from({ length: n }, (_, i) => `${technique}:${i}`);
  let pool = keys.filter((k) => !seen.includes(k));
  if (pool.length === 0) pool = keys.filter((k) => k !== seen[seen.length - 1]);
  if (pool.length === 0) pool = keys;
  const key = pool[Math.floor(rng() * pool.length)];
  return toPosition(technique, Number(key.split(':')[1]));
}

import { parseGrid } from '../engine/parse';
import type { Candidates, Grid, Step, TechniqueId } from '../engine/types';
import raw from './bank.json';

/** Compact bank entry written by scripts/build-training-bank.ts. */
export interface BankPosition {
  /** 81-char grid, `.` = empty. */
  g: string;
  /** Candidate masks of the 81 cells: the solver's state at that moment. */
  c: number[];
  s: Step;
}
export type Bank = Record<TechniqueId, BankPosition[]>;

/** A practice / diagram position: the next step of the logical solver is `step`. */
export interface Position {
  /** Stable identifier, `<technique>:<index>`. */
  key: string;
  grid: Grid;
  cands: Candidates;
  step: Step;
}

export const BANK = raw as unknown as Bank;

export function bankSize(technique: TechniqueId): number {
  return BANK[technique]?.length ?? 0;
}

export function toPosition(technique: TechniqueId, index: number): Position {
  const p = BANK[technique][index];
  return { key: `${technique}:${index}`, grid: parseGrid(p.g), cands: p.c.slice(), step: p.s };
}

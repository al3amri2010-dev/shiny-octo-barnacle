/** A Sudoku grid: 81 cells in row-major order, 0 = empty. */
export type Grid = number[];
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
/** 81 bit masks; bit (d - 1) set means digit d is still a candidate. Filled cells hold 0. */
export type Candidates = number[];

export type UnitKind = 'row' | 'col' | 'box';
export interface Unit {
  kind: UnitKind;
  index: number; // 0..8
}

export type TechniqueId =
  | 'fullHouse'
  | 'nakedSingle'
  | 'hiddenSingle'
  | 'pointing'
  | 'claiming'
  | 'nakedPair'
  | 'hiddenPair'
  | 'nakedTriple'
  | 'hiddenTriple'
  | 'xWing'
  | 'nakedQuad'
  | 'hiddenQuad'
  | 'swordfish'
  | 'skyscraper'
  | 'twoStringKite'
  | 'xyWing';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface CellDigit {
  cell: number;
  digit: number;
}

export interface Step {
  technique: TechniqueId;
  placements: CellDigit[];
  eliminations: CellDigit[];
  highlight: { cells: number[]; candidates: CellDigit[]; units: Unit[] };
  explanation: string;
}

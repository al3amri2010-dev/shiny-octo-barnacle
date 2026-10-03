import { solveLogically } from './logicalSolver';
import type { Difficulty, Grid, Step, TechniqueId } from './types';

export const TECHNIQUE_LEVEL: Record<TechniqueId, Difficulty> = {
  fullHouse: 'easy',
  nakedSingle: 'easy',
  hiddenSingle: 'easy',
  pointing: 'medium',
  claiming: 'medium',
  nakedPair: 'medium',
  hiddenPair: 'medium',
  nakedTriple: 'hard',
  hiddenTriple: 'hard',
  nakedQuad: 'hard',
  hiddenQuad: 'hard',
  xWing: 'hard',
  swordfish: 'expert',
  xyWing: 'expert',
  skyscraper: 'expert',
  twoStringKite: 'expert',
};

const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2, expert: 3 };

export interface Grade {
  difficulty: Difficulty | 'unsolvable';
  hardest: TechniqueId | null;
  steps: Step[];
}

/** Difficulty = highest level among techniques needed; 'unsolvable' if the solver gets stuck. */
export function grade(grid: Grid): Grade {
  const { solved, steps, hardest } = solveLogically(grid);
  if (!solved) return { difficulty: 'unsolvable', hardest, steps };
  let difficulty: Difficulty = 'easy';
  for (const s of steps) {
    const level = TECHNIQUE_LEVEL[s.technique];
    if (RANK[level] > RANK[difficulty]) difficulty = level;
  }
  return { difficulty, hardest, steps };
}

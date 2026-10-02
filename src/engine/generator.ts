import { countSolutions, solveRandom } from './bruteforce';
import { grade, TECHNIQUE_LEVEL } from './grader';
import { solveLogically } from './logicalSolver';
import { mulberry32, shuffle, type Rng } from './rng';
import { TECHNIQUE_ORDER } from './techniques';
import type { Difficulty, Grid, TechniqueId } from './types';

export interface Generated {
  puzzle: Grid;
  solution: Grid;
  hardest: TechniqueId;
}

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
const rank = (d: Difficulty): number => LEVELS.indexOf(d);

/** Techniques a puzzle of the given level may use. */
export function allowedTechniques(difficulty: Difficulty): TechniqueId[] {
  return TECHNIQUE_ORDER.filter((t) => rank(TECHNIQUE_LEVEL[t]) <= rank(difficulty));
}

/**
 * Attempt caps. Puzzles that genuinely need a Hard-level technique (triples, quads, X-Wing)
 * are rare among random puzzles (~1-2% per attempt), hence the large cap for Hard.
 */
export const MAX_ATTEMPTS: Record<Difficulty, number> = {
  easy: 40,
  medium: 40,
  hard: 150,
  expert: 60,
};

interface Attempt {
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
  hardest: TechniqueId;
}

/**
 * One attempt: random solution, then dig symmetric pairs (180 degree rotation). A removal is
 * kept only while the solution stays unique and the puzzle stays logically solvable with the
 * target level's techniques, so the result never grades above the target and never as
 * 'unsolvable'. Easy stops early at 36-40 clues so it feels easy.
 */
export function attempt(difficulty: Difficulty, rng: Rng): Attempt | null {
  const solution = solveRandom(new Array<number>(81).fill(0), rng);
  if (!solution) return null;
  const allowed = allowedTechniques(difficulty);
  const puzzle = solution.slice();
  const minClues = difficulty === 'easy' ? 36 + Math.floor(rng() * 5) : 0;
  let clues = 81;

  const pairs: number[][] = [];
  for (let i = 0; i <= 40; i++) pairs.push(i === 40 ? [40] : [i, 80 - i]);
  shuffle(pairs, rng);

  for (const pair of pairs) {
    if (clues - pair.length < minClues) continue;
    for (const c of pair) puzzle[c] = 0;
    if (countSolutions(puzzle, 2) === 1 && solveLogically(puzzle, allowed).solved) {
      clues -= pair.length;
    } else {
      for (const c of pair) puzzle[c] = solution[c];
    }
    if (clues <= minClues) break;
  }

  const g = grade(puzzle);
  if (g.difficulty === 'unsolvable' || g.hardest === null) return null;
  return { puzzle, solution, difficulty: g.difficulty, hardest: g.hardest };
}

/** Keeps the best attempt so far: the exact match, else the highest-ranked easier one. */
class Picker {
  best: Attempt | null = null;
  consider(a: Attempt | null, target: Difficulty): Generated | null {
    if (!a || rank(a.difficulty) > rank(target)) return null;
    if (a.difficulty === target) return toResult(a);
    if (!this.best || rank(a.difficulty) > rank(this.best.difficulty)) this.best = a;
    return null;
  }
}

const toResult = (a: Attempt): Generated => ({
  puzzle: a.puzzle,
  solution: a.solution,
  hardest: a.hardest,
});

/** Last resort if no attempt ever solved: an easy puzzle is always producible. */
function fallbackEasy(rng: Rng): Generated {
  for (;;) {
    const a = attempt('easy', rng);
    if (a) return toResult(a);
  }
}

export function generate(difficulty: Difficulty, rng: Rng): Generated {
  const picker = new Picker();
  for (let i = 0; i < MAX_ATTEMPTS[difficulty]; i++) {
    const r = picker.consider(attempt(difficulty, rng), difficulty);
    if (r) return r;
  }
  return picker.best ? toResult(picker.best) : fallbackEasy(rng);
}

/** Same as `generate` but yields to the event loop between attempts so the UI stays responsive. */
export async function generateAsync(difficulty: Difficulty, seed?: number): Promise<Generated> {
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 0xffffffff));
  const picker = new Picker();
  for (let i = 0; i < MAX_ATTEMPTS[difficulty]; i++) {
    await new Promise<void>((r) => setTimeout(r, 0));
    const r = picker.consider(attempt(difficulty, rng), difficulty);
    if (r) return r;
  }
  return picker.best ? toResult(picker.best) : fallbackEasy(rng);
}

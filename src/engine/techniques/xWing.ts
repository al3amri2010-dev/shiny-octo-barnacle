import { findFish } from './fish';
import type { Candidates, Grid, Step } from '../types';

export function find(grid: Grid, cands: Candidates): Step | null {
  return findFish(grid, cands, 2, 'xWing');
}

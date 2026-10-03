import { findHiddenSubset } from './subsets';
import type { Candidates, Grid, Step } from '../types';

export function find(grid: Grid, cands: Candidates): Step | null {
  return findHiddenSubset(grid, cands, 3, 'hiddenTriple');
}

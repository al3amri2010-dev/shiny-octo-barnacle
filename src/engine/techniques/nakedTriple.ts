import { findNakedSubset } from './subsets';
import type { Candidates, Grid, Step } from '../types';

export function find(grid: Grid, cands: Candidates): Step | null {
  return findNakedSubset(grid, cands, 3, 'nakedTriple');
}

import { find as fullHouse } from './fullHouse';
import { find as nakedSingle } from './nakedSingle';
import { find as hiddenSingle } from './hiddenSingle';
import { find as pointing } from './pointing';
import { find as claiming } from './claiming';
import { find as nakedPair } from './nakedPair';
import { find as hiddenPair } from './hiddenPair';
import { find as nakedTriple } from './nakedTriple';
import { find as hiddenTriple } from './hiddenTriple';
import { find as xWing } from './xWing';
import { find as nakedQuad } from './nakedQuad';
import { find as hiddenQuad } from './hiddenQuad';
import { find as swordfish } from './swordfish';
import { find as skyscraper } from './skyscraper';
import { find as twoStringKite } from './twoStringKite';
import { find as xyWing } from './xyWing';
import type { Candidates, Grid, Step, TechniqueId } from '../types';

export type Finder = (grid: Grid, cands: Candidates) => Step | null;

/** Cheapest first; the logical solver tries techniques in exactly this order. */
export const TECHNIQUE_ORDER: TechniqueId[] = [
  'fullHouse',
  'nakedSingle',
  'hiddenSingle',
  'pointing',
  'claiming',
  'nakedPair',
  'hiddenPair',
  'nakedTriple',
  'hiddenTriple',
  'xWing',
  'nakedQuad',
  'hiddenQuad',
  'swordfish',
  'skyscraper',
  'twoStringKite',
  'xyWing',
];

export const FINDERS: Record<TechniqueId, Finder> = {
  fullHouse,
  nakedSingle,
  hiddenSingle,
  pointing,
  claiming,
  nakedPair,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  xWing,
  nakedQuad,
  hiddenQuad,
  swordfish,
  skyscraper,
  twoStringKite,
  xyWing,
};

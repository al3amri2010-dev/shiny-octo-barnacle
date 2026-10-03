import { find as fullHouse } from '../techniques/fullHouse';
import { find as nakedSingle } from '../techniques/nakedSingle';
import { find as hiddenSingle } from '../techniques/hiddenSingle';
import { find as pointing } from '../techniques/pointing';
import { find as claiming } from '../techniques/claiming';
import { find as nakedPair } from '../techniques/nakedPair';
import { find as hiddenPair } from '../techniques/hiddenPair';
import { find as nakedTriple } from '../techniques/nakedTriple';
import { find as hiddenTriple } from '../techniques/hiddenTriple';
import { find as nakedQuad } from '../techniques/nakedQuad';
import { find as hiddenQuad } from '../techniques/hiddenQuad';
import { find as xWing } from '../techniques/xWing';
import { find as swordfish } from '../techniques/swordfish';
import { find as skyscraper } from '../techniques/skyscraper';
import { find as twoStringKite } from '../techniques/twoStringKite';
import { find as xyWing } from '../techniques/xyWing';
import {
  cell,
  elimKeys,
  fullState,
  placementKeys,
  state,
  transpose,
} from '../__testutils__/helpers';

/** Same candidate layout with rows and columns swapped. */
function transposed(spec: Record<string, number[]>): Record<string, number[]> {
  return Object.fromEntries(Object.entries(spec).map(([k, v]) => [transpose(k), v]));
}
const T = (keys: string[]): string[] =>
  keys.map((k) => {
    const [name, rest] = k.split(/(?=[:=])/);
    return `${transpose(name)}${rest}`;
  });

describe('fullHouse', () => {
  it('places the last digit of a unit', () => {
    const { grid, cands } = state({});
    [1, 2, 3, 4, 5, 6, 7, 8].forEach((d, k) => (grid[k] = d));
    const step = fullHouse(grid, cands)!;
    expect(placementKeys(step)).toEqual(['r1c9=9']);
    expect(step.technique).toBe('fullHouse');
    expect(step.explanation).toContain('r1c9');
  });
  it('returns null when no unit has a single gap', () => {
    const { grid, cands } = state({});
    expect(fullHouse(grid, cands)).toBeNull();
  });
});

describe('nakedSingle', () => {
  it('places a cell with one candidate', () => {
    const { grid, cands } = state({ r5c5: [7], r1c1: [1, 2] });
    expect(placementKeys(nakedSingle(grid, cands)!)).toEqual(['r5c5=7']);
  });
  it('returns null otherwise', () => {
    const { grid, cands } = state({ r5c5: [7, 8], r1c1: [1, 2] });
    expect(nakedSingle(grid, cands)).toBeNull();
  });
});

describe('hiddenSingle', () => {
  it('finds a digit with one spot in a row', () => {
    const spec: Record<string, number[]> = {};
    for (let c = 1; c <= 9; c++) spec[`r1c${c}`] = c === 6 ? [2, 4] : [1, 2];
    const step = hiddenSingle(...(Object.values(state(spec)) as [never, never]))!;
    expect(placementKeys(step)).toEqual(['r1c6=4']);
    expect(step.highlight.units).toEqual([{ kind: 'row', index: 0 }]);
  });
  it('finds a hidden single in a box and a column', () => {
    const { grid, cands } = fullState();
    for (const c of [1, 2, 3, 4, 5, 6, 7, 8, 9]) if (c !== 1) cands[cell(`r4c${c}`)] &= ~(1 << 2);
    // digit 3 now only fits at r4c1 within row 4 -> row hit; check column too
    expect(placementKeys(hiddenSingle(grid, cands)!)).toEqual(['r4c1=3']);
    const s2 = fullState();
    for (let r = 1; r <= 9; r++) if (r !== 7) s2.cands[cell(`r${r}c3`)] &= ~(1 << 8);
    const step = hiddenSingle(s2.grid, s2.cands)!;
    expect(placementKeys(step)).toEqual(['r7c3=9']);
  });
  it('returns null when every digit has several spots', () => {
    const { grid, cands } = fullState();
    expect(hiddenSingle(grid, cands)).toBeNull();
  });
});

describe('pointing', () => {
  const spec = {
    r1c1: [5, 1],
    r1c2: [5, 2],
    r1c7: [5, 3],
    r1c8: [5, 4],
    r2c1: [1, 2],
  };
  it('removes a digit from the rest of the row', () => {
    const { grid, cands } = state(spec);
    const step = pointing(grid, cands)!;
    expect(elimKeys(step)).toEqual(['r1c7:5', 'r1c8:5']);
    expect(step.placements).toEqual([]);
  });
  it('works along a column', () => {
    const { grid, cands } = state(transposed(spec));
    expect(elimKeys(pointing(grid, cands)!)).toEqual(T(['r1c7:5', 'r1c8:5']).sort());
  });
  it('returns null when the box candidates are not in one line', () => {
    const { grid, cands } = state({ ...spec, r2c1: [5], r1c8: [4] });
    expect(pointing(grid, cands)).toBeNull();
  });
});

describe('claiming', () => {
  const spec = { r1c1: [5, 1], r1c2: [5, 2], r2c3: [5, 6] };
  it('removes a digit from the rest of the box (row)', () => {
    const { grid, cands } = state(spec);
    expect(elimKeys(claiming(grid, cands)!)).toEqual(['r2c3:5']);
  });
  it('works for a column', () => {
    const { grid, cands } = state(transposed(spec));
    expect(elimKeys(claiming(grid, cands)!)).toEqual(T(['r2c3:5']));
  });
  it('returns null when the line spans two boxes', () => {
    const { grid, cands } = state({ ...spec, r1c9: [5] });
    expect(claiming(grid, cands)).toBeNull();
  });
});

describe('naked subsets', () => {
  it('naked pair (row)', () => {
    const { grid, cands } = state({
      r1c1: [1, 2],
      r1c2: [1, 2],
      r1c3: [1, 2, 3],
      r1c4: [2, 5],
      r1c5: [4, 5],
    });
    expect(elimKeys(nakedPair(grid, cands)!)).toEqual(['r1c3:1', 'r1c3:2', 'r1c4:2']);
  });
  it('naked pair (column and box)', () => {
    const col = state(
      transposed({ r1c1: [1, 2], r1c2: [1, 2], r1c3: [1, 2, 3], r1c4: [2, 5], r1c5: [4, 5] }),
    );
    expect(elimKeys(nakedPair(col.grid, col.cands)!)).toEqual(
      T(['r1c3:1', 'r1c3:2', 'r1c4:2']).sort(),
    );
    const box = state({ r4c4: [3, 8], r5c5: [3, 8], r6c6: [3, 8, 9], r4c5: [1, 8] });
    expect(elimKeys(nakedPair(box.grid, box.cands)!)).toEqual(['r4c5:8', 'r6c6:3', 'r6c6:8']);
  });
  it('naked pair negative', () => {
    const { grid, cands } = state({ r1c1: [1, 2], r1c2: [1, 3], r1c3: [1, 2, 3], r1c4: [2, 5] });
    expect(nakedPair(grid, cands)).toBeNull();
  });
  it('naked triple', () => {
    const { grid, cands } = state({
      r1c1: [1, 2],
      r1c2: [2, 3],
      r1c3: [1, 3],
      r1c4: [1, 2, 3, 4],
      r1c5: [3, 4],
    });
    expect(elimKeys(nakedTriple(grid, cands)!)).toEqual(['r1c4:1', 'r1c4:2', 'r1c4:3', 'r1c5:3']);
  });
  it('naked triple negative', () => {
    const { grid, cands } = state({
      r1c1: [1, 2],
      r1c2: [2, 3],
      r1c3: [1, 4],
      r1c4: [1, 2, 3, 4],
      r1c5: [3, 4],
    });
    expect(nakedTriple(grid, cands)).toBeNull();
  });
  it('naked quad', () => {
    const { grid, cands } = state({
      r1c1: [1, 2],
      r1c2: [2, 3],
      r1c3: [3, 4],
      r1c4: [1, 4],
      r1c5: [1, 2, 3, 4, 5],
    });
    expect(elimKeys(nakedQuad(grid, cands)!)).toEqual(['r1c5:1', 'r1c5:2', 'r1c5:3', 'r1c5:4']);
  });
  it('naked quad negative', () => {
    const { grid, cands } = state({
      r1c1: [1, 2],
      r1c2: [2, 3],
      r1c3: [3, 4],
      r1c4: [1, 5],
      r1c5: [1, 2, 3, 4, 5],
    });
    expect(nakedQuad(grid, cands)).toBeNull();
  });
});

describe('hidden subsets', () => {
  it('hidden pair (row)', () => {
    const { grid, cands } = state({
      r1c1: [1, 2, 5],
      r1c2: [1, 2, 6],
      r1c3: [3, 4, 5],
      r1c4: [3, 4, 6],
      r1c5: [3, 4, 5, 6],
    });
    expect(elimKeys(hiddenPair(grid, cands)!)).toEqual(['r1c1:5', 'r1c2:6']);
  });
  it('hidden pair (column and box)', () => {
    const spec = { r1c1: [1, 2, 5], r1c2: [1, 2, 6], r1c3: [3, 4, 5], r1c4: [3, 4, 6] };
    const col = state(transposed(spec));
    expect(elimKeys(hiddenPair(col.grid, col.cands)!)).toEqual(T(['r1c1:5', 'r1c2:6']).sort());
    const box = state({ r4c4: [1, 2, 7], r5c5: [1, 2, 8], r6c6: [3, 4, 7], r4c5: [3, 4, 8, 9] });
    expect(elimKeys(hiddenPair(box.grid, box.cands)!)).toEqual(['r4c4:7', 'r5c5:8']);
  });
  it('hidden pair negative', () => {
    const { grid, cands } = state({
      r1c1: [1, 2, 5],
      r1c2: [1, 6],
      r1c3: [3, 4, 5],
      r1c4: [3, 4, 6],
      r1c5: [3, 4, 5, 6],
      r1c6: [3, 4, 5, 6],
    });
    expect(hiddenPair(grid, cands)).toBeNull();
  });
  it('hidden triple', () => {
    const { grid, cands } = state({
      r1c1: [1, 2, 7],
      r1c2: [2, 3, 8],
      r1c3: [1, 3, 9],
      r1c4: [4, 7, 8, 9],
      r1c5: [4, 7, 8, 9],
    });
    expect(elimKeys(hiddenTriple(grid, cands)!)).toEqual(['r1c1:7', 'r1c2:8', 'r1c3:9']);
  });
  it('hidden triple negative', () => {
    const { grid, cands } = state({
      r1c1: [1, 2, 7],
      r1c2: [2, 3, 8],
      r1c3: [1, 9],
      r1c4: [4, 7, 8, 9],
      r1c5: [4, 7, 8, 9],
    });
    expect(hiddenTriple(grid, cands)).toBeNull();
  });
  it('hidden quad', () => {
    const { grid, cands } = state({
      r1c1: [1, 2, 7],
      r1c2: [2, 3, 8],
      r1c3: [3, 4, 9],
      r1c4: [1, 4, 6],
      r1c5: [5, 6, 7, 8, 9],
      r1c6: [5, 6, 7, 8, 9],
    });
    expect(elimKeys(hiddenQuad(grid, cands)!)).toEqual(['r1c1:7', 'r1c2:8', 'r1c3:9', 'r1c4:6']);
  });
  it('hidden quad negative', () => {
    const { grid, cands } = state({
      r1c1: [1, 2, 7],
      r1c2: [2, 3, 8],
      r1c3: [3, 4, 9],
      r1c4: [1, 6],
      r1c5: [5, 6, 7, 8, 9],
      r1c6: [5, 6, 7, 8, 9],
      r1c7: [5, 6, 7, 8, 9],
      r1c8: [5, 6, 7, 8, 9],
    });
    expect(hiddenQuad(grid, cands)).toBeNull();
  });
});

describe('fish', () => {
  const xw = {
    r2c3: [7, 1],
    r2c7: [7, 1],
    r6c3: [7, 1],
    r6c7: [7, 1],
    r4c3: [7, 2],
    r8c7: [7, 3],
  };
  it('X-Wing, row based', () => {
    const { grid, cands } = state(xw);
    const step = xWing(grid, cands)!;
    expect(elimKeys(step)).toEqual(['r4c3:7', 'r8c7:7']);
    expect(step.highlight.cells.sort((a, b) => a - b)).toEqual(
      ['r2c3', 'r2c7', 'r6c3', 'r6c7'].map(cell),
    );
  });
  it('X-Wing, column based', () => {
    const { grid, cands } = state(transposed(xw));
    expect(elimKeys(xWing(grid, cands)!)).toEqual(T(['r4c3:7', 'r8c7:7']).sort());
  });
  it('X-Wing negatives', () => {
    const missing = state({ ...xw, r6c7: [1] });
    expect(xWing(missing.grid, missing.cands)).toBeNull();
    const extra = state({ ...xw, r2c5: [7] });
    expect(xWing(extra.grid, extra.cands)).toBeNull();
  });

  const sf = {
    r1c2: [4, 1],
    r1c5: [4, 1],
    r4c5: [4, 1],
    r4c8: [4, 1],
    r7c2: [4, 1],
    r7c8: [4, 1],
    r3c2: [4, 2],
    r5c5: [4, 2],
    r9c8: [4, 2],
  };
  it('Swordfish, row based', () => {
    const { grid, cands } = state(sf);
    expect(elimKeys(swordfish(grid, cands)!)).toEqual(['r3c2:4', 'r5c5:4', 'r9c8:4']);
  });
  it('Swordfish, column based', () => {
    const { grid, cands } = state(transposed(sf));
    expect(elimKeys(swordfish(grid, cands)!)).toEqual(T(['r3c2:4', 'r5c5:4', 'r9c8:4']).sort());
  });
  it('Swordfish negative (a base row leaks into a fourth column)', () => {
    const { grid, cands } = state({ ...sf, r4c9: [4] });
    expect(swordfish(grid, cands)).toBeNull();
  });
});

describe('skyscraper', () => {
  const sky = {
    r2c1: [6, 1],
    r2c5: [6, 1],
    r7c1: [6, 1],
    r7c6: [6, 1],
    r1c6: [6, 2],
    r3c6: [6, 2],
    r5c5: [6, 3],
    r9c9: [6, 3],
  };
  it('eliminates cells that see both roofs (rows)', () => {
    const { grid, cands } = state(sky);
    const step = skyscraper(grid, cands)!;
    expect(elimKeys(step)).toEqual(['r1c6:6', 'r3c6:6']);
    expect(step.technique).toBe('skyscraper');
  });
  it('works column based', () => {
    const { grid, cands } = state(transposed(sky));
    expect(elimKeys(skyscraper(grid, cands)!)).toEqual(T(['r1c6:6', 'r3c6:6']).sort());
  });
  it('returns null for an X-Wing shape or no shared base', () => {
    const xw = state({ ...sky, r7c6: [1], r7c5: [6, 1] });
    expect(skyscraper(xw.grid, xw.cands)).toBeNull();
    const apart = state({ ...sky, r7c1: [1], r7c2: [6, 1] });
    expect(skyscraper(apart.grid, apart.cands)).toBeNull();
  });
});

describe('twoStringKite', () => {
  const kite = {
    r1c2: [3, 1],
    r1c8: [3, 1],
    r3c3: [3, 1],
    r8c3: [3, 1],
    r8c8: [3, 2],
    r5c5: [3, 2],
  };
  it('eliminates the cell seeing both far ends', () => {
    const { grid, cands } = state(kite);
    const step = twoStringKite(grid, cands)!;
    expect(elimKeys(step)).toEqual(['r8c8:3']);
    expect(step.technique).toBe('twoStringKite');
  });
  it('works transposed', () => {
    const { grid, cands } = state(transposed(kite));
    expect(elimKeys(twoStringKite(grid, cands)!)).toEqual(['r8c8:3']);
  });
  it('returns null when the string ends do not share a box', () => {
    const { grid, cands } = state({ ...kite, r3c3: [1], r4c3: [3, 1], r8c3: [3, 1] });
    expect(twoStringKite(grid, cands)).toBeNull();
  });
});

describe('xyWing', () => {
  const xy = { r1c1: [1, 2], r1c5: [1, 3], r3c2: [2, 3], r1c3: [3, 4], r3c5: [3, 4], r2c8: [3, 4] };
  it('eliminates the shared candidate from cells seeing both pincers', () => {
    const { grid, cands } = state(xy);
    const step = xyWing(grid, cands)!;
    expect(elimKeys(step)).toEqual(['r1c3:3', 'r3c5:3']);
    expect(step.explanation).toContain('r1c1');
  });
  it('returns null when pincers do not complement', () => {
    const { grid, cands } = state({ ...xy, r3c2: [2, 4] });
    expect(xyWing(grid, cands)).toBeNull();
  });
  it('returns null when a pincer does not see the pivot', () => {
    const { grid, cands } = state({ ...xy, r3c2: [], r5c8: [2, 3] });
    expect(xyWing(grid, cands)).toBeNull();
  });
});

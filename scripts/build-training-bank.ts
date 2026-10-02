/**
 * Offline builder for the training bank (src/training/bank.json).
 *
 *   npx tsx scripts/build-training-bank.ts [--per 12] [--seed N] [--minutes 5] [--out file]
 *   npx tsx scripts/build-training-bank.ts [--cap 24] --out bank.json --merge shard1.json shard2.json ...
 *
 * Shards (different --seed/--out) can run in parallel; --merge combines them, keeping at most
 * --cap positions per technique, diversified across the shards.
 *
 * Generates random unique-solution puzzles (dug with a random clue target, so some are very
 * hard), runs our logical solver step by step and, whenever the next step uses technique T
 * (so every easier technique already fails), snapshots the position: the grid, the solver's
 * candidate state at that moment (including earlier eliminations) and the step itself.
 * Stops when every technique has `--per` positions or the time budget runs out.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { solve, countSolutions, solveRandom } from '../src/engine/bruteforce';
import { computeCandidates } from '../src/engine/candidates';
import { applyStep, nextStep } from '../src/engine/logicalSolver';
import { gridToString } from '../src/engine/parse';
import { mulberry32, shuffle, type Rng } from '../src/engine/rng';
import { TECHNIQUE_ORDER } from '../src/engine/techniques';
import type { Bank, BankPosition } from '../src/training/bank';
import type { Candidates, Grid, Step, TechniqueId } from '../src/engine/types';

const DEFAULT_OUT = resolve(__dirname, '../src/training/bank.json');

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function emptyBank(): Bank {
  return Object.fromEntries(TECHNIQUE_ORDER.map((t) => [t, []])) as unknown as Bank;
}

function load(file: string): Bank {
  if (!existsSync(file)) return emptyBank();
  const b = JSON.parse(readFileSync(file, 'utf8')) as Bank;
  for (const t of TECHNIQUE_ORDER) b[t] ??= [];
  return b;
}

function save(file: string, bank: Bank): void {
  const lines = TECHNIQUE_ORDER.map(
    (t) => `${JSON.stringify(t)}:[\n${bank[t].map((p) => JSON.stringify(p)).join(',\n')}\n]`,
  );
  writeFileSync(file, `{\n${lines.join(',\n')}\n}\n`);
}

const key = (p: BankPosition): string =>
  p.g + JSON.stringify(p.s.eliminations) + p.s.placements[0]?.cell;

function dig(rng: Rng, targetClues: number): Grid | null {
  const solution = solveRandom(new Array<number>(81).fill(0), rng);
  if (!solution) return null;
  const puzzle = solution.slice();
  const order = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );
  let clues = 81;
  for (const cell of order) {
    if (clues <= targetClues) break;
    const keep = puzzle[cell];
    puzzle[cell] = 0;
    if (countSolutions(puzzle, 2) === 1) clues--;
    else puzzle[cell] = keep;
  }
  return puzzle;
}

interface Occurrence {
  grid: Grid;
  cands: Candidates;
  step: Step;
}

/** One random occurrence per technique along the logical solution of `puzzle`. */
function collect(puzzle: Grid, rng: Rng): Map<TechniqueId, Occurrence> {
  const seen = new Map<TechniqueId, { n: number; occ: Occurrence }>();
  let g = puzzle.slice();
  let c = computeCandidates(g);
  for (;;) {
    if (g.every((d) => d !== 0)) break;
    const step = nextStep(g, c);
    if (!step) break;
    const e = seen.get(step.technique);
    const n = (e?.n ?? 0) + 1;
    // reservoir sampling: keep each occurrence with probability 1/n
    if (!e || rng() < 1 / n) seen.set(step.technique, { n, occ: { grid: g, cands: c, step } });
    else e.n = n;
    ({ grid: g, cands: c } = applyStep(g, c, step));
  }
  return new Map([...seen].map(([t, v]) => [t, v.occ]));
}

const mergeAt = process.argv.indexOf('--merge');
const out = resolve(arg('out', DEFAULT_OUT));

if (mergeAt >= 0) {
  const cap = Number(arg('cap', '24'));
  const merged = emptyBank();
  const seen = new Set<string>();
  const shards = process.argv.slice(mergeAt + 1).map((x) => load(resolve(x)));
  // Round-robin over the shards so a cap keeps positions from every one of them.
  for (let i = 0; ; i++) {
    let any = false;
    for (const b of shards)
      for (const t of TECHNIQUE_ORDER) {
        const p = b[t][i];
        if (!p) continue;
        any = true;
        const k = t + key(p);
        if (merged[t].length < cap && !seen.has(k)) {
          seen.add(k);
          merged[t].push(p);
        }
      }
    if (!any) break;
  }
  save(out, merged);
  console.log(TECHNIQUE_ORDER.map((t) => `${t}: ${merged[t].length}`).join('\n'));
} else {
  const per = Number(arg('per', '12'));
  const seed = Number(arg('seed', String(Date.now() % 0xffffffff)));
  const deadline = Date.now() + Number(arg('minutes', '5')) * 60_000;
  const rng = mulberry32(seed);
  const bank = load(out);
  const seen = new Set<string>();
  for (const t of TECHNIQUE_ORDER) for (const p of bank[t]) seen.add(t + key(p));
  let puzzles = 0;
  while (Date.now() < deadline && TECHNIQUE_ORDER.some((t) => bank[t].length < per)) {
    const puzzle = dig(rng, 22 + Math.floor(rng() * 20));
    if (!puzzle) continue;
    puzzles++;
    for (const [t, o] of collect(puzzle, rng)) {
      if (bank[t].length >= per) continue;
      const p: BankPosition = { g: gridToString(o.grid), c: o.cands, s: o.step };
      if (!solve(o.grid)) continue;
      const k = t + key(p);
      if (seen.has(k)) continue;
      seen.add(k);
      bank[t].push(p);
    }
    if (puzzles % 25 === 0) {
      save(out, bank);
      console.log(`${puzzles} puzzles: ` + TECHNIQUE_ORDER.map((t) => bank[t].length).join(' '));
    }
  }
  save(out, bank);
  console.log(`done after ${puzzles} puzzles`);
  console.log(TECHNIQUE_ORDER.map((t) => `${t}: ${bank[t].length}`).join('\n'));
}

/**
 * Offline builder for the bundled Hard puzzle bank (src/engine/bank/hard.json).
 *
 *   npx tsx scripts/build-puzzle-bank.ts [--count 150] [--seed N] [--out file] [--merge a.json b.json ...]
 *
 * Runs our own generator and keeps only puzzles that grade exactly 'hard'. Existing puzzles in
 * the output file are kept (deduplicated), so repeated runs extend the bank. Several shards can
 * run in parallel with different --seed/--out values and be combined with --merge.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generate } from '../src/engine/generator';
import { grade } from '../src/engine/grader';
import { gridToString } from '../src/engine/parse';
import { mulberry32 } from '../src/engine/rng';

const DEFAULT_OUT = resolve(__dirname, '../src/engine/bank/hard.json');

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function load(file: string): string[] {
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as string[]) : [];
}

function save(file: string, puzzles: string[]): void {
  writeFileSync(file, JSON.stringify(puzzles, null, 1) + '\n');
}

const out = resolve(arg('out', DEFAULT_OUT));
const mergeAt = process.argv.indexOf('--merge');

if (mergeAt >= 0) {
  const all = new Set(load(out));
  for (const f of process.argv.slice(mergeAt + 1)) for (const p of load(resolve(f))) all.add(p);
  save(out, [...all]);
  console.log(`merged -> ${all.size} puzzles in ${out}`);
} else {
  const count = Number(arg('count', '150'));
  const rng = mulberry32(Number(arg('seed', String(Date.now() % 0xffffffff))));
  const bank = new Set(load(out));
  const target = bank.size + count;
  while (bank.size < target) {
    const { puzzle } = generate('hard', rng);
    if (grade(puzzle).difficulty !== 'hard') continue; // generate() may fall back to easier
    bank.add(gridToString(puzzle));
    save(out, [...bank]);
    console.log(`${bank.size}/${target}`);
  }
}

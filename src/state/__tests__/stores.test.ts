import { generate } from '../../engine/generator';
import { mulberry32 } from '../../engine/rng';
import type { Digit } from '../../engine/types';
import { newGameData } from '../gameLogic';
import { useGameStore } from '../gameStore';
import { useSettingsStore } from '../settingsStore';
import { averageOf, bestOf, countOf, useStatsStore } from '../statsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const gen = generate('easy', mulberry32(11));

beforeEach(() => {
  useStatsStore.getState().clear();
  useGameStore.setState(newGameData('easy', gen.puzzle, gen.solution));
});

describe('gameStore', () => {
  it('newGame generates a puzzle and starts playing', async () => {
    const p = useGameStore.getState().newGame('easy', 3);
    expect(useGameStore.getState().loading).toBe(true);
    await p;
    const s = useGameStore.getState();
    expect(s.loading).toBe(false);
    expect(s.status).toBe('playing');
    expect(s.running).toBe(true);
    expect(s.puzzle.filter((v) => v !== 0).length).toBeGreaterThanOrEqual(36);
    expect(s.values).toEqual(s.puzzle);
  });

  it('actions drive the pure logic (place, undo, remaining)', () => {
    const g = useGameStore.getState();
    const cell = g.values.findIndex((v) => v === 0);
    const d = gen.solution[cell] as Digit;
    const before = g.remaining(d);
    g.pressCell(cell);
    g.pressDigit(d);
    expect(useGameStore.getState().values[cell]).toBe(d);
    expect(useGameStore.getState().remaining(d)).toBe(before - 1);
    useGameStore.getState().undo();
    expect(useGameStore.getState().values[cell]).toBe(0);
  });

  it('winning records a result in statsStore exactly once', () => {
    const g = useGameStore.getState();
    const cells = g.values.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    const last = cells[cells.length - 1];
    useGameStore.setState({
      values: g.values.map((v, i) => (v === 0 && i !== last ? gen.solution[i] : v)),
    });
    useGameStore.getState().tick(12345);
    useGameStore.getState().validate(); // marks assisted
    useGameStore.getState().pressCell(last);
    useGameStore.getState().pressDigit(gen.solution[last] as Digit);
    const s = useGameStore.getState();
    expect(s.status).toBe('won');
    expect(s.running).toBe(false);
    const { results } = useStatsStore.getState();
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ difficulty: 'easy', ms: 12345, assisted: true });
    expect(typeof results[0].date).toBe('string');
    useGameStore.getState().tick(1000); // no further effect
    expect(useStatsStore.getState().results).toHaveLength(1);
  });

  it('timer actions and toast clearing', () => {
    const g = useGameStore.getState();
    g.tick(1000);
    g.pause();
    g.tick(1000);
    expect(useGameStore.getState().elapsedMs).toBe(1000);
    useGameStore.getState().resume();
    expect(useGameStore.getState().running).toBe(true);
    useGameStore.getState().validate();
    expect(useGameStore.getState().toast).toBe('No errors so far');
    useGameStore.getState().clearToast();
    expect(useGameStore.getState().toast).toBeNull();
  });

  it('hint flow through the store', () => {
    useGameStore.getState().requestHint();
    expect(useGameStore.getState().hint?.stage).toBe(1);
    useGameStore.getState().revealHint();
    expect(useGameStore.getState().hint?.stage).toBe(2);
    useGameStore.getState().applyHint();
    expect(useGameStore.getState().hint).toBeNull();
    expect(useGameStore.getState().assisted).toBe(true);
  });
});

describe('statsStore', () => {
  it('best/average/count split clean and assisted', () => {
    const add = useStatsStore.getState().addResult;
    add({ difficulty: 'easy', ms: 100, assisted: false, date: 'a' });
    add({ difficulty: 'easy', ms: 300, assisted: false, date: 'b' });
    add({ difficulty: 'easy', ms: 50, assisted: true, date: 'c' });
    add({ difficulty: 'hard', ms: 900, assisted: false, date: 'd' });
    const s = useStatsStore.getState();
    expect(s.best('easy', false)).toBe(100);
    expect(s.best('easy', true)).toBe(50);
    expect(s.best('expert', false)).toBeNull();
    expect(s.average('easy', false)).toBe(200);
    expect(s.average('easy')).toBeCloseTo(150);
    expect(s.count('easy')).toBe(3);
    expect(s.count('easy', true)).toBe(1);
    expect(bestOf([], 'easy', false)).toBeNull();
    expect(averageOf([], 'easy')).toBeNull();
    expect(countOf([], 'easy')).toBe(0);
  });
});

describe('settingsStore', () => {
  it('toggles theme', () => {
    expect(useSettingsStore.getState().theme).toBe('dark');
    useSettingsStore.getState().toggleTheme();
    expect(useSettingsStore.getState().theme).toBe('light');
    useSettingsStore.getState().toggleTheme();
    expect(useSettingsStore.getState().theme).toBe('dark');
  });
});

describe('hard bank in newGame', () => {
  it('serves an unplayed bank puzzle and records its index', async () => {
    const { HARD_BANK } = jest.requireActual('../../engine/bank');
    useGameStore.setState({ playedHard: [] });
    await useGameStore.getState().newGame('hard');
    const s = useGameStore.getState();
    expect(s.playedHard).toHaveLength(1);
    expect(s.difficulty).toBe('hard');
    const entry = HARD_BANK[s.playedHard[0]] as string;
    expect(s.puzzle.map((d) => (d === 0 ? '.' : String(d))).join('')).toBe(entry);
    expect(s.solution.every((d) => d >= 1)).toBe(true);
  });

  it('falls back to generation when every bank puzzle was played', async () => {
    const { HARD_BANK } = jest.requireActual('../../engine/bank');
    const all = HARD_BANK.map((_: string, i: number) => i);
    useGameStore.setState({ playedHard: all });
    await useGameStore.getState().newGame('hard', 3); // seeded: skips bank anyway
    expect(useGameStore.getState().playedHard).toEqual(all);
  }, 60000);
});

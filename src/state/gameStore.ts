import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { HARD_BANK, loadBankPuzzle, pickUnplayed } from '../engine/bank';
import { generateAsync, type Generated } from '../engine/generator';
import type { Difficulty, Digit } from '../engine/types';
import * as logic from './gameLogic';
import { initialGameData, type GameData } from './gameLogic';
import { useStatsStore } from './statsStore';

/** Next puzzle per difficulty, generated in the background. In memory only; never persisted. */
const prefetched: Partial<Record<Difficulty, Generated>> = {};
const inFlight: Partial<Record<Difficulty, Promise<void>>> = {};

/** True when a background-generated puzzle is waiting for this difficulty. */
export function hasPrefetched(difficulty: Difficulty): boolean {
  return prefetched[difficulty] !== undefined;
}

/** Drops all prefetched puzzles (tests). */
export function clearPrefetched(): void {
  for (const d of Object.keys(prefetched) as Difficulty[]) delete prefetched[d];
}

interface GameActions {
  loading: boolean;
  /** Indices of bank puzzles already served for Hard games. */
  playedHard: number[];
  newGame: (difficulty: Difficulty, seed?: number) => Promise<void>;
  /** Generates the next puzzle for `difficulty` in the background (no-op if already done/running). */
  prefetch: (difficulty: Difficulty) => Promise<void>;
  restart: () => void;
  pressDigit: (d: Digit) => void;
  pressCell: (i: number) => void;
  toggleNotesMode: () => void;
  toggleEraseMode: () => void;
  undo: () => void;
  requestHint: () => void;
  revealHint: () => void;
  applyHint: () => void;
  showMismatches: () => void;
  validate: () => void;
  autoNotes: () => void;
  clearToast: () => void;
  tick: (ms: number) => void;
  pause: () => void;
  resume: () => void;
  remaining: (d: number) => number;
}

export type GameStore = GameData & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      /** Applies a pure reducer; records the result in stats when it wins the game. */
      const apply = (fn: (s: GameData) => GameData): void => {
        const prev = get();
        const next = fn(prev);
        set(next);
        if (prev.status !== 'won' && next.status === 'won') {
          useStatsStore.getState().addResult({
            difficulty: next.difficulty,
            ms: next.elapsedMs,
            assisted: next.assisted,
            date: new Date().toISOString(),
          });
        }
      };
      return {
        ...initialGameData(),
        loading: false,
        playedHard: [],
        newGame: async (difficulty, seed) => {
          set({ loading: true });
          try {
            // Unseeded Hard games prefer an unplayed bundled puzzle; otherwise generate.
            const bankIndex =
              difficulty === 'hard' && seed === undefined
                ? pickUnplayed(get().playedHard, HARD_BANK.length, Math.random)
                : null;
            if (bankIndex !== null) {
              const { puzzle, solution } = loadBankPuzzle(HARD_BANK[bankIndex]);
              set({
                ...logic.newGameData(difficulty, puzzle, solution),
                playedHard: [...get().playedHard, bankIndex],
                loading: false,
              });
              return;
            }
            // A prefetched puzzle (or one still being generated) is used for unseeded games.
            if (seed === undefined) await inFlight[difficulty];
            const ready = seed === undefined ? prefetched[difficulty] : undefined;
            if (ready) delete prefetched[difficulty];
            const { puzzle, solution } = ready ?? (await generateAsync(difficulty, seed));
            set({ ...logic.newGameData(difficulty, puzzle, solution), loading: false });
            if (seed === undefined) void get().prefetch(difficulty);
          } catch (e) {
            set({ loading: false });
            throw e;
          }
        },
        prefetch: (difficulty) => {
          if (prefetched[difficulty]) return Promise.resolve();
          const running = inFlight[difficulty];
          if (running) return running;
          // Hard serves the bundled bank first, so nothing to prepare while it has unplayed puzzles.
          if (
            difficulty === 'hard' &&
            pickUnplayed(get().playedHard, HARD_BANK.length, Math.random) !== null
          ) {
            return Promise.resolve();
          }
          const job = generateAsync(difficulty)
            .then((g) => {
              prefetched[difficulty] = g;
            })
            .catch(() => {
              // best-effort: newGame generates on demand instead
            })
            .finally(() => {
              delete inFlight[difficulty];
            });
          inFlight[difficulty] = job;
          return job;
        },
        restart: () => apply(logic.restart),
        pressDigit: (d) => apply((s) => logic.pressDigit(s, d)),
        pressCell: (i) => apply((s) => logic.pressCell(s, i)),
        toggleNotesMode: () => apply(logic.toggleNotesMode),
        toggleEraseMode: () => apply(logic.toggleEraseMode),
        undo: () => apply(logic.undo),
        requestHint: () => apply(logic.requestHint),
        revealHint: () => apply(logic.revealHint),
        applyHint: () => apply(logic.applyHint),
        showMismatches: () => apply(logic.showMismatches),
        validate: () => apply(logic.validate),
        autoNotes: () => apply(logic.autoNotes),
        clearToast: () => set({ toast: null }),
        tick: (ms) => apply((s) => logic.tick(s, ms)),
        pause: () => apply(logic.pause),
        resume: () => apply(logic.resume),
        remaining: (d) => logic.remaining(get(), d),
      };
    },
    {
      name: 'sudoku-game',
      storage: createJSONStorage(() => AsyncStorage),
      // Transient UI state is not saved; a restored game always starts paused.
      partialize: (s): GameData & { playedHard: number[] } => ({
        playedHard: s.playedHard,
        puzzle: s.puzzle,
        solution: s.solution,
        values: s.values,
        notes: s.notes,
        difficulty: s.difficulty,
        selectedDigit: s.selectedDigit,
        selectedCell: s.selectedCell,
        mode: s.mode,
        history: s.history,
        elapsedMs: s.elapsedMs,
        running: false,
        assisted: s.assisted,
        status: s.status,
        hint: null,
        mismatches: [],
        toast: null,
      }),
    },
  ),
);

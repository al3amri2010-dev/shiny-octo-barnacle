import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateAsync } from '../engine/generator';
import type { Difficulty, Digit } from '../engine/types';
import * as logic from './gameLogic';
import { initialGameData, type GameData } from './gameLogic';
import { useStatsStore } from './statsStore';

interface GameActions {
  loading: boolean;
  newGame: (difficulty: Difficulty, seed?: number) => Promise<void>;
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
        newGame: async (difficulty, seed) => {
          set({ loading: true });
          try {
            const { puzzle, solution } = await generateAsync(difficulty, seed);
            set({ ...logic.newGameData(difficulty, puzzle, solution), loading: false });
          } catch (e) {
            set({ loading: false });
            throw e;
          }
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
      partialize: (s): GameData => ({
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

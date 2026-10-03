import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Difficulty } from '../engine/types';

export interface GameResult {
  difficulty: Difficulty;
  ms: number;
  assisted: boolean;
  /** ISO date string. */
  date: string;
}

const matching = (rs: GameResult[], d: Difficulty, assisted?: boolean): GameResult[] =>
  rs.filter((r) => r.difficulty === d && (assisted === undefined || r.assisted === assisted));

export function bestOf(rs: GameResult[], d: Difficulty, assisted: boolean): number | null {
  const m = matching(rs, d, assisted);
  return m.length ? Math.min(...m.map((r) => r.ms)) : null;
}
export function averageOf(rs: GameResult[], d: Difficulty, assisted?: boolean): number | null {
  const m = matching(rs, d, assisted);
  return m.length ? m.reduce((a, r) => a + r.ms, 0) / m.length : null;
}
export function countOf(rs: GameResult[], d: Difficulty, assisted?: boolean): number {
  return matching(rs, d, assisted).length;
}

interface StatsState {
  results: GameResult[];
  addResult: (r: GameResult) => void;
  clear: () => void;
  best: (d: Difficulty, assisted: boolean) => number | null;
  average: (d: Difficulty, assisted?: boolean) => number | null;
  count: (d: Difficulty, assisted?: boolean) => number;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      results: [],
      addResult: (r) => set((s) => ({ results: [...s.results, r] })),
      clear: () => set({ results: [] }),
      best: (d, assisted) => bestOf(get().results, d, assisted),
      average: (d, assisted) => averageOf(get().results, d, assisted),
      count: (d, assisted) => countOf(get().results, d, assisted),
    }),
    {
      name: 'sudoku-stats',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ results: s.results }),
    },
  ),
);

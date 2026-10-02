import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Correct practice answers needed to complete a lesson. */
export const PRACTICE_GOAL = 5;

interface TrainingState {
  /** Lesson ids that are complete. */
  completed: Record<string, true>;
  /** Correct practice answers per lesson id (clean or not). */
  practiced: Record<string, number>;
  /** How many of those were clean (no reveal, no mistakes). */
  clean: Record<string, number>;
  /** Records one correct practice answer; completes the lesson at PRACTICE_GOAL. */
  recordCorrect: (lessonId: string, clean: boolean) => void;
  /** Completes a lesson that has no practice (reading lessons). */
  markComplete: (lessonId: string) => void;
  isComplete: (lessonId: string) => boolean;
  progress: (lessonId: string) => number;
  reset: () => void;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      completed: {},
      practiced: {},
      clean: {},
      recordCorrect: (id, clean) =>
        set((s) => {
          const n = (s.practiced[id] ?? 0) + 1;
          return {
            practiced: { ...s.practiced, [id]: n },
            clean: clean ? { ...s.clean, [id]: (s.clean[id] ?? 0) + 1 } : s.clean,
            completed: n >= PRACTICE_GOAL ? { ...s.completed, [id]: true } : s.completed,
          };
        }),
      markComplete: (id) => set((s) => ({ completed: { ...s.completed, [id]: true } })),
      isComplete: (id) => get().completed[id] === true,
      progress: (id) => Math.min(PRACTICE_GOAL, get().practiced[id] ?? 0),
      reset: () => set({ completed: {}, practiced: {}, clean: {} }),
    }),
    {
      name: 'sudoku-training',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ completed: s.completed, practiced: s.practiced, clean: s.clean }),
    },
  ),
);

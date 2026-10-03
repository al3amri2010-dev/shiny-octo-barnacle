import { PRACTICE_GOAL, useTrainingStore } from '../trainingStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => useTrainingStore.getState().reset());

describe('trainingStore', () => {
  it('counts correct answers and completes the lesson at the goal', () => {
    const s = useTrainingStore.getState();
    for (let i = 0; i < PRACTICE_GOAL - 1; i++) s.recordCorrect('x-wing', i % 2 === 0);
    expect(useTrainingStore.getState().progress('x-wing')).toBe(PRACTICE_GOAL - 1);
    expect(useTrainingStore.getState().isComplete('x-wing')).toBe(false);
    useTrainingStore.getState().recordCorrect('x-wing', true);
    expect(useTrainingStore.getState().progress('x-wing')).toBe(PRACTICE_GOAL);
    expect(useTrainingStore.getState().isComplete('x-wing')).toBe(true);
    expect(useTrainingStore.getState().clean['x-wing']).toBe(3);
  });

  it('progress is capped and lessons are independent', () => {
    for (let i = 0; i < PRACTICE_GOAL + 3; i++)
      useTrainingStore.getState().recordCorrect('a', false);
    expect(useTrainingStore.getState().progress('a')).toBe(PRACTICE_GOAL);
    expect(useTrainingStore.getState().progress('b')).toBe(0);
    expect(useTrainingStore.getState().isComplete('b')).toBe(false);
  });

  it('marks reading lessons complete and resets', () => {
    useTrainingStore.getState().markComplete('rules');
    expect(useTrainingStore.getState().isComplete('rules')).toBe(true);
    useTrainingStore.getState().reset();
    expect(useTrainingStore.getState().isComplete('rules')).toBe(false);
  });

  it('persists to storage', async () => {
    useTrainingStore.getState().recordCorrect('naked-pair', true);
    await new Promise((r) => setTimeout(r, 0));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const raw = await (AsyncStorage.default ?? AsyncStorage).getItem('sudoku-training');
    expect(JSON.parse(raw).state.practiced['naked-pair']).toBe(1);
  });
});

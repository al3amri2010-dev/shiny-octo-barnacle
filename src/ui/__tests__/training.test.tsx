import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { useTrainingStore, PRACTICE_GOAL } from '../../state/trainingStore';
import { toPosition } from '../../training/bank';
import { RULES_BLANK, RULES_SOLUTION, lessonById } from '../../training/lessons';
import { DiagramPage, stagesFor } from '../DiagramPage';
import { HintBanner } from '../HintBanner';
import { useGameStore } from '../../state/gameStore';
import { FindPage, UnitsPage } from '../RulesPages';
import { PracticeView } from '../PracticeView';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

beforeEach(() => useTrainingStore.getState().reset());

describe('PracticeView (elimination)', () => {
  const lesson = lessonById('naked-pair')!;
  const position = toPosition('nakedPair', 0);

  const strikeAnswer = (list = position.step.eliminations) => {
    for (const e of list) {
      fireEvent.press(screen.getByTestId(`key-${e.digit}`));
      fireEvent.press(screen.getByTestId(`cell-${e.cell}`));
    }
  };

  it('wrong mark -> "Not quite"; exact answer -> correct, explanation, progress', () => {
    render(<PracticeView lesson={lesson} initialPosition={position} />);
    // strike a candidate that is not part of the answer
    const c = position.step.highlight.cells[0];
    const digit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(
      (d) =>
        position.cands[c] & (1 << (d - 1)) &&
        !position.step.eliminations.some((e) => e.cell === c && e.digit === d),
    )!;
    fireEvent.press(screen.getByTestId(`key-${digit}`));
    fireEvent.press(screen.getByTestId(`cell-${c}`));
    fireEvent.press(screen.getByTestId('practice-check'));
    expect(screen.getByTestId('practice-feedback').props.children).toMatch(/Not quite/);
    fireEvent.press(screen.getByTestId(`cell-${c}`)); // toggle it off again
    fireEvent.press(screen.getByTestId('key-' + digit)); // deselect digit
    strikeAnswer();
    fireEvent.press(screen.getByTestId('practice-check'));
    expect(screen.getByTestId('practice-feedback').props.children).toMatch(/Correct/);
    expect(useTrainingStore.getState().progress(lesson.id)).toBe(1);
    expect(useTrainingStore.getState().clean[lesson.id]).toBeUndefined(); // there was a mistake
    expect(screen.getByTestId('practice-next')).toBeTruthy();
  });

  it('partial answer says there is more to remove', () => {
    render(<PracticeView lesson={lesson} initialPosition={position} />);
    strikeAnswer(position.step.eliminations.slice(0, 1));
    fireEvent.press(screen.getByTestId('practice-check'));
    expect(screen.getByTestId('practice-feedback').props.children).toMatch(/more to remove/);
    expect(useTrainingStore.getState().progress(lesson.id)).toBe(0);
  });

  it('three hints reveal the answer without clean credit; Next loads another position', () => {
    render(<PracticeView lesson={lesson} initialPosition={position} />);
    for (let i = 0; i < 3; i++) fireEvent.press(screen.getByTestId('practice-hint'));
    expect(screen.getByTestId('practice-feedback').props.children).toBe(position.step.explanation);
    expect(useTrainingStore.getState().progress(lesson.id)).toBe(1);
    expect(useTrainingStore.getState().clean[lesson.id]).toBeUndefined();
    fireEvent.press(screen.getByTestId('practice-next'));
    expect(screen.queryByTestId('practice-next')).toBeNull();
    expect(screen.getByTestId('practice-progress').props.children).toContain('1/5');
  });

  it('a clean solve earns clean credit and five solves complete the lesson', () => {
    render(<PracticeView lesson={lesson} initialPosition={position} />);
    for (let n = 0; n < PRACTICE_GOAL; n++) {
      for (let i = 0; i < 3; i++) fireEvent.press(screen.getByTestId('practice-hint'));
      if (n < PRACTICE_GOAL - 1) fireEvent.press(screen.getByTestId('practice-next'));
    }
    expect(useTrainingStore.getState().isComplete(lesson.id)).toBe(true);
    expect(screen.getByTestId('practice-progress').props.children).toBe('Lesson complete');
  });
});

describe('PracticeView (placement)', () => {
  it('accepts the right digit in the right cell and rejects a wrong digit', () => {
    const lesson = lessonById('hidden-single')!;
    const position = toPosition('hiddenSingle', 0);
    const ans = position.step.placements[0];
    render(<PracticeView lesson={lesson} initialPosition={position} />);
    expect(screen.queryByTestId('practice-check')).toBeNull();
    fireEvent.press(screen.getByTestId(`cell-${ans.cell}`));
    fireEvent.press(screen.getByTestId(`key-${(ans.digit % 9) + 1}`));
    expect(screen.getByTestId('practice-feedback').props.children).toMatch(/Not quite/);
    fireEvent.press(screen.getByTestId(`cell-${ans.cell}`));
    fireEvent.press(screen.getByTestId(`key-${ans.digit}`));
    expect(screen.getByTestId('practice-feedback').props.children).toMatch(/Correct/);
    expect(useTrainingStore.getState().progress(lesson.id)).toBe(1);
  });
});

describe('DiagramPage', () => {
  it('steps through the stages and shows the result', () => {
    const position = toPosition('nakedPair', 0);
    render(<DiagramPage position={position} caption="Caption text" />);
    expect(screen.getByTestId('diagram-caption').props.children).toBe('Caption text');
    const stages = stagesFor(position);
    for (let i = 1; i < stages.length; i++) fireEvent.press(screen.getByTestId('step-through'));
    expect(screen.getByTestId('stage-text').props.children).toContain(position.step.explanation);
    fireEvent.press(screen.getByTestId('step-through')); // replay
    expect(screen.getByTestId('stage-text').props.children).toMatch(/Press Step/);
  });

  it('plain diagrams have no stepper', () => {
    render(<DiagramPage position={toPosition('nakedSingle', 0)} caption="c" plain />);
    expect(screen.queryByTestId('step-through')).toBeNull();
  });
});

describe('rules pages', () => {
  it('units page lights up the unit of the tapped cell', () => {
    render(<UnitsPage caption="c" />);
    fireEvent.press(screen.getByTestId('unit-col'));
    fireEvent.press(screen.getByTestId('cell-0'));
    expect(screen.getByTestId('cell-0')).toBeTruthy();
  });

  it('find page: wrong digit rejected, right digit accepted', () => {
    render(<FindPage caption="c" />);
    const answer = Number(RULES_SOLUTION[RULES_BLANK]);
    fireEvent.press(screen.getByTestId(`key-${(answer % 9) + 1}`));
    fireEvent.press(screen.getByTestId(`cell-${RULES_BLANK}`));
    expect(screen.getByTestId('find-feedback').props.children).toMatch(/Not that digit/);
    fireEvent.press(screen.getByTestId(`key-${(answer % 9) + 1}`)); // deselect
    fireEvent.press(screen.getByTestId(`key-${answer}`));
    fireEvent.press(screen.getByTestId(`cell-${RULES_BLANK}`));
    expect(screen.getByTestId('find-feedback').props.children).toMatch(/Correct/);
  });
});

describe('HintBanner lesson link', () => {
  it('technique name opens the lesson when a handler is given', () => {
    const position = toPosition('nakedPair', 0);
    useGameStore.setState({ hint: { step: position.step, stage: 1 } });
    const onOpen = jest.fn();
    const { rerender } = render(<HintBanner onOpenLesson={onOpen} />);
    fireEvent.press(screen.getByTestId('hint-lesson'));
    expect(onOpen).toHaveBeenCalledWith('nakedPair');
    rerender(<HintBanner />);
    expect(screen.queryByTestId('hint-lesson')).toBeNull();
    act(() => {
      useGameStore.setState({ hint: null });
    });
  });
});

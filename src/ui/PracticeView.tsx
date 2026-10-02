import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { Rng } from '../engine/rng';
import { cellName } from '../engine/units';
import type { Digit } from '../engine/types';
import { PRACTICE_GOAL, useTrainingStore } from '../state/trainingStore';
import type { Position } from '../training/bank';
import type { Lesson } from '../training/lessons';
import {
  isClean,
  isPlacementStep,
  newPractice,
  pickPosition,
  practiceReducer,
  struckMasks,
} from '../training/practice';
import { BoardView, stepOverlay, type OverlayLevel } from './BoardView';
import { techniqueTitle } from './format';
import { NumberPad } from './NumberPad';
import { useTheme } from './useTheme';

/** Endless practice on bank positions with progressive help. */
export function PracticeView({
  lesson,
  initialPosition,
  rng = Math.random,
}: {
  lesson: Lesson;
  /** Start from this position instead of a random one (tests, screenshots). */
  initialPosition?: Position;
  rng?: Rng;
}) {
  const palette = useTheme();
  const { width } = useWindowDimensions();
  const technique = lesson.technique;
  const seen = useRef<string[]>([]);

  const first = useMemo(() => {
    if (!technique) return null;
    return initialPosition ?? pickPosition(technique, rng, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technique]);

  const [state, dispatch] = useReducer(practiceReducer, first, (p) => newPractice(p as Position));
  const [digit, setDigit] = useState<Digit | null>(null);
  const [cell, setCell] = useState<number | null>(null);

  const progress = useTrainingStore((s) => Math.min(PRACTICE_GOAL, s.practiced[lesson.id] ?? 0));
  const complete = useTrainingStore((s) => s.completed[lesson.id] === true);
  const recorded = useRef<string | null>(null);

  const { position } = state;
  const placement = isPlacementStep(position.step);
  const solved = state.status === 'correct';

  useEffect(() => {
    seen.current = [...seen.current, position.key];
  }, [position.key]);

  // Credit each solved position once.
  useEffect(() => {
    if (state.status !== 'correct' || recorded.current === position.key) return;
    recorded.current = position.key;
    useTrainingStore.getState().recordCorrect(lesson.id, isClean(state));
  }, [state, position.key, lesson.id]);

  const act = (c: number, d: number) => {
    if (solved) return;
    dispatch({ type: placement ? 'place' : 'strike', cell: c, digit: d });
  };

  const onCellPress = (i: number) => {
    if (digit !== null) act(i, digit);
    else setCell(cell === i ? null : i);
  };
  const onDigit = (d: Digit) => {
    if (cell !== null) {
      act(cell, d);
      setCell(null);
    } else {
      setDigit(digit === d ? null : d);
    }
  };

  const next = () => {
    if (!technique) return;
    const p = pickPosition(technique, rng, seen.current);
    if (!p) return;
    dispatch({ type: 'reset', position: p });
    setCell(null);
  };

  const values = useMemo(() => {
    const v = position.grid.slice();
    if (state.placed) v[state.placed.cell] = state.placed.digit;
    return v;
  }, [position.grid, state.placed]);

  const overlay = useMemo(() => {
    const o = stepOverlay(position.step, Math.min(state.help, 2) as OverlayLevel);
    const elim = struckMasks(state.struck);
    return { ...o, elim };
  }, [position.step, state.help, state.struck]);

  const wrongMasks = useMemo(() => struckMasks(state.wrong), [state.wrong]);
  const wrongCells = useMemo(
    () => new Set(placement ? state.wrong.map((w) => w.cell) : []),
    [placement, state.wrong],
  );
  const notes = useMemo(() => {
    // The placed digit takes the cell's notes with it.
    const n = position.cands.slice();
    if (state.placed) n[state.placed.cell] = 0;
    return n;
  }, [position.cands, state.placed]);

  const size = Math.min(width - 32, 400);
  const keySize = Math.min(46, (Math.min(width, 460) - 32) / 5 - 8);
  const remaining = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(
    (d) => 9 - values.filter((v) => v === d).length,
  );

  const title = technique ? techniqueTitle(technique) : '';
  const prompt = placement
    ? `Find the ${title}. Pick a digit, then tap its cell.`
    : `Find the ${title}. Pick a digit, tap each cell to strike it, then press Check.`;

  const placedMatches =
    state.placed !== null &&
    position.step.placements.some(
      (p) => p.cell === state.placed?.cell && p.digit === state.placed?.digit,
    );
  const feedback = solved
    ? state.help >= 3
      ? `${position.step.explanation}`
      : placement && !placedMatches && state.placed
        ? `Correct. ${cellName(state.placed.cell)} = ${state.placed.digit} is a valid ${title} too.`
        : `Correct! ${position.step.explanation}`
    : state.message;
  const feedbackColor = solved
    ? palette.accent
    : state.status === 'wrong'
      ? palette.error
      : palette.text;

  return (
    <View style={styles.wrap}>
      <Text testID="practice-prompt" style={[styles.prompt, { color: palette.text }]}>
        {prompt}
      </Text>
      <BoardView
        testID="practice-board"
        size={size}
        values={values}
        given={position.grid.map((v) => v !== 0)}
        notes={notes}
        digit={digit}
        selectedCell={cell}
        wrongCells={wrongCells}
        wrongMasks={wrongMasks}
        overlay={overlay}
        onCellPress={onCellPress}
      />
      <View style={styles.feedbackBox}>
        <Text
          testID="practice-feedback"
          style={{ color: feedbackColor, fontSize: 15, lineHeight: 21 }}
        >
          {feedback}
        </Text>
      </View>
      <View style={styles.dots} testID="practice-dots">
        {Array.from({ length: PRACTICE_GOAL }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: palette.accent },
              i < progress && { backgroundColor: palette.accent },
            ]}
          />
        ))}
        <Text testID="practice-progress" style={{ color: palette.textMuted, marginLeft: 8 }}>
          {complete ? 'Lesson complete' : `${progress}/${PRACTICE_GOAL}`}
        </Text>
      </View>
      <NumberPad
        remaining={remaining}
        selectedDigit={digit}
        eraseActive={false}
        keySize={keySize}
        onDigit={onDigit}
        onErase={() => {}}
      />
      <View style={styles.buttons}>
        <Pressable
          testID="practice-hint"
          accessibilityRole="button"
          accessibilityLabel="Hint"
          disabled={solved}
          onPress={() => dispatch({ type: 'hint' })}
          style={[styles.btn, { borderColor: palette.outline }, solved && { opacity: 0.4 }]}
        >
          <Text style={{ color: palette.text, fontSize: 16 }}>
            Hint
            {state.help > 0 && state.help < 3 ? ` (${state.help}/3)` : ''}
          </Text>
        </Pressable>
        {solved ? (
          <Pressable
            testID="practice-next"
            accessibilityRole="button"
            accessibilityLabel="Next"
            onPress={next}
            style={[styles.btn, { backgroundColor: palette.accent, borderColor: palette.accent }]}
          >
            <Text style={{ color: palette.givenText, fontSize: 16, fontWeight: '700' }}>Next</Text>
          </Pressable>
        ) : (
          !placement && (
            <Pressable
              testID="practice-check"
              accessibilityRole="button"
              accessibilityLabel="Check"
              onPress={() => dispatch({ type: 'check' })}
              style={[styles.btn, { backgroundColor: palette.accent, borderColor: palette.accent }]}
            >
              <Text style={{ color: palette.givenText, fontSize: 16, fontWeight: '700' }}>
                Check
              </Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingBottom: 12 },
  prompt: { fontSize: 14, lineHeight: 19, alignSelf: 'stretch', paddingHorizontal: 16 },
  feedbackBox: {
    alignSelf: 'stretch',
    minHeight: 58,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: {
    minWidth: 120,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from './Text';

import { boxOf, colOf, rowOf } from '../engine/units';
import type { Digit, UnitKind } from '../engine/types';
import { RULES_BLANK, RULES_SOLUTION } from '../training/lessons';
import { BoardView, EMPTY_OVERLAY, type Overlay } from './BoardView';
import { NumberPad } from './NumberPad';
import { useTheme } from './useTheme';

const SOLUTION = [...RULES_SOLUTION].map(Number);
const ALL_GIVEN = SOLUTION.map(() => true);
// Every key stays usable: the page is about choosing the right digit.
const ALL_ENABLED = SOLUTION.slice(0, 9).map(() => 1);
const NO_NOTES = SOLUTION.map(() => 0);

function useBoardSize(): number {
  const { width } = useWindowDimensions();
  return Math.min(width - 32, 400);
}

const KINDS: { kind: UnitKind; label: string }[] = [
  { kind: 'row', label: 'Row' },
  { kind: 'col', label: 'Column' },
  { kind: 'box', label: 'Box' },
];

const inUnit = (kind: UnitKind, anchor: number, cell: number): boolean =>
  kind === 'row'
    ? rowOf(cell) === rowOf(anchor)
    : kind === 'col'
      ? colOf(cell) === colOf(anchor)
      : boxOf(cell) === boxOf(anchor);

/** Solved sample grid; pick Row / Column / Box, then tap a cell to light up its unit. */
export function UnitsPage({ caption }: { caption: string }) {
  const palette = useTheme();
  const size = useBoardSize();
  const [kind, setKind] = useState<UnitKind>('row');
  const [anchor, setAnchor] = useState(40);

  const overlay = useMemo<Overlay>(() => {
    const tint = new Set<number>();
    for (let c = 0; c < 81; c++) if (inUnit(kind, anchor, c)) tint.add(c);
    return { ...EMPTY_OVERLAY, tint };
  }, [kind, anchor]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.caption, { color: palette.text }]}>{caption}</Text>
      <BoardView
        testID="units-board"
        size={size}
        values={SOLUTION}
        given={ALL_GIVEN}
        notes={NO_NOTES}
        overlay={overlay}
        tintAlpha="66"
        onCellPress={setAnchor}
      />
      <View style={styles.row}>
        {KINDS.map((k) => {
          const active = k.kind === kind;
          return (
            <Pressable
              key={k.kind}
              testID={`unit-${k.kind}`}
              accessibilityRole="button"
              accessibilityLabel={k.label}
              accessibilityState={{ selected: active }}
              onPress={() => setKind(k.kind)}
              style={[
                styles.pill,
                { borderColor: palette.outline },
                active && { backgroundColor: palette.accent, borderColor: palette.accent },
              ]}
            >
              <Text style={{ color: active ? palette.givenText : palette.text, fontSize: 16 }}>
                {k.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Nearly solved grid with one empty cell: place the missing digit. */
export function FindPage({ caption }: { caption: string }) {
  const palette = useTheme();
  const size = useBoardSize();
  const [digit, setDigit] = useState<Digit | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [placed, setPlaced] = useState<number>(0);
  const [wrong, setWrong] = useState(false);
  const answer = SOLUTION[RULES_BLANK];

  const values = useMemo(() => SOLUTION.map((v, i) => (i === RULES_BLANK ? placed : v)), [placed]);
  const given = useMemo(() => SOLUTION.map((_, i) => i !== RULES_BLANK), []);
  const solved = placed === answer;

  const tryPlace = (cell: number, d: number) => {
    if (cell !== RULES_BLANK || solved) return;
    setSelected(null);
    if (d === answer) {
      setPlaced(d);
      setWrong(false);
    } else {
      setPlaced(0);
      setWrong(true);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.caption, { color: palette.text }]}>{caption}</Text>
      <BoardView
        testID="find-board"
        size={size}
        values={values}
        given={given}
        notes={NO_NOTES}
        digit={digit}
        selectedCell={selected}
        onCellPress={(i) => {
          if (digit !== null) tryPlace(i, digit);
          else if (i === RULES_BLANK) setSelected(selected === i ? null : i);
        }}
      />
      <Text
        testID="find-feedback"
        style={{
          color: wrong ? palette.error : palette.text,
          fontSize: 16,
          minHeight: 44,
          alignSelf: 'stretch',
          lineHeight: 22,
        }}
      >
        {solved
          ? `Correct! ${answer} was the only digit missing from the row, the column and the box.`
          : wrong
            ? 'Not that digit. Which one is missing from the row, the column and the box?'
            : ''}
      </Text>
      <NumberPad
        remaining={ALL_ENABLED}
        selectedDigit={digit}
        eraseActive={false}
        keySize={Math.min(54, (size - 16) / 5 - 8)}
        onDigit={(d) => {
          if (selected !== null) tryPlace(selected, d);
          else setDigit(digit === d ? null : d);
        }}
        onErase={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14, paddingHorizontal: 16 },
  caption: { fontSize: 16, lineHeight: 23, alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: 10 },
  pill: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

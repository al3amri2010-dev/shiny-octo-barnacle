import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { unitCells } from '../engine/units';
import { useGameStore } from '../state/gameStore';
import { Cell } from './Cell';
import { useTheme } from './useTheme';

const bitOf = (d: number): number => 1 << (d - 1);

export function Board({ size, onCellPress }: { size: number; onCellPress?: (i: number) => void }) {
  const palette = useTheme();
  const values = useGameStore((s) => s.values);
  const puzzle = useGameStore((s) => s.puzzle);
  const notes = useGameStore((s) => s.notes);
  const selectedDigit = useGameStore((s) => s.selectedDigit);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const mismatches = useGameStore((s) => s.mismatches);
  const hint = useGameStore((s) => s.hint);
  const pressCell = useGameStore((s) => s.pressCell);

  const cell = size / 9;

  const onPress = useCallback(
    (i: number) => {
      pressCell(i);
      onCellPress?.(i);
    },
    [pressCell, onCellPress],
  );

  const hintInfo = useMemo(() => {
    const ring = new Set<number>();
    const tint = new Set<number>();
    const cands = new Map<number, number>();
    const elim = new Map<number, number>();
    const ghost = new Map<number, number>();
    if (hint) {
      const { step, stage } = hint;
      for (const c of step.highlight.cells) ring.add(c);
      for (const u of step.highlight.units) for (const c of unitCells(u)) tint.add(c);
      for (const { cell: c, digit } of step.highlight.candidates) {
        cands.set(c, (cands.get(c) ?? 0) | bitOf(digit));
      }
      if (stage === 2) {
        for (const { cell: c, digit } of step.placements) ghost.set(c, digit);
        for (const { cell: c, digit } of step.eliminations) {
          elim.set(c, (elim.get(c) ?? 0) | bitOf(digit));
        }
      }
    }
    return { ring, tint, cands, elim, ghost };
  }, [hint]);

  const wrong = useMemo(() => new Set(mismatches), [mismatches]);

  return (
    <View testID="board" style={{ width: size, height: size, backgroundColor: palette.background }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: (i % 9) * cell,
            top: Math.floor(i / 9) * cell,
          }}
        >
          <Cell
            index={i}
            size={cell}
            palette={palette}
            value={v}
            given={puzzle[i] !== 0}
            highlighted={v !== 0 && v === selectedDigit}
            selected={selectedCell === i && v === 0}
            notes={notes[i]}
            noteDigit={selectedDigit ?? 0}
            wrong={wrong.has(i)}
            hintRing={hintInfo.ring.has(i)}
            hintTint={hintInfo.tint.has(i)}
            hintCands={hintInfo.cands.get(i) ?? 0}
            elimMask={hintInfo.elim.get(i) ?? 0}
            ghost={hintInfo.ghost.get(i) ?? 0}
            onPress={onPress}
          />
        </View>
      ))}
      {[1, 2].map((k) => (
        <View
          key={`v${k}`}
          pointerEvents="none"
          style={[
            styles.line,
            {
              left: k * 3 * cell - 1,
              top: 0,
              width: 2,
              height: size,
              backgroundColor: palette.accent,
            },
          ]}
        />
      ))}
      {[1, 2].map((k) => (
        <View
          key={`h${k}`}
          pointerEvents="none"
          style={[
            styles.line,
            {
              top: k * 3 * cell - 1,
              left: 0,
              height: 2,
              width: size,
              backgroundColor: palette.accent,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ line: { position: 'absolute' } });

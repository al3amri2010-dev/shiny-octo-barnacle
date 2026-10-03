import { StyleSheet, View } from 'react-native';

import type { Step } from '../engine/types';
import { unitCells } from '../engine/units';
import { Cell } from './Cell';
import { useTheme } from './useTheme';

const bitOf = (d: number): number => 1 << (d - 1);
const noop = (): void => {};

/** Per-cell decorations a step puts on the board. */
export interface Overlay {
  ring: Set<number>;
  tint: Set<number>;
  cands: Map<number, number>;
  elim: Map<number, number>;
  ghost: Map<number, number>;
}

export const EMPTY_OVERLAY: Overlay = {
  ring: new Set(),
  tint: new Set(),
  cands: new Map(),
  elim: new Map(),
  ghost: new Map(),
};

/**
 * How much of a step to draw: 0 nothing, 1 only the units, 2 units + pattern cells and
 * candidates, 3 everything including the placements/eliminations (the answer).
 */
export type OverlayLevel = 0 | 1 | 2 | 3;

export function stepOverlay(step: Step | null, level: OverlayLevel): Overlay {
  const o: Overlay = {
    ring: new Set(),
    tint: new Set(),
    cands: new Map(),
    elim: new Map(),
    ghost: new Map(),
  };
  if (!step || level === 0) return o;
  for (const u of step.highlight.units) for (const c of unitCells(u)) o.tint.add(c);
  if (level >= 2) {
    for (const c of step.highlight.cells) o.ring.add(c);
    for (const { cell: c, digit } of step.highlight.candidates) {
      o.cands.set(c, (o.cands.get(c) ?? 0) | bitOf(digit));
    }
  }
  if (level >= 3) {
    for (const { cell: c, digit } of step.placements) o.ghost.set(c, digit);
    for (const { cell: c, digit } of step.eliminations) {
      o.elim.set(c, (o.elim.get(c) ?? 0) | bitOf(digit));
    }
  }
  return o;
}

export interface BoardViewProps {
  size: number;
  values: number[];
  /** Cells whose digit is a given (drawn in the grey circle). */
  given: boolean[];
  /** Pencil marks per cell as 9-bit masks. */
  notes: number[];
  /** Digit to emphasise: matching values get the accent circle, matching notes go bold. */
  digit?: number | null;
  selectedCell?: number | null;
  /** Cells whose value is drawn as a mistake. */
  wrongCells?: Set<number>;
  /** Candidates drawn as flashing mistakes (cell -> mask). */
  wrongMasks?: Map<number, number>;
  overlay?: Overlay;
  /** Hex alpha of the unit tint, for boards where the tint is the point (default subtle). */
  tintAlpha?: string;
  /** Omit for a read-only board. */
  onCellPress?: (index: number) => void;
  testID?: string;
}

const EMPTY_SET = new Set<number>();

/** Presentational 9x9 board shared by the game (store-backed) and the training screens. */
export function BoardView(p: BoardViewProps) {
  const palette = useTheme();
  const cell = p.size / 9;
  const o = p.overlay ?? EMPTY_OVERLAY;
  const wrong = p.wrongCells ?? EMPTY_SET;
  const selectedDigit = p.digit ?? null;

  return (
    <View
      testID={p.testID ?? 'board'}
      style={{ width: p.size, height: p.size, backgroundColor: palette.background }}
    >
      {p.values.map((v, i) => (
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
            given={p.given[i]}
            highlighted={v !== 0 && v === selectedDigit}
            selected={p.selectedCell === i && v === 0}
            notes={p.notes[i]}
            noteDigit={selectedDigit ?? 0}
            wrong={wrong.has(i)}
            hintRing={o.ring.has(i)}
            hintTint={o.tint.has(i)}
            hintCands={o.cands.get(i) ?? 0}
            elimMask={o.elim.get(i) ?? 0}
            ghost={o.ghost.get(i) ?? 0}
            tintAlpha={p.tintAlpha}
            wrongMask={p.wrongMasks?.get(i) ?? 0}
            onPress={p.onCellPress ?? noop}
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
              height: p.size,
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
              width: p.size,
              backgroundColor: palette.accent,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ line: { position: 'absolute' } });

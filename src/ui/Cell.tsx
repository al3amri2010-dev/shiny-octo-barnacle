import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';

import type { Palette } from './theme';

export interface CellProps {
  index: number;
  size: number;
  palette: Palette;
  value: number;
  given: boolean;
  /** Cell value equals the selected digit. */
  highlighted: boolean;
  /** Cell selected in cell-first mode. */
  selected: boolean;
  /** Pencil marks as a 9-bit mask. */
  notes: number;
  /** Digit whose notes are drawn emphasised (0 = none). */
  noteDigit: number;
  wrong: boolean;
  hintRing: boolean;
  hintTint: boolean;
  /** Hint candidates (stage 1) as a mask, drawn in accent. */
  hintCands: number;
  /** Hint eliminations (stage 2) as a mask, drawn struck in red. */
  elimMask: number;
  /** Hint placement (stage 2), drawn as a ghost digit. */
  ghost: number;
  /** Candidates to flash as mistakes (training practice), as a mask. */
  wrongMask?: number;
  /** Hex alpha of the unit tint (default '22'). */
  tintAlpha?: string;
  onPress: (index: number) => void;
}

/** Screen-reader label: "Row 3, column 5, 7, given" / "Row 3, column 5, empty, notes 1 3". */
export function cellLabel(r: number, c: number, value: number, given: boolean, notes: number) {
  const pos = `Row ${r + 1}, column ${c + 1}`;
  if (value !== 0) return `${pos}, ${value}${given ? ', given' : ''}`;
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => (notes & (1 << (d - 1))) !== 0);
  return digits.length ? `${pos}, empty, notes ${digits.join(' ')}` : `${pos}, empty`;
}

function CellView(p: CellProps) {
  const { size, palette, value, index } = p;
  const r = Math.floor(index / 9);
  const c = index % 9;
  const circle = size * 0.86;
  const inset = size * 0.2;
  const showMarks = value === 0 && (p.notes | p.hintCands | p.elimMask) !== 0;
  const markSize = size / 3;

  let fill = 'transparent';
  let textColor = palette.text;
  let border = 0;
  if (value !== 0) {
    if (p.highlighted) {
      fill = palette.accent;
      textColor = palette.givenText;
    } else if (p.given) {
      fill = palette.givenCircle;
      textColor = palette.givenText;
    } else {
      fill = palette.surface;
      border = 1.5;
    }
    if (p.wrong) textColor = palette.error;
  }

  const label = cellLabel(r, c, value, p.given, p.notes);

  return (
    <Pressable
      testID={`cell-${index}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: p.selected || p.highlighted }}
      onPress={() => p.onPress(index)}
      style={[
        styles.cell,
        { width: size, height: size },
        p.hintTint && { backgroundColor: palette.accent + (p.tintAlpha ?? '22') },
        p.selected && { backgroundColor: palette.surface, borderRadius: size * 0.2 },
        p.hintRing && {
          borderWidth: 2,
          borderColor: palette.accent,
          borderRadius: size * 0.25,
        },
      ]}
    >
      {c < 8 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: size - 0.5,
            top: inset,
            height: size - 2 * inset,
            width: 1,
            backgroundColor: palette.gridThin,
          }}
        />
      )}
      {r < 8 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: size - 0.5,
            left: inset,
            width: size - 2 * inset,
            height: 1,
            backgroundColor: palette.gridThin,
          }}
        />
      )}
      {value !== 0 && (
        <View
          style={{
            width: circle,
            height: circle,
            borderRadius: circle / 2,
            backgroundColor: fill,
            borderWidth: border,
            borderColor: p.wrong ? palette.error : palette.givenCircle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: textColor, fontSize: size * 0.55, fontWeight: '400' }}>
            {value}
          </Text>
        </View>
      )}
      {value === 0 && p.ghost !== 0 && (
        <Text style={{ color: palette.accent, fontSize: size * 0.55, opacity: 0.8 }}>
          {p.ghost}
        </Text>
      )}
      {showMarks && p.ghost === 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
            const m = 1 << (d - 1);
            const elim = (p.elimMask & m) !== 0;
            const on = elim || (p.notes & m) !== 0 || (p.hintCands & m) !== 0;
            if (!on) return null;
            const flash = ((p.wrongMask ?? 0) & m) !== 0;
            const emphasised = d === p.noteDigit || (p.hintCands & m) !== 0;
            return (
              <View
                key={d}
                style={{
                  position: 'absolute',
                  left: ((d - 1) % 3) * markSize,
                  top: Math.floor((d - 1) / 3) * markSize,
                  width: markSize,
                  height: markSize,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: markSize / 2,
                  backgroundColor: flash ? palette.error + '66' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: size * 0.22,
                    color: elim ? palette.error : emphasised ? palette.accent : palette.textMuted,
                    fontWeight: emphasised && !elim ? '700' : '400',
                    textDecorationLine: elim ? 'line-through' : 'none',
                  }}
                >
                  {d}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', justifyContent: 'center' },
});

export const Cell = memo(CellView);

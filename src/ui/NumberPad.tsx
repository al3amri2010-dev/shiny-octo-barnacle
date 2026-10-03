import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';

import type { Digit } from '../engine/types';
import { useTheme } from './useTheme';

export interface NumberPadProps {
  /** remaining[d - 1] = copies of digit d still to place. */
  remaining: number[];
  selectedDigit: Digit | null;
  eraseActive: boolean;
  keySize?: number;
  onDigit: (d: Digit) => void;
  onErase: () => void;
}

const ROWS: (Digit | 'X')[][] = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 'X'],
];

export function NumberPad(p: NumberPadProps) {
  const palette = useTheme();
  const size = p.keySize ?? 56;
  return (
    <View style={styles.wrap}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={[styles.row, { gap: size * 0.14 }]}>
          {row.map((k) => {
            const isErase = k === 'X';
            const left = isErase ? 1 : p.remaining[k - 1];
            const disabled = !isErase && left <= 0;
            const active = isErase ? p.eraseActive : p.selectedDigit === k;
            return (
              <Pressable
                key={k}
                testID={`key-${k}`}
                accessibilityRole="button"
                accessibilityLabel={isErase ? 'Eraser' : `Digit ${k}, ${left} remaining`}
                accessibilityState={{ disabled, selected: active }}
                disabled={disabled}
                onPress={() => (isErase ? p.onErase() : p.onDigit(k))}
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: 1,
                  borderColor: palette.outline,
                  backgroundColor: active ? palette.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: disabled ? 0.3 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: size * 0.46,
                    fontWeight: '700',
                    lineHeight: size * 0.5,
                    color: active ? palette.givenText : palette.text,
                  }}
                >
                  {k}
                </Text>
                {!isErase && (
                  <Text
                    testID={`remaining-${k}`}
                    style={{
                      fontSize: size * 0.2,
                      lineHeight: size * 0.24,
                      color: active ? palette.givenText : palette.text,
                    }}
                  >
                    {left}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row' },
});

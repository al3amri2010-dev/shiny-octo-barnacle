import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/ui/Text';

import type { Difficulty } from '@/engine/types';
import { useGameStore } from '@/state/gameStore';
import { useSettingsStore } from '@/state/settingsStore';
import { Screen } from '@/ui/Screen';
import { capitalize, formatTime } from '@/ui/format';
import { useGameHydrated } from '@/ui/useHydrated';
import { useTheme } from '@/ui/useTheme';

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export default function HomeScreen() {
  const palette = useTheme();
  const router = useRouter();
  const hydrated = useGameHydrated();
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const status = useGameStore((s) => s.status);
  const difficulty = useGameStore((s) => s.difficulty);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const loading = useGameStore((s) => s.loading);
  const [choosing, setChoosing] = useState(false);

  const start = async (d: Difficulty) => {
    await useGameStore.getState().newGame(d);
    setChoosing(false);
    router.push('/game');
  };

  const pill = [styles.pill, { borderColor: palette.outline }];
  const label = [styles.label, { color: palette.text }];

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable
          testID="theme-toggle"
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
          onPress={toggleTheme}
          hitSlop={12}
        >
          <Ionicons name="color-palette" size={30} color={palette.text} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: palette.accent }]}>Sudoku</Text>
        {loading ? (
          <View testID="loading" style={{ alignItems: 'center', gap: 16, marginTop: 40 }}>
            <ActivityIndicator size="large" color={palette.accent} />
            <Text style={{ color: palette.textMuted, fontSize: 16 }}>Generating puzzle…</Text>
          </View>
        ) : choosing ? (
          <View style={styles.menu}>
            {LEVELS.map((d) => (
              <Pressable
                key={d}
                testID={`new-${d}`}
                accessibilityRole="button"
                accessibilityLabel={`New ${d} game`}
                style={pill}
                onPress={() => void start(d)}
              >
                <Text style={label}>{capitalize(d)}</Text>
              </Pressable>
            ))}
            <Pressable
              testID="new-cancel"
              accessibilityRole="button"
              style={[styles.pill, { borderColor: 'transparent' }]}
              onPress={() => setChoosing(false)}
            >
              <Text style={[styles.label, { color: palette.textMuted }]}>Back</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.menu}>
            {hydrated && status === 'playing' && (
              <Pressable
                testID="continue"
                accessibilityRole="button"
                style={[styles.pill, { borderColor: palette.accent }]}
                onPress={() => router.push('/game')}
              >
                <Text style={label}>
                  Continue · {capitalize(difficulty)} · {formatTime(elapsedMs)}
                </Text>
              </Pressable>
            )}
            <Pressable
              testID="new-game"
              accessibilityRole="button"
              style={pill}
              onPress={() => setChoosing(true)}
            >
              <Text style={label}>New Game</Text>
            </Pressable>
            <Pressable
              testID="training"
              accessibilityRole="button"
              style={pill}
              onPress={() => router.push('/training')}
            >
              <Text style={label}>Training</Text>
            </Pressable>
            <Pressable
              testID="stats"
              accessibilityRole="button"
              style={pill}
              onPress={() => router.push('/stats')}
            >
              <Text style={label}>Statistics</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { height: 56, paddingHorizontal: 20, alignItems: 'flex-end', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  title: { fontSize: 48, fontWeight: '300', letterSpacing: 2, marginBottom: 48 },
  menu: { width: '100%', maxWidth: 360, gap: 14 },
  pill: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 18 },
});

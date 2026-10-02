import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Difficulty } from '@/engine/types';
import { useStatsStore } from '@/state/statsStore';
import { Header } from '@/ui/GameHeader';
import { Screen } from '@/ui/Screen';
import { capitalize, formatTime } from '@/ui/format';
import { useTheme } from '@/ui/useTheme';

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
const fmt = (ms: number | null): string => (ms === null ? '—' : formatTime(ms));

export default function StatsScreen() {
  const palette = useTheme();
  const router = useRouter();
  const results = useStatsStore((s) => s.results);
  const { best, average, count } = useStatsStore.getState();

  return (
    <Screen>
      <Header title="STATISTICS" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {results.length === 0 && (
          <Text testID="stats-empty" style={[styles.empty, { color: palette.textMuted }]}>
            No games solved yet. Finish a puzzle to see your times here.
          </Text>
        )}
        {LEVELS.map((d) => (
          <View
            key={d}
            testID={`stats-${d}`}
            style={[
              styles.card,
              { borderColor: palette.outline, backgroundColor: palette.surface },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.accent }]}>{capitalize(d)}</Text>
            <Row label="Games solved" value={String(count(d))} />
            <Row label="Best time (clean)" value={fmt(best(d, false))} />
            <Row label="Best time (assisted)" value={fmt(best(d, true))} />
            <Row label="Average" value={fmt(average(d))} />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const palette = useTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: palette.textMuted, fontSize: 15 }}>{label}</Text>
      <Text style={{ color: palette.text, fontSize: 15, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, width: '100%', maxWidth: 460, alignSelf: 'center' },
  empty: { fontSize: 15, textAlign: 'center', marginVertical: 8 },
  card: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 8 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

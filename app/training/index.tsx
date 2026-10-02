import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PRACTICE_GOAL, useTrainingStore } from '@/state/trainingStore';
import { LEVELS, LESSONS } from '@/training/lessons';
import { Header } from '@/ui/GameHeader';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/useTheme';

export default function TrainingScreen() {
  const palette = useTheme();
  const router = useRouter();
  const completed = useTrainingStore((s) => s.completed);
  const practiced = useTrainingStore((s) => s.practiced);

  return (
    <Screen>
      <Header title="Training" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {LEVELS.map((level) => (
          <View key={level} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.accent }]}>{level}</Text>
            {LESSONS.map((lesson, index) => {
              if (lesson.level !== level) return null;
              const done = completed[lesson.id] === true;
              const count = Math.min(PRACTICE_GOAL, practiced[lesson.id] ?? 0);
              return (
                <Pressable
                  key={lesson.id}
                  testID={`lesson-${lesson.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${lesson.title}${done ? ', complete' : ''}`}
                  onPress={() => router.push(`/training/${lesson.id}`)}
                  style={[
                    styles.row,
                    { backgroundColor: palette.surface, borderColor: palette.outline },
                  ]}
                >
                  <View
                    style={[
                      styles.circle,
                      { borderColor: done ? palette.accent : palette.outline },
                      done && { backgroundColor: palette.accent },
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={22} color={palette.givenText} />
                    ) : (
                      <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View style={styles.texts}>
                    <Text style={{ color: palette.text, fontSize: 17, fontWeight: '700' }}>
                      {lesson.title}
                    </Text>
                    <Text style={{ color: palette.textMuted, fontSize: 14 }} numberOfLines={2}>
                      {lesson.summary}
                    </Text>
                  </View>
                  {lesson.practice && (
                    <Text
                      testID={`progress-${lesson.id}`}
                      style={{ color: palette.textMuted, fontSize: 14 }}
                    >
                      {count}/{PRACTICE_GOAL}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 18 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
});

import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/ui/Text';

import { useTrainingStore } from '@/state/trainingStore';
import { toPosition, bankSize } from '@/training/bank';
import { lessonById, type Page } from '@/training/lessons';
import { DiagramPage } from '@/ui/DiagramPage';
import { Header } from '@/ui/GameHeader';
import { PracticeView } from '@/ui/PracticeView';
import { FindPage, UnitsPage } from '@/ui/RulesPages';
import { Screen } from '@/ui/Screen';
import { useTheme } from '@/ui/useTheme';

export default function LessonScreen() {
  const palette = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessonById(String(id));
  const [index, setIndex] = useState(0);
  if (!lesson) return <Redirect href="/training" />;

  const practice = lesson.practice !== undefined && lesson.technique !== undefined;
  const total = lesson.pages.length + (practice ? 1 : 0);
  const onPractice = practice && index === lesson.pages.length;
  const last = index === total - 1;

  const renderPage = (page: Page) => {
    switch (page.kind) {
      case 'text':
        return (
          <View style={styles.text}>
            <Text style={[styles.pageTitle, { color: page.tip ? palette.accent : palette.text }]}>
              {page.title}
            </Text>
            {page.body.map((p, i) => (
              <Text key={i} style={[styles.body, { color: palette.text }]}>
                {p}
              </Text>
            ))}
          </View>
        );
      case 'diagram': {
        const t = lesson.technique;
        if (!t || bankSize(t) === 0) return null;
        const position = toPosition(t, Math.min(page.example, bankSize(t) - 1));
        return (
          <DiagramPage
            key={`${lesson.id}-${index}`}
            position={position}
            caption={page.caption}
            result={page.result}
            plain={page.plain}
          />
        );
      }
      case 'units':
        return <UnitsPage caption={page.caption} />;
      case 'find':
        return <FindPage caption={page.caption} />;
    }
  };

  const finish = () => {
    if (!practice) useTrainingStore.getState().markComplete(lesson.id);
    router.back();
  };

  return (
    <Screen>
      <Header title={lesson.title} onBack={() => router.back()} />
      <ScrollView testID="lesson-scroll" contentContainerStyle={styles.content}>
        {onPractice ? <PracticeView lesson={lesson} /> : renderPage(lesson.pages[index])}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          testID="prev"
          accessibilityRole="button"
          accessibilityLabel="Previous"
          disabled={index === 0}
          onPress={() => setIndex(index - 1)}
          style={[styles.nav, { borderColor: palette.outline }, index === 0 && { opacity: 0.3 }]}
        >
          <Text style={{ color: palette.text, fontSize: 16 }}>Back</Text>
        </Pressable>
        <View style={styles.dots}>
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              testID={`page-dot-${i}`}
              style={[
                styles.dot,
                { borderColor: palette.accent },
                i === index && { backgroundColor: palette.accent },
              ]}
            />
          ))}
        </View>
        {last && practice ? (
          <View style={{ width: 92 }} />
        ) : (
          <Pressable
            testID="next"
            accessibilityRole="button"
            accessibilityLabel={last ? 'Done' : 'Next'}
            onPress={last ? finish : () => setIndex(index + 1)}
            style={[styles.nav, { backgroundColor: palette.accent, borderColor: palette.accent }]}
          >
            <Text style={{ color: palette.givenText, fontSize: 16, fontWeight: '700' }}>
              {last ? 'Done' : 'Next'}
            </Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 16, flexGrow: 1 },
  text: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontSize: 26, fontWeight: '700', marginBottom: 2 },
  body: { fontSize: 18, lineHeight: 27 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  nav: {
    width: 92,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
});

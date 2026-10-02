import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TechniqueId } from '../engine/types';
import { useGameStore } from '../state/gameStore';
import { techniqueTitle } from './format';
import { useTheme } from './useTheme';

/** `onOpenLesson` makes the technique name tappable (opens that technique's lesson). */
export function HintBanner({ onOpenLesson }: { onOpenLesson?: (technique: TechniqueId) => void }) {
  const palette = useTheme();
  const hint = useGameStore((s) => s.hint);
  const revealHint = useGameStore((s) => s.revealHint);
  const applyHint = useGameStore((s) => s.applyHint);
  if (!hint) return null;
  const stage2 = hint.stage === 2;
  return (
    <View
      testID="hint-banner"
      style={[styles.banner, { backgroundColor: palette.surface, borderColor: palette.outline }]}
    >
      <View style={styles.top}>
        {onOpenLesson ? (
          <Pressable
            testID="hint-lesson"
            accessibilityRole="link"
            accessibilityLabel={`Open the ${techniqueTitle(hint.step.technique)} lesson`}
            hitSlop={8}
            onPress={() => onOpenLesson(hint.step.technique)}
          >
            <Text style={[styles.title, styles.link, { color: palette.accent }]}>
              {techniqueTitle(hint.step.technique)}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.title, { color: palette.accent }]}>
            {techniqueTitle(hint.step.technique)}
          </Text>
        )}
        <Pressable
          testID="hint-dismiss"
          accessibilityRole="button"
          accessibilityLabel="Dismiss hint"
          hitSlop={10}
          onPress={() => useGameStore.setState({ hint: null })}
        >
          <Text style={{ color: palette.textMuted, fontSize: 18 }}>✕</Text>
        </Pressable>
      </View>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={4}>
        {hint.step.explanation}
      </Text>
      <View style={styles.buttons}>
        <Pressable
          testID={stage2 ? 'hint-apply' : 'hint-show'}
          accessibilityRole="button"
          accessibilityLabel={stage2 ? 'Apply' : 'Show'}
          onPress={stage2 ? applyHint : revealHint}
          style={[styles.btn, { backgroundColor: palette.accent }]}
        >
          <Text style={{ color: palette.givenText, fontWeight: '700' }}>
            {stage2 ? 'Apply' : 'Show'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 20, borderWidth: 1, padding: 12, gap: 6, marginHorizontal: 16 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  link: { textDecorationLine: 'underline' },
  text: { fontSize: 14, lineHeight: 19 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 18 },
});

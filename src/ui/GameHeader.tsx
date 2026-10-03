import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';

import { useSettingsStore } from '../state/settingsStore';
import { formatTime } from './format';
import { useTheme } from './useTheme';

export interface HeaderProps {
  title?: string;
  onBack: () => void;
}

/** Back arrow, centered title (timer on the game screen) and theme toggle. */
export function Header({ title, onBack }: HeaderProps) {
  const palette = useTheme();
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  return (
    <View style={styles.header}>
      <Pressable
        testID="back"
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        hitSlop={12}
        style={styles.side}
      >
        <Ionicons name="arrow-back" size={30} color={palette.text} />
      </Pressable>
      <Text testID="header-title" style={[styles.title, { color: palette.text }]}>
        {title}
      </Text>
      <Pressable
        testID="theme-toggle"
        accessibilityRole="button"
        accessibilityLabel="Toggle theme"
        onPress={toggleTheme}
        hitSlop={12}
        style={[styles.side, { alignItems: 'flex-end' }]}
      >
        <Ionicons name="color-palette" size={30} color={palette.text} />
      </Pressable>
    </View>
  );
}

export function GameHeader({ elapsedMs, onBack }: { elapsedMs: number; onBack: () => void }) {
  return <Header title={formatTime(elapsedMs)} onBack={onBack} />;
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: { width: 48, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});

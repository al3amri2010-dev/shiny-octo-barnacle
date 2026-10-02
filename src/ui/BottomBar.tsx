import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from './useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface BottomBarProps {
  notesActive: boolean;
  onRestart: () => void;
  onHelp: () => void;
  onNotes: () => void;
  onUndo: () => void;
}

export function BottomBar(p: BottomBarProps) {
  const palette = useTheme();
  const items: { id: string; icon: IconName; label: string; onPress: () => void; on?: boolean }[] =
    [
      { id: 'restart', icon: 'refresh', label: 'Restart', onPress: p.onRestart },
      { id: 'help', icon: 'bulb', label: 'Help', onPress: p.onHelp },
      { id: 'notes', icon: 'pencil', label: 'Notes', onPress: p.onNotes, on: p.notesActive },
      { id: 'undo', icon: 'arrow-undo', label: 'Undo', onPress: p.onUndo },
    ];
  return (
    <View style={styles.bar}>
      {items.map((it) => (
        <Pressable
          key={it.id}
          testID={`bar-${it.id}`}
          accessibilityRole="button"
          accessibilityLabel={it.label}
          accessibilityState={{ selected: !!it.on }}
          onPress={it.onPress}
          style={[styles.item, it.on && { backgroundColor: palette.accent + '33' }]}
        >
          <Ionicons name={it.icon} size={30} color={it.on ? palette.accent : palette.text} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  item: {
    width: 56,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

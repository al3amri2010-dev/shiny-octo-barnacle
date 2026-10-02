import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from './useTheme';

type IonName = React.ComponentProps<typeof Ionicons>['name'];
type MaterialName = React.ComponentProps<typeof MaterialIcons>['name'];
type Family = 'ion' | 'material';

export interface BottomBarProps {
  notesActive: boolean;
  onRestart: () => void;
  onHelp: () => void;
  onNotes: () => void;
  onUndo: () => void;
}

export function BottomBar(p: BottomBarProps) {
  const palette = useTheme();
  const items: {
    id: string;
    icon: string;
    family: Family;
    label: string;
    hint: string;
    onPress: () => void;
    on?: boolean;
  }[] = [
    {
      id: 'restart',
      icon: 'refresh',
      family: 'material',
      label: 'Restart',
      hint: 'Starts this puzzle over',
      onPress: p.onRestart,
    },
    {
      id: 'help',
      icon: 'bulb',
      family: 'ion',
      label: 'Help',
      hint: 'Opens hints and checking tools',
      onPress: p.onHelp,
    },
    {
      id: 'notes',
      icon: 'pencil',
      family: 'ion',
      label: 'Notes',
      hint: 'Switches pencil marks on or off',
      onPress: p.onNotes,
      on: p.notesActive,
    },
    {
      id: 'undo',
      icon: 'undo',
      family: 'material',
      label: 'Undo',
      hint: 'Takes back your last move',
      onPress: p.onUndo,
    },
  ];
  return (
    <View style={styles.bar}>
      {items.map((it) => (
        <Pressable
          key={it.id}
          testID={`bar-${it.id}`}
          accessibilityRole="button"
          accessibilityLabel={it.label}
          accessibilityHint={it.hint}
          accessibilityState={{ selected: !!it.on }}
          onPress={it.onPress}
          style={[styles.item, it.on && { backgroundColor: palette.accent + '33' }]}
        >
          {it.family === 'material' ? (
            <MaterialIcons
              name={it.icon as MaterialName}
              size={32}
              color={it.on ? palette.accent : palette.text}
            />
          ) : (
            <Ionicons
              name={it.icon as IonName}
              size={30}
              color={it.on ? palette.accent : palette.text}
            />
          )}
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

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';

import { useGameStore } from '../state/gameStore';
import { useTheme } from './useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function HelpSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const palette = useTheme();
  const requestHint = useGameStore((s) => s.requestHint);
  const showMismatches = useGameStore((s) => s.showMismatches);
  const validate = useGameStore((s) => s.validate);
  const autoNotes = useGameStore((s) => s.autoNotes);

  const actions: { id: string; icon: IconName; label: string; hint: string; run: () => void }[] = [
    {
      id: 'hint',
      icon: 'bulb',
      label: 'Hint',
      hint: 'Explains the next technique to use',
      run: requestHint,
    },
    {
      id: 'mismatches',
      icon: 'alert-circle',
      label: 'Mismatches',
      hint: 'Marks entries that differ from the solution',
      run: showMismatches,
    },
    {
      id: 'validate',
      icon: 'checkmark',
      label: 'Validate',
      hint: 'Counts the errors on the board',
      run: validate,
    },
    {
      id: 'autonotes',
      icon: 'pencil',
      label: 'Auto Notes',
      hint: 'Fills every empty cell with its candidates',
      run: autoNotes,
    },
  ];

  const pill = [styles.pill, { borderColor: palette.outline }];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          testID="help-sheet"
          accessibilityViewIsModal
          style={[
            styles.card,
            { backgroundColor: palette.background, borderColor: palette.outline },
          ]}
        >
          <Ionicons name="bulb" size={28} color={palette.accent} />
          <Text style={[styles.note, { color: palette.textMuted }]}>
            Note: Using help transfers your time to a separate leaderboard.
          </Text>
          {actions.map((a) => (
            <Pressable
              key={a.id}
              testID={`help-${a.id}`}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityHint={a.hint}
              style={pill}
              onPress={() => {
                a.run();
                onClose();
              }}
            >
              <Ionicons name={a.icon} size={26} color={palette.text} />
              <Text style={[styles.label, { color: palette.text }]}>{a.label}</Text>
            </Pressable>
          ))}
          <View style={{ height: 24 }} />
          <Pressable
            testID="help-close"
            accessibilityRole="button"
            accessibilityLabel="Close help"
            style={pill}
            onPress={onClose}
          >
            <Text style={[styles.label, { color: palette.text }]}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  note: { fontSize: 15, textAlign: 'center', marginBottom: 6, lineHeight: 20 },
  pill: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: { fontSize: 18 },
});

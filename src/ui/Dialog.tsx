import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from './useTheme';

export interface DialogButton {
  id: string;
  label: string;
  primary?: boolean;
  onPress: () => void;
}

/** Small centered modal card with a title, body content and pill buttons. */
export function Dialog(p: {
  visible: boolean;
  title: string;
  testID?: string;
  children?: ReactNode;
  buttons: DialogButton[];
  onRequestClose?: () => void;
}) {
  const palette = useTheme();
  return (
    <Modal visible={p.visible} transparent animationType="fade" onRequestClose={p.onRequestClose}>
      <View style={styles.backdrop}>
        <View
          testID={p.testID}
          style={[
            styles.card,
            { backgroundColor: palette.background, borderColor: palette.outline },
          ]}
        >
          <Text style={[styles.title, { color: palette.text }]}>{p.title}</Text>
          {p.children}
          <View style={styles.buttons}>
            {p.buttons.map((b) => (
              <Pressable
                key={b.id}
                testID={`dialog-${b.id}`}
                accessibilityRole="button"
                accessibilityLabel={b.label}
                onPress={b.onPress}
                style={[
                  styles.btn,
                  { borderColor: palette.outline },
                  b.primary && { backgroundColor: palette.accent, borderColor: palette.accent },
                ]}
              >
                <Text style={{ color: b.primary ? palette.givenText : palette.text, fontSize: 17 }}>
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>
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
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  buttons: { width: '100%', gap: 10, marginTop: 10 },
  btn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

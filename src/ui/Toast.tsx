import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useGameStore } from '../state/gameStore';
import { useTheme } from './useTheme';

/** Shows the store's `toast` message for 2 seconds. */
export function Toast() {
  const palette = useTheme();
  const toast = useGameStore((s) => s.toast);
  const clearToast = useGameStore((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View
        testID="toast"
        style={[styles.toast, { backgroundColor: palette.surface, borderColor: palette.outline }]}
      >
        <Text style={{ color: palette.text, fontSize: 15 }}>{toast}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center' },
  toast: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
});

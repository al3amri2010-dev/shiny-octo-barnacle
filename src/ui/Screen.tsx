import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from './useTheme';

/** Themed full-screen container respecting safe-area insets. */
export function Screen({ children }: { children: ReactNode }) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, alignItems: 'stretch' } });

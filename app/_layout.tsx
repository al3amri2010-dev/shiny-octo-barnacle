import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useSettingsStore } from '@/state/settingsStore';
import { palettes } from '@/ui/theme';

export default function RootLayout() {
  const theme = useSettingsStore((s) => s.theme);
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palettes[theme].background },
        }}
      />
    </>
  );
}

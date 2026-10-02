import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { darkPalette } from '@/ui/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: darkPalette.background },
        }}
      />
    </>
  );
}

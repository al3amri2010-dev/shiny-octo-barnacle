import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useGameStore } from '@/state/gameStore';
import { useSettingsStore } from '@/state/settingsStore';
import { palettes } from '@/ui/theme';

export default function RootLayout() {
  const theme = useSettingsStore((s) => s.theme);
  const [loaded, error] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });
  // Warm up the next puzzle for the current difficulty shortly after start.
  useEffect(() => {
    const id = setTimeout(() => {
      void useGameStore.getState().prefetch(useGameStore.getState().difficulty);
    }, 800);
    return () => clearTimeout(id);
  }, []);
  // Blank themed screen until the font is ready (fall through on a load error).
  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: palettes[theme].background }} />;
  }
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

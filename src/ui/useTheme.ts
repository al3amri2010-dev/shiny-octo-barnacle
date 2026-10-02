import { useSettingsStore } from '../state/settingsStore';
import { palettes, type Palette } from './theme';

export function useTheme(): Palette {
  const theme = useSettingsStore((s) => s.theme);
  return palettes[theme];
}

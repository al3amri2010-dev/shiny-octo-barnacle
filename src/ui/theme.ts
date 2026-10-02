export interface Palette {
  background: string;
  surface: string;
  accent: string;
  givenCircle: string;
  givenText: string;
  text: string;
  textMuted: string;
  gridThin: string;
  outline: string;
  error: string;
}

export type ThemeName = 'dark' | 'light';

export const darkPalette: Palette = {
  background: '#1A1B22',
  surface: '#23242C',
  accent: '#B4C5FF',
  givenCircle: '#5A5D68',
  givenText: '#1A1B22',
  text: '#E6E6EE',
  textMuted: '#8C8E99',
  gridThin: '#3A3C46',
  outline: '#3A3C46',
  error: '#FF8A8A',
};

export const lightPalette: Palette = {
  background: '#F6F6FB',
  surface: '#FFFFFF',
  accent: '#3F5BD6',
  givenCircle: '#C9CBD6',
  givenText: '#1A1B22',
  text: '#1A1B22',
  textMuted: '#6B6D7A',
  gridThin: '#D4D6E0',
  outline: '#C4C6D2',
  error: '#D13B3B',
};

export const palettes: Record<ThemeName, Palette> = { dark: darkPalette, light: lightPalette };

import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';

/** Font family names registered in app/_layout.tsx (Outfit, one file per weight). */
export const fontFamilies = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  bold: 'Outfit_700Bold',
  light: 'Outfit_300Light',
} as const;

/** Picks the Outfit file for a CSS-style fontWeight (custom fonts have no synthetic weights). */
export function familyForWeight(weight: TextStyle['fontWeight']): string {
  switch (weight) {
    case '100':
    case '200':
    case '300':
    case 'ultralight':
    case 'thin':
    case 'light':
      return fontFamilies.light;
    case '500':
      return fontFamilies.medium;
    case '600':
    case '700':
    case '800':
    case '900':
    case 'bold':
    case 'semibold':
    case 'heavy':
    case 'black':
      return fontFamilies.bold;
    default:
      return fontFamilies.regular;
  }
}

/** App-wide Text: same API as RN Text, but maps fontWeight onto the Outfit family files. */
export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, ...others } = flat;
  return <RNText {...rest} style={[others, { fontFamily: familyForWeight(fontWeight) }]} />;
}

import { darkPalette } from '@/ui/theme';

describe('jest setup', () => {
  it('resolves the @/ alias', () => {
    expect(darkPalette.background).toBe('#1A1B22');
  });
});

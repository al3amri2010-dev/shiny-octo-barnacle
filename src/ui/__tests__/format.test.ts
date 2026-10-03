import { formatTime, techniqueTitle } from '../format';

describe('formatTime', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatTime(4000)).toBe('4S');
    expect(formatTime(59999)).toBe('59S');
    expect(formatTime(64000)).toBe('1M 04S');
    expect(formatTime(3720000)).toBe('1H 02M');
    expect(formatTime(0)).toBe('0S');
  });
  it('titles techniques', () => {
    expect(techniqueTitle('hiddenSingle')).toBe('Hidden Single');
  });
});

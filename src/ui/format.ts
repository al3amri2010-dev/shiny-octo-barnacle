const pad = (n: number): string => String(n).padStart(2, '0');

/** Compact uppercase duration: `4S`, `59S`, `1M 04S`, `1H 02M`. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}H ${pad(m)}M`;
  if (m > 0) return `${m}M ${pad(s)}S`;
  return `${s}S`;
}

const TITLES: Record<string, string> = {
  fullHouse: 'Full House',
  nakedSingle: 'Naked Single',
  hiddenSingle: 'Hidden Single',
  pointing: 'Pointing',
  claiming: 'Claiming',
  nakedPair: 'Naked Pair',
  hiddenPair: 'Hidden Pair',
  nakedTriple: 'Naked Triple',
  hiddenTriple: 'Hidden Triple',
  nakedQuad: 'Naked Quad',
  hiddenQuad: 'Hidden Quad',
  xWing: 'X-Wing',
  swordfish: 'Swordfish',
  skyscraper: 'Skyscraper',
  twoStringKite: '2-String Kite',
  xyWing: 'XY-Wing',
};
export const techniqueTitle = (id: string): string => TITLES[id] ?? id;

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

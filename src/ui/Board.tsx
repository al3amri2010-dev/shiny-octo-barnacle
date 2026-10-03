import { useCallback, useMemo } from 'react';

import { useGameStore } from '../state/gameStore';
import { BoardView, stepOverlay } from './BoardView';

export function Board({ size, onCellPress }: { size: number; onCellPress?: (i: number) => void }) {
  const values = useGameStore((s) => s.values);
  const puzzle = useGameStore((s) => s.puzzle);
  const notes = useGameStore((s) => s.notes);
  const selectedDigit = useGameStore((s) => s.selectedDigit);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const mismatches = useGameStore((s) => s.mismatches);
  const hint = useGameStore((s) => s.hint);
  const pressCell = useGameStore((s) => s.pressCell);

  const onPress = useCallback(
    (i: number) => {
      pressCell(i);
      onCellPress?.(i);
    },
    [pressCell, onCellPress],
  );

  // Hint stage 1 shows units + pattern; stage 2 also reveals the answer.
  const overlay = useMemo(
    () => stepOverlay(hint ? hint.step : null, hint ? (hint.stage === 2 ? 3 : 2) : 0),
    [hint],
  );
  const wrong = useMemo(() => new Set(mismatches), [mismatches]);
  const given = useMemo(() => puzzle.map((v) => v !== 0), [puzzle]);

  return (
    <BoardView
      size={size}
      values={values}
      given={given}
      notes={notes}
      digit={selectedDigit}
      selectedCell={selectedCell}
      wrongCells={wrong}
      overlay={overlay}
      onCellPress={onPress}
    />
  );
}

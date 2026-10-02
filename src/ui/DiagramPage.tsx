import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { Position } from '../training/bank';
import { BoardView, stepOverlay, type OverlayLevel } from './BoardView';
import { techniqueTitle } from './format';
import { useTheme } from './useTheme';

/** Read-only board for a bank position (grid values, the solver's candidates as notes). */
export function MiniBoard({
  position,
  size,
  level,
}: {
  position: Position;
  size: number;
  level: OverlayLevel;
}) {
  return (
    <BoardView
      testID="mini-board"
      size={size}
      values={position.grid}
      given={position.grid.map((v) => v !== 0)}
      notes={position.cands}
      overlay={stepOverlay(position.step, level)}
    />
  );
}

/** Stage sequence: units (skipped when the step has none) -> pattern -> result. */
export function stagesFor(position: Position): OverlayLevel[] {
  const hasUnits = position.step.highlight.units.length > 0;
  return hasUnits ? [0, 1, 2, 3] : [0, 2, 3];
}

function stageText(position: Position, level: OverlayLevel): string {
  const step = position.step;
  switch (level) {
    case 0:
      return 'Press Step to walk through this position.';
    case 1:
      return 'Start with the shaded part of the board. This is where to look.';
    case 2:
      return 'Here is the pattern. The ringed cells and the bold candidates are what matter.';
    case 3:
      return step.placements.length > 0
        ? `The digit is placed. ${step.explanation}`
        : `The red candidates can be struck. ${step.explanation}`;
  }
}

/** A worked example: board plus a Step button that reveals the step in stages. */
export function DiagramPage({
  position,
  caption,
  plain,
}: {
  position: Position;
  caption: string;
  plain?: boolean;
}) {
  const palette = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 400);
  const stages = stagesFor(position);
  const [at, setAt] = useState(0);
  const level = plain ? 0 : stages[at];
  const done = at === stages.length - 1;

  return (
    <View style={styles.wrap}>
      <Text testID="diagram-caption" style={[styles.caption, { color: palette.text }]}>
        {caption}
      </Text>
      <MiniBoard position={position} size={size} level={level} />
      {!plain && (
        <View
          style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.outline }]}
        >
          <Text style={[styles.panelTitle, { color: palette.accent }]}>
            {techniqueTitle(position.step.technique)}
          </Text>
          <Text testID="stage-text" style={{ color: palette.text, fontSize: 14, lineHeight: 20 }}>
            {stageText(position, level)}
          </Text>
          <View style={styles.buttons}>
            <Pressable
              testID="step-through"
              accessibilityRole="button"
              accessibilityLabel={done ? 'Replay' : 'Step'}
              onPress={() => setAt(done ? 0 : at + 1)}
              style={[styles.btn, { backgroundColor: palette.accent }]}
            >
              <Text style={{ color: palette.givenText, fontWeight: '700' }}>
                {done ? 'Replay' : 'Step'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14, paddingHorizontal: 16 },
  caption: { fontSize: 16, lineHeight: 23, alignSelf: 'stretch' },
  panel: { alignSelf: 'stretch', borderRadius: 20, borderWidth: 1, padding: 14, gap: 6 },
  panelTitle: { fontSize: 16, fontWeight: '700' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 22, paddingVertical: 9, borderRadius: 20 },
});

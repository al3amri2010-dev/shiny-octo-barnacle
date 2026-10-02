import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useGameStore } from '@/state/gameStore';
import { lessonForTechnique } from '@/training/lessons';
import { useStatsStore } from '@/state/statsStore';
import { BottomBar } from '@/ui/BottomBar';
import { Board } from '@/ui/Board';
import { Dialog } from '@/ui/Dialog';
import { GameHeader } from '@/ui/GameHeader';
import { HelpSheet } from '@/ui/HelpSheet';
import { HintBanner } from '@/ui/HintBanner';
import { NumberPad } from '@/ui/NumberPad';
import { Screen } from '@/ui/Screen';
import { Toast } from '@/ui/Toast';
import { capitalize, formatTime } from '@/ui/format';
import { useGameHydrated } from '@/ui/useHydrated';
import { useTheme } from '@/ui/useTheme';

function buzz(): void {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // haptics are best-effort
  }
}

export default function GameScreen() {
  const palette = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const hydrated = useGameHydrated();

  const status = useGameStore((s) => s.status);
  const running = useGameStore((s) => s.running);
  const loading = useGameStore((s) => s.loading);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const difficulty = useGameStore((s) => s.difficulty);
  const assisted = useGameStore((s) => s.assisted);
  const values = useGameStore((s) => s.values);
  const selectedDigit = useGameStore((s) => s.selectedDigit);
  const mode = useGameStore((s) => s.mode);
  const store = useGameStore.getState;

  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  // Resume a restored game once, and follow the app's foreground/background state.
  useEffect(() => {
    if (useGameStore.getState().status === 'playing') store().resume();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') store().resume();
      else store().pause();
    });
    return () => {
      sub.remove();
      store().pause();
    };
  }, [hydrated, store]);

  useEffect(() => {
    if (status !== 'playing' || !running) return;
    const id = setInterval(() => store().tick(1000), 1000);
    return () => clearInterval(id);
  }, [status, running, store]);

  const best = useStatsStore((s) => s.best(difficulty, assisted));

  const onCellPress = useCallback((i: number) => {
    const s = useGameStore.getState();
    if (s.values[i] !== 0 && s.puzzle[i] === 0) buzz();
  }, []);

  if (!hydrated)
    return (
      <Screen>
        <View />
      </Screen>
    );
  if (status === 'idle' && !loading) return <Redirect href="/" />;

  const boardSize = Math.min(width - 16, 460);
  const keySize = Math.min(58, (Math.min(width, 460) - 32) / 5 - 8);
  const remaining = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(
    (d) => 9 - values.filter((v) => v === d).length,
  );

  const startNew = async () => {
    await store().newGame(difficulty);
  };

  return (
    <Screen>
      <GameHeader elapsedMs={elapsedMs} onBack={() => router.back()} />
      {loading ? (
        <View
          testID="loading"
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}
        >
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={{ color: palette.textMuted, fontSize: 16 }}>Generating puzzle…</Text>
        </View>
      ) : (
        <>
          <View style={{ flex: 0.3 }} />
          <View style={{ alignItems: 'center' }}>
            <Board size={boardSize} onCellPress={onCellPress} />
          </View>
          <View style={{ flex: 1.3, minHeight: 112, justifyContent: 'center' }}>
            <HintBanner
              onOpenLesson={(t) => {
                const lesson = lessonForTechnique(t);
                if (lesson) router.push(`/training/${lesson.id}`);
              }}
            />
          </View>
          <NumberPad
            remaining={remaining}
            selectedDigit={selectedDigit}
            eraseActive={mode === 'erase'}
            keySize={keySize}
            onDigit={(d) => {
              store().pressDigit(d);
              buzz();
            }}
            onErase={() => store().toggleEraseMode()}
          />
          <View style={{ flex: 0.5, maxHeight: 60 }} />
          <BottomBar
            notesActive={mode === 'notes'}
            onRestart={() => setConfirmRestart(true)}
            onHelp={() => setHelpOpen(true)}
            onNotes={() => store().toggleNotesMode()}
            onUndo={() => store().undo()}
          />
        </>
      )}
      <Toast />
      <HelpSheet visible={helpOpen} onClose={() => setHelpOpen(false)} />
      <Dialog
        visible={confirmRestart}
        title="Restart this puzzle?"
        testID="restart-dialog"
        onRequestClose={() => setConfirmRestart(false)}
        buttons={[
          {
            id: 'restart',
            label: 'Restart',
            primary: true,
            onPress: () => {
              store().restart();
              setConfirmRestart(false);
            },
          },
          { id: 'cancel', label: 'Cancel', onPress: () => setConfirmRestart(false) },
        ]}
      />
      <Dialog
        visible={status === 'won'}
        title="Solved!"
        testID="win-dialog"
        buttons={[
          { id: 'new', label: 'New Game', primary: true, onPress: () => void startNew() },
          { id: 'home', label: 'Home', onPress: () => router.replace('/') },
        ]}
      >
        <Text style={{ color: palette.text, fontSize: 28, fontWeight: '700' }}>
          {formatTime(elapsedMs)}
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: 16 }}>
          {capitalize(difficulty)}
          {assisted ? ' · assisted' : ''}
        </Text>
        {best !== null && (
          <Text style={{ color: palette.textMuted, fontSize: 16 }}>Best: {formatTime(best)}</Text>
        )}
      </Dialog>
    </Screen>
  );
}

import { useSyncExternalStore } from 'react';
import { useGameStore } from '../state/gameStore';

const subscribe = (cb: () => void): (() => void) => useGameStore.persist.onFinishHydration(cb);
const snapshot = (): boolean => useGameStore.persist.hasHydrated();

/** True once the persisted game has been restored from storage. */
export function useGameHydrated(): boolean {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

import { useEffect } from 'react';

import { useGameStore } from '@/store/useGameStore';

/** Charge une sauvegarde existante ou démarre une nouvelle partie au lancement. */
export function GameInitializer() {
  const isHydrated = useGameStore((s) => s.isHydrated);
  const loadGame = useGameStore((s) => s.loadGame);
  const initNewGame = useGameStore((s) => s.initNewGame);

  useEffect(() => {
    if (isHydrated) return;

    (async () => {
      const loaded = await loadGame();
      if (!loaded) {
        await initNewGame();
      }
    })();
  }, [isHydrated, loadGame, initNewGame]);

  return null;
}

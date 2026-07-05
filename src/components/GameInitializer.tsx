import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { clearLegacySaves } from '@/store/saveMigration';
import { useGameStore } from '@/store/useGameStore';

/** Charge une sauvegarde existante au lancement — sinon redirige vers nouvelle partie. */
export function GameInitializer() {
  const router = useRouter();
  const isHydrated = useGameStore((s) => s.isHydrated);
  const hasActiveGame = useGameStore((s) => s.hasActiveGame);
  const loadGame = useGameStore((s) => s.loadGame);

  useEffect(() => {
    if (isHydrated) return;

    (async () => {
      await clearLegacySaves();
      await loadGame();
    })();
  }, [isHydrated, loadGame]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!hasActiveGame) {
      router.replace('/new-game');
    }
  }, [isHydrated, hasActiveGame, router]);

  return null;
}

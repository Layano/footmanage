import { Redirect } from 'expo-router';

import { useGameStore } from '@/store/useGameStore';

/** Point d'entrée : redirige vers nouvelle partie ou le jeu. */
export default function IndexScreen() {
  const isHydrated = useGameStore((s) => s.isHydrated);
  const hasActiveGame = useGameStore((s) => s.hasActiveGame);

  if (!isHydrated) {
    return null;
  }

  if (!hasActiveGame) {
    return <Redirect href="/new-game" />;
  }

  return <Redirect href="/(tabs)" />;
}

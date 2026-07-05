import AsyncStorage from '@react-native-async-storage/async-storage';

import { LEGACY_SAVE_KEYS, SAVE_GAME_KEY } from '@/constants/gameConfig';

/** Supprime les sauvegardes obsolètes (v1, v2, etc.). */
export async function clearLegacySaves(): Promise<void> {
  await AsyncStorage.multiRemove([...LEGACY_SAVE_KEYS]);
}

/** Efface toutes les sauvegardes y compris la courante. */
export async function clearAllSaves(): Promise<void> {
  await AsyncStorage.multiRemove([...LEGACY_SAVE_KEYS, SAVE_GAME_KEY]);
}

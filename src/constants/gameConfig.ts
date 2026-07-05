/** Probabilités et constantes du game loop. */
export const GAME_CONFIG = {
  /** Chance hebdomadaire qu'un joueur évolue (0–1). */
  PLAYER_EVOLUTION_CHANCE: 0.05,
  /** Chance hebdomadaire de générer un événement (0–1). */
  WEEKLY_EVENT_CHANCE: 0.1,
  /** Âge en dessous duquel un joueur peut progresser. */
  YOUNG_AGE_THRESHOLD: 24,
  /** Âge au-dessus duquel un joueur peut régresser. */
  OLD_AGE_THRESHOLD: 32,
  /** Nombre max de messages affichés au tableau de bord. */
  MAX_DASHBOARD_MESSAGES: 20,
  /** Commission simple sur revenus aléatoires occasionnels (placeholder). */
  RANDOM_COMMISSION_CHANCE: 0.03,
  RANDOM_COMMISSION_AMOUNT: 15_000,
} as const;

export const SAVE_GAME_KEY = '@footmanage/save-v1';

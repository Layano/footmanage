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

  /** Budget de départ — tout en bas de l'échelle. */
  STARTING_BUDGET: 2_000,
  /** Frais de déplacement pour un tournoi de quartier. */
  NEIGHBORHOOD_TOURNAMENT_COST: 50,
  /** Nombre de joueurs générés par tournoi de quartier. */
  NEIGHBORHOOD_TOURNAMENT_PLAYERS: 3,
  /** Identifiant de l'agence du joueur. */
  AGENCY_ID: 'agency-player-001',
  /** Stats actuelles min/max des amateurs (échelle 1–20). */
  AMATEUR_STAT_MIN: 2,
  AMATEUR_STAT_MAX: 6,
  /** Potentiel intéressant min/max pour la pépite du tournoi (échelle affichée 1–20). */
  AMATEUR_GEM_POTENTIAL_MIN: 8,
  AMATEUR_GEM_POTENTIAL_MAX: 15,
} as const;

export const SAVE_GAME_VERSION = 4;
export const SAVE_GAME_KEY = '@footmanage/save-v4';

/** Anciennes clés — supprimées à la migration. */
export const LEGACY_SAVE_KEYS = ['@footmanage/save-v1', '@footmanage/save-v2', '@footmanage/save-v3'] as const;

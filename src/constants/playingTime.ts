/** Rôle / statut de temps de jeu promis par un club. */
export type PlayingTimeRole =
  | 'undisputed_starter'
  | 'regular_starter'
  | 'occasional_starter'
  | 'rotation'
  | 'substitute'
  | 'squad_player';

export const PLAYING_TIME_ROLES: PlayingTimeRole[] = [
  'undisputed_starter',
  'regular_starter',
  'occasional_starter',
  'rotation',
  'substitute',
  'squad_player',
];

export const PLAYING_TIME_ROLE_LABELS: Record<PlayingTimeRole, string> = {
  undisputed_starter: 'Titulaire indiscutable',
  regular_starter: 'Titulaire régulier',
  occasional_starter: 'Titulaire occasionnel',
  rotation: 'Rotation',
  substitute: 'Remplaçant',
  squad_player: 'Suppléant',
};

/** Minutes moyennes attendues par rôle (sur 90). */
export const PLAYING_TIME_ROLE_MINUTES: Record<PlayingTimeRole, number> = {
  undisputed_starter: 88,
  regular_starter: 72,
  occasional_starter: 55,
  rotation: 42,
  substitute: 28,
  squad_player: 12,
};

export const PLAYING_TIME_ROLE_RANK: Record<PlayingTimeRole, number> = {
  undisputed_starter: 6,
  regular_starter: 5,
  occasional_starter: 4,
  rotation: 3,
  substitute: 2,
  squad_player: 1,
};

export function pickRandomPlayingTimeRole(): PlayingTimeRole {
  const roll = Math.random();
  if (roll < 0.12) return 'undisputed_starter';
  if (roll < 0.35) return 'regular_starter';
  if (roll < 0.55) return 'occasional_starter';
  if (roll < 0.75) return 'rotation';
  if (roll < 0.9) return 'substitute';
  return 'squad_player';
}

export function minutesPercentToRole(percent: number): PlayingTimeRole {
  if (percent >= 82) return 'undisputed_starter';
  if (percent >= 68) return 'regular_starter';
  if (percent >= 52) return 'occasional_starter';
  if (percent >= 38) return 'rotation';
  if (percent >= 22) return 'substitute';
  return 'squad_player';
}

export function getTransferWindowKey(week: number): 'summer' | 'winter' | null {
  if (week >= 1 && week <= 4) return 'summer';
  if (week >= 25 && week <= 33) return 'winter';
  return null;
}

export function formatOfferWindowKey(season: number, window: 'summer' | 'winter'): string {
  return `${season}-${window}`;
}

/** Niveau hiérarchique d'une ligue dans un pays. */
export type LeagueTier =
  | 'pro_1'
  | 'pro_2'
  | 'pro_3'
  | 'pro_4'
  | 'pro_5'
  | 'junior';

/** Taille du football dans un pays (détermine le nombre de ligues). */
export type CountryFootballTier = 'elite' | 'major' | 'standard';

export interface FootballCountry {
  code: string;
  name: string;
  flag: string;
  tier: CountryFootballTier;
  /** Ville par défaut pour l'agence si ce pays est choisi. */
  defaultCity: string;
}

/** Configuration de démarrage d'une nouvelle partie. */
export interface NewGameConfig {
  agencyName: string;
  countryCode: string;
  gameMode: GameMode;
}

/** Modes de jeu — challenge et sandbox à venir. */
export type GameMode = 'career' | 'challenge' | 'sandbox';

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  career: 'Carrière',
  challenge: 'Défi (bientôt)',
  sandbox: 'Bac à sable (bientôt)',
};

export const GAME_MODE_DESCRIPTIONS: Record<GameMode, string> = {
  career: 'Partez de rien et bâtissez votre empire de agents.',
  challenge: 'Objectifs imposés et conditions difficiles.',
  sandbox: 'Budget illimité et tous les pays débloqués.',
};

export interface GeneratedWorld {
  leagues: import('./league').League[];
  clubs: import('./club').Club[];
  players: import('./player').Player[];
}

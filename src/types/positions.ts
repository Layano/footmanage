import type { AttributeKey } from './attributes';

/**
 * Postes principaux du jeu.
 * La note globale est calculée via des pondérations spécifiques à chaque poste.
 */
export type PlayerPosition =
  | 'GK'  // Gardien
  | 'CB'  // Défenseur Central
  | 'FB'  // Latéral
  | 'DM'  // Milieu Défensif
  | 'AM'  // Milieu Offensif
  | 'WING'// Ailier
  | 'ST'; // Buteur

export const PLAYER_POSITION_LABELS: Record<PlayerPosition, string> = {
  GK: 'Gardien',
  CB: 'Défenseur Central',
  FB: 'Latéral',
  DM: 'Milieu Défensif',
  AM: 'Milieu Offensif',
  WING: 'Ailier',
  ST: 'Buteur',
};

/** Indique si le poste est celui d'un gardien (attributs techniques distincts). */
export function isGoalkeeperPosition(position: PlayerPosition): position is 'GK' {
  return position === 'GK';
}

/**
 * Pondération d'un attribut pour le calcul de la note globale d'un poste donné.
 * Les valeurs sont des coefficients relatifs (pas forcément normalisés à 1).
 */
export type PositionAttributeWeights = Partial<Record<AttributeKey, number>>;

export type PositionWeightMatrix = Record<PlayerPosition, PositionAttributeWeights>;

import type {
  GoalkeeperPlayerAttributes,
  OutfieldPlayerAttributes,
  PlayerAttributes,
} from './attributes';
import type { AgentRepresentationContract } from './agentContract';
import type { PlayerPosition } from './positions';

export type { PlayerAttributes, OutfieldPlayerAttributes, GoalkeeperPlayerAttributes };

export type PlayerStatus =
  | 'active'
  | 'injured'
  | 'on_loan'
  | 'free_agent'
  | 'retired';

export interface PlayerPotential {
  /** Potentiel caché maximum (1–99), révélé progressivement par les recruteurs. */
  ceiling: number;
  /** Pourcentage du potentiel découvert par l'agence (0–100). */
  revealedPercent: number;
}

export interface PlayerContract {
  clubId: string | null;
  weeklyWage: number;
  startDate: string;
  endDate: string;
  releaseClause?: number;
}

/**
 * Joueur avec attributs détaillés style Football Manager.
 *
 * - Attributs unitaires : échelle 1–20
 * - overallRating : note globale 1–99, calculée selon le poste principal
 * - potentialRating : plafond estimé 1–99 (basé sur le potentiel caché)
 */
interface PlayerBase {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  age: number;
  nationality: string;
  /** Poste principal — détermine quels attributs pèsent le plus dans overallRating. */
  position: PlayerPosition;
  preferredFoot: 'left' | 'right' | 'both';
  potential: PlayerPotential;
  marketValue: number;
  contract: PlayerContract;
  status: PlayerStatus;
  isClient: boolean;
  agentId?: string;
  morale: number;
  form: number;
  /** Note globale affichée (1–99), recalculée à chaque évolution d'attributs. */
  overallRating: number;
  /** Plafond de note globale estimé (1–99), lié au potentiel caché — jamais affiché tel quel. */
  potentialRating: number;
  /** Équipe actuelle affichée (ex: "AS Montreuil U17 · Ligue Junior"). */
  currentTeam?: string;
  /** Ville où le joueur a été repéré (tournoi de quartier). */
  scoutedFromCity?: string;
  /** Contrat de représentation avec l'agence (si client). */
  representationContract?: AgentRepresentationContract;
  /** Minutes jouées cette saison (développement). */
  seasonMinutes: number;
  /** Minutes jouées la semaine passée. */
  weeklyMinutes: number;
}

export interface OutfieldPlayer extends PlayerBase {
  position: Exclude<PlayerPosition, 'GK'>;
  attributes: OutfieldPlayerAttributes;
}

export interface GoalkeeperPlayer extends PlayerBase {
  position: 'GK';
  attributes: GoalkeeperPlayerAttributes;
}

export type Player = OutfieldPlayer | GoalkeeperPlayer;

/** Vérifie si un joueur est gardien (union discriminée). */
export function isGoalkeeper(player: Player): player is GoalkeeperPlayer {
  return player.position === 'GK';
}

/** Type guard : attributs de gardien vs joueur de champ. */
export function hasGoalkeeperAttributes(
  attributes: PlayerAttributes,
): attributes is GoalkeeperPlayerAttributes {
  return 'reflexes' in attributes.technical;
}

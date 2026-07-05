import { GAME_CONFIG } from '@/constants/gameConfig';
import type { Agency } from '@/types/agency';
import type { Player } from '@/types/player';
import { overallToDisplay } from '@/engine/players/potentialEstimate';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Réputation minimale suggérée pour représenter un joueur. */
export function getRequiredAgencyReputation(player: Player): number {
  const talent = Math.max(
    overallToDisplay(player.overallRating),
    overallToDisplay(player.potentialRating),
  );
  if (talent <= 6) return 1;
  if (talent <= 9) return 8;
  if (talent <= 12) return 20;
  if (talent <= 15) return 40;
  return 65;
}

export function adjustAgencyReputation(agency: Agency, delta: number): Agency {
  return {
    ...agency,
    reputation: clamp(agency.reputation + delta, 1, 100),
  };
}

/** Modificateur de négociation selon l'écart réputation / talent. */
export function getReputationNegotiationPenalty(player: Player, agencyReputation: number): number {
  const required = getRequiredAgencyReputation(player);
  const gap = required - agencyReputation;
  if (gap <= 0) return 0;
  return gap * GAME_CONFIG.REPUTATION_NEGOTIATION_PENALTY_PER_POINT;
}

export function reputationDeltaForSigning(player: Player): number {
  const talent = overallToDisplay(player.potentialRating);
  if (talent >= 12) return 3;
  if (talent >= 9) return 2;
  return 1;
}

export function reputationDeltaForTransferDeal(fee: number): number {
  if (fee >= 500_000) return 2;
  if (fee >= 100_000) return 1;
  return 0;
}

export function reputationDeltaForMatchAttendance(clientRating: number): number {
  if (clientRating >= 8) return 1;
  if (clientRating < 5.5) return -1;
  return 0;
}

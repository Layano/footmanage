import { GAME_CONFIG } from '@/constants/gameConfig';
import { getRequiredAgencyReputation } from '@/engine/simulation/reputationEngine';
import type {
  NegotiationEvaluation,
  NegotiationOffer,
  PlayerNegotiationDemands,
} from '@/types/agentContract';
import type { Player } from '@/types/player';
import { overallToDisplay } from '@/engine/players/potentialEstimate';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Exigences du joueur selon son niveau, potentiel et réputation de l'agence. */
export function getPlayerDemands(player: Player, agencyReputation = 5): PlayerNegotiationDemands {
  const overall = overallToDisplay(player.overallRating);
  const potential = overallToDisplay(player.potentialRating);
  const talent = Math.max(overall, potential);

  const leverage = clamp(talent / 20, 0.2, 1);
  const repGap = Math.max(0, getRequiredAgencyReputation(player) - agencyReputation);
  const repPressure = repGap * 2;

  return {
    maxSalaryCommissionPercent: Math.round(
      GAME_CONFIG.NEGOTIATION_MAX_SALARY_COMMISSION -
        leverage * (GAME_CONFIG.NEGOTIATION_MAX_SALARY_COMMISSION - GAME_CONFIG.NEGOTIATION_MIN_SALARY_COMMISSION) -
        repPressure,
    ),
    maxTransferCommissionPercent: Math.round(
      GAME_CONFIG.NEGOTIATION_MAX_TRANSFER_COMMISSION - leverage * 8 - repPressure * 0.5,
    ),
    minSigningBonus: Math.round(leverage * GAME_CONFIG.NEGOTIATION_MAX_SIGNING_BONUS * 0.3 + repGap * 25),
    maxSponsoringSharePercent: Math.round(
      GAME_CONFIG.NEGOTIATION_MAX_SPONSORING_SHARE - leverage * 6 - repPressure * 0.3,
    ),
    acceptanceThreshold: Math.round(55 + leverage * 25 + repGap * 1.5),
  };
}

/** Offre par défaut proposée par l'agence. */
export function getDefaultOffer(player: Player, agencyReputation = 5): NegotiationOffer {
  const demands = getPlayerDemands(player, agencyReputation);
  return {
    salaryCommissionPercent: Math.min(
      GAME_CONFIG.NEGOTIATION_DEFAULT_SALARY_COMMISSION,
      demands.maxSalaryCommissionPercent,
    ),
    transferCommissionPercent: Math.min(12, demands.maxTransferCommissionPercent),
    signingBonus: Math.max(0, demands.minSigningBonus),
    sponsoringSharePercent: Math.min(10, demands.maxSponsoringSharePercent),
  };
}

/** Évalue si le joueur accepte l'offre. */
export function evaluateNegotiation(
  player: Player,
  offer: NegotiationOffer,
  agencyReputation = 5,
): NegotiationEvaluation {
  const demands = getPlayerDemands(player, agencyReputation);
  const requiredRep = getRequiredAgencyReputation(player);

  let score = 100;

  if (agencyReputation < requiredRep) {
    score -= (requiredRep - agencyReputation) * GAME_CONFIG.REPUTATION_NEGOTIATION_PENALTY_PER_POINT;
  }

  if (offer.salaryCommissionPercent > demands.maxSalaryCommissionPercent) {
    score -= (offer.salaryCommissionPercent - demands.maxSalaryCommissionPercent) * 4;
  }
  if (offer.transferCommissionPercent > demands.maxTransferCommissionPercent) {
    score -= (offer.transferCommissionPercent - demands.maxTransferCommissionPercent) * 3;
  }
  if (offer.signingBonus < demands.minSigningBonus) {
    score -= (demands.minSigningBonus - offer.signingBonus) / 15;
  }
  if (offer.sponsoringSharePercent > demands.maxSponsoringSharePercent) {
    score -= (offer.sponsoringSharePercent - demands.maxSponsoringSharePercent) * 2.5;
  }

  score = clamp(Math.round(score), 0, 100);
  const accepted = score >= demands.acceptanceThreshold;

  let feedback: string;
  if (accepted) {
    feedback =
      score >= 85
        ? `${player.displayName} est ravi de votre offre et signe immédiatement !`
        : `${player.displayName} accepte vos conditions après réflexion.`;
  } else if (score >= demands.acceptanceThreshold - 15) {
    feedback = `${player.displayName} hésite. Réduisez vos commissions ou augmentez la prime de signature.`;
  } else {
    feedback = `${player.displayName} refuse : votre offre est trop agressive${agencyReputation < requiredRep ? ' pour une agence de votre stature' : ''}.`;
  }

  return { accepted, satisfactionScore: score, feedback };
}

export function buildRepresentationContract(
  offer: NegotiationOffer,
  season: number,
): import('@/types/agentContract').AgentRepresentationContract {
  return {
    ...offer,
    startDate: `${season}-01-01`,
    endDate: `${season + 3}-06-30`,
  };
}

import {
  PLAYING_TIME_ROLE_LABELS,
  PLAYING_TIME_ROLE_RANK,
  type PlayingTimeRole,
} from '@/constants/playingTime';
import type { Club } from '@/types/club';
import type { Player } from '@/types/player';
import type { ClubContractOffer, NegotiableClubOfferTerms } from '@/types/transfer';

export interface ClubNegotiationEvaluation {
  accepted: boolean;
  satisfactionScore: number;
  feedback: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Le club évalue une contre-proposition de l'agent. */
export function evaluateClubNegotiation(
  offer: ClubContractOffer,
  counter: NegotiableClubOfferTerms,
  club: Club,
  player: Player,
): ClubNegotiationEvaluation {
  const orig = offer.originalTerms;
  let score = 100;

  const wageIncrease = (counter.weeklyWage - orig.weeklyWage) / Math.max(orig.weeklyWage, 1);
  if (wageIncrease > 0) score -= wageIncrease * 120;
  if (wageIncrease > 0.2) score -= 25;

  if (offer.type === 'transfer') {
    const feeDrop = (orig.fee - counter.fee) / Math.max(orig.fee, 1);
    if (feeDrop > 0) score -= feeDrop * 80;
  } else {
    const feeIncrease = (counter.fee - orig.fee) / Math.max(orig.fee, 1);
    if (feeIncrease > 0) score -= feeIncrease * 60;
  }

  const roleDelta =
    PLAYING_TIME_ROLE_RANK[counter.playingTimeRole] - PLAYING_TIME_ROLE_RANK[orig.playingTimeRole];
  if (roleDelta > 0) score -= roleDelta * 18;
  if (roleDelta < 0) score += Math.abs(roleDelta) * 4;

  if (counter.performanceBonus > orig.performanceBonus * 1.25) {
    score -= 12;
  }

  if (counter.contractYears > orig.contractYears) {
    score -= (counter.contractYears - orig.contractYears) * 8;
  }

  const playerLevel = player.overallRating / 99;
  const clubLevel = club.reputation / 100;
  if (playerLevel > clubLevel + 0.15) score -= 15;

  score = clamp(Math.round(score), 0, 100);
  const threshold = offer.type === 'loan' ? 48 : 52;
  const accepted = score >= threshold;

  let feedback: string;
  if (accepted) {
    feedback =
      score >= 75
        ? `${club.name} accepte votre proposition sans réserve.`
        : `${club.name} accepte après ajustements internes.`;
  } else if (score >= threshold - 12) {
    feedback = `${club.name} trouve votre demande un peu élevée. Réduisez le salaire ou le rôle promis.`;
  } else {
    feedback = `${club.name} refuse : votre contre-proposition est trop éloignée de l'offre initiale.`;
  }

  if (roleDelta > 1) {
    feedback = `${club.name} ne peut pas garantir « ${PLAYING_TIME_ROLE_LABELS[counter.playingTimeRole]} » pour ce joueur.`;
  }

  return { accepted, satisfactionScore: score, feedback };
}

export function getDefaultCounterTerms(offer: ClubContractOffer): NegotiableClubOfferTerms {
  return {
    weeklyWage: offer.weeklyWage,
    fee: offer.fee,
    playingTimeRole: offer.playingTimeRole,
    performanceBonus: offer.performanceBonus,
    contractYears: offer.contractYears,
  };
}

export function getClubOfferLimits(offer: ClubContractOffer): {
  minWage: number;
  maxWage: number;
  minFee: number;
  maxFee: number;
} {
  const o = offer.originalTerms;
  return {
    minWage: Math.round(o.weeklyWage * 0.85),
    maxWage: Math.round(o.weeklyWage * 1.35),
    minFee: Math.round(o.fee * 0.7),
    maxFee: Math.round(o.fee * 1.2),
  };
}

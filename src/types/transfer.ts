import type { PlayingTimeRole } from '@/constants/playingTime';

export type OfferType = 'transfer' | 'loan';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type PerformanceBonusType = 'goal' | 'clean_sheet' | 'appearance';

/** Termes négociables d'une offre club. */
export interface NegotiableClubOfferTerms {
  monthlyWage: number;
  fee: number;
  playingTimeRole: PlayingTimeRole;
  performanceBonus: number;
  contractYears: number;
  /** @deprecated Migré vers monthlyWage. */
  weeklyWage?: number;
}

/** Offre de transfert ou de prêt d'un club pour un client de l'agence. */
export interface ClubContractOffer extends NegotiableClubOfferTerms {
  id: string;
  type: OfferType;
  playerId: string;
  clubId: string;
  bonusType: PerformanceBonusType;
  week: number;
  season: number;
  expiresWeek: number;
  status: OfferStatus;
  /** Valeurs initiales du club (plafond de négociation). */
  originalTerms: NegotiableClubOfferTerms;
}

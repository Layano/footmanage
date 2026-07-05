export type OfferType = 'transfer' | 'loan';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type PerformanceBonusType = 'goal' | 'clean_sheet' | 'appearance';

/** Offre de transfert ou de prêt d'un club pour un client de l'agence. */
export interface ClubContractOffer {
  id: string;
  type: OfferType;
  playerId: string;
  clubId: string;
  weeklyWage: number;
  /** Indemnité de transfert (transfert) ou indemnité de prêt (prêt). */
  fee: number;
  /** Temps de jeu attendu (% des minutes possibles). */
  expectedMinutesPercent: number;
  performanceBonus: number;
  bonusType: PerformanceBonusType;
  contractYears: number;
  week: number;
  season: number;
  expiresWeek: number;
  status: OfferStatus;
}

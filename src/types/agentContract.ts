/** Termes de représentation négociés entre l'agence et le joueur. */
export interface AgentRepresentationContract {
  /** Commission sur le salaire hebdomadaire du joueur (%). */
  salaryCommissionPercent: number;
  /** Commission sur les indemnités de transfert (%). */
  transferCommissionPercent: number;
  /** Prime de signature versée par le joueur à l'agence (€). */
  signingBonus: number;
  /** Part des contrats sponsoring (%). */
  sponsoringSharePercent: number;
  startDate: string;
  endDate: string;
}

/** Offre soumise lors de la négociation. */
export type NegotiationOffer = Omit<AgentRepresentationContract, 'startDate' | 'endDate'>;

/** Exigences du joueur lors de la négociation. */
export interface PlayerNegotiationDemands {
  maxSalaryCommissionPercent: number;
  maxTransferCommissionPercent: number;
  minSigningBonus: number;
  maxSponsoringSharePercent: number;
  /** Score de satisfaction minimum pour accepter (0–100). */
  acceptanceThreshold: number;
}

export interface NegotiationEvaluation {
  accepted: boolean;
  satisfactionScore: number;
  feedback: string;
}

export interface SignPlayerResult {
  success: boolean;
  reason?: string;
}

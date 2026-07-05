/** Tournoi de quartier disponible pour une semaine donnée. */
export interface NeighborhoodTournament {
  city: string;
  countryCode: string;
  week: number;
  season: number;
  /** Coût du trajet depuis la ville de l'agence. */
  travelCost: number;
}

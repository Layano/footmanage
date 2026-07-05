import {
  getCityDistanceIndex,
  pickTournamentCity,
} from '@/data/world/countryCities';
import { GAME_CONFIG } from '@/constants/gameConfig';
import type { NeighborhoodTournament } from '@/types/tournament';

/** Calcule le coût du trajet entre la ville de l'agence et le tournoi (déterministe). */
export function computeTravelCost(
  agencyCity: string,
  tournamentCity: string,
  countryCode: string,
): number {
  const distance = getCityDistanceIndex(agencyCity, tournamentCity, countryCode);
  if (distance === 0) {
    return GAME_CONFIG.LOCAL_TOURNAMENT_COST;
  }
  return GAME_CONFIG.TRAVEL_COST_BASE + distance * GAME_CONFIG.TRAVEL_COST_PER_CITY;
}

export function buildTournamentForWeek(
  week: number,
  season: number,
  countryCode: string,
  agencyCity: string,
  options?: { forceCity?: string },
): NeighborhoodTournament {
  const city = pickTournamentCity(week, season, countryCode, options?.forceCity);
  const travelCost = Math.round(computeTravelCost(agencyCity, city, countryCode));

  return {
    city,
    countryCode,
    week,
    season,
    travelCost,
  };
}

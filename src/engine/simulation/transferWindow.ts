import { GAME_CONFIG } from '@/constants/gameConfig';
import type { League } from '@/types/league';

/** Vérifie si une semaine est dans une fenêtre de transfert (été ou hiver). */
export function isInTransferWindow(week: number, league: League): boolean {
  const { summer, winter } = league.transferWindows;
  return (
    (week >= summer.startWeek && week <= summer.endWeek) ||
    (week >= winter.startWeek && week <= winter.endWeek)
  );
}

/** Une semaine est en mercato si au moins une ligue du pays l'est. */
export function isCountryInTransferWindow(
  week: number,
  leagues: League[],
  countryCode: string,
): boolean {
  const countryLeagues = leagues.filter((l) => l.countryCode === countryCode);
  return countryLeagues.some((l) => isInTransferWindow(week, l));
}

export function getTransferWindowLabel(
  week: number,
  leagues: League[],
  countryCode: string,
): string | null {
  if (!isCountryInTransferWindow(week, leagues, countryCode)) return null;
  const league = leagues.find((l) => l.countryCode === countryCode && isInTransferWindow(week, l));
  if (!league) return 'Mercato';
  const { summer, winter } = league.transferWindows;
  if (week >= summer.startWeek && week <= summer.endWeek) return 'Mercato estival (S1–4)';
  return 'Mercato hivernal (S25–33)';
}

/** Semaines où de nouvelles offres peuvent être générées (début de chaque mercato). */
export function isOfferGenerationWeek(week: number): boolean {
  return week === GAME_CONFIG.TRANSFER_SUMMER_START || week === GAME_CONFIG.TRANSFER_WINTER_START;
}

/** Semaine de championnat avec matchs (hors périodes de mercato). */
export function isLeagueMatchWeek(week: number): boolean {
  if (week >= GAME_CONFIG.TRANSFER_SUMMER_START && week <= GAME_CONFIG.TRANSFER_SUMMER_END) {
    return false;
  }
  if (week >= GAME_CONFIG.TRANSFER_WINTER_START && week <= GAME_CONFIG.TRANSFER_WINTER_END) {
    return false;
  }
  return week >= 1 && week <= GAME_CONFIG.WEEKS_PER_SEASON;
}

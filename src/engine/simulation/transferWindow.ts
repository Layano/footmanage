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
export function isCountryInTransferWindow(week: number, leagues: League[], countryCode: string): boolean {
  const countryLeagues = leagues.filter((l) => l.countryCode === countryCode);
  return countryLeagues.some((l) => isInTransferWindow(week, l));
}

export function getTransferWindowLabel(week: number, leagues: League[], countryCode: string): string | null {
  if (!isCountryInTransferWindow(week, leagues, countryCode)) return null;
  const league = leagues.find((l) => l.countryCode === countryCode && isInTransferWindow(week, l));
  if (!league) return 'Mercato';
  const { summer, winter } = league.transferWindows;
  if (week >= summer.startWeek && week <= summer.endWeek) return 'Mercato estival';
  return 'Mercato hivernal';
}

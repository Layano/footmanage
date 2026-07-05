import { GAME_CONFIG } from '@/constants/gameConfig';
import type { League } from '@/types/league';

const STANDARD_TRANSFER_WINDOWS = {
  summer: {
    startWeek: GAME_CONFIG.TRANSFER_SUMMER_START,
    endWeek: GAME_CONFIG.TRANSFER_SUMMER_END,
  },
  winter: {
    startWeek: GAME_CONFIG.TRANSFER_WINTER_START,
    endWeek: GAME_CONFIG.TRANSFER_WINTER_END,
  },
} as const;

/** Aligne les fenêtres mercato persistées sur la config actuelle du jeu. */
export function normalizeLeagueTransferWindows(league: League): League {
  return {
    ...league,
    transferWindows: { ...STANDARD_TRANSFER_WINDOWS },
  };
}

/** Vérifie si une semaine est dans une fenêtre de transfert (été ou hiver). */
export function isWeekInTransferWindow(week: number): boolean {
  const { summer, winter } = STANDARD_TRANSFER_WINDOWS;
  return (
    (week >= summer.startWeek && week <= summer.endWeek) ||
    (week >= winter.startWeek && week <= winter.endWeek)
  );
}

/** Vérifie si une semaine est dans une fenêtre de transfert (été ou hiver). */
export function isInTransferWindow(week: number, _league?: League): boolean {
  return isWeekInTransferWindow(week);
}

/** Une semaine est en mercato si au moins une ligue du pays l'est. */
export function isCountryInTransferWindow(
  week: number,
  leagues: League[],
  countryCode: string,
): boolean {
  if (!isWeekInTransferWindow(week)) return false;
  const countryLeagues = leagues.filter((l) => l.countryCode === countryCode);
  return countryLeagues.length > 0;
}

export function getTransferWindowLabel(
  week: number,
  leagues: League[],
  countryCode: string,
): string | null {
  if (!isCountryInTransferWindow(week, leagues, countryCode)) return null;
  const { summer, winter } = STANDARD_TRANSFER_WINDOWS;
  if (week >= summer.startWeek && week <= summer.endWeek) return 'Mercato estival (S1–4)';
  return 'Mercato hivernal (S25–33)';
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

import { getCountryByCode } from '@/data/world/countries';
import { generateSquadForClub } from '@/engine/world/squadGenerator';
import type { Club } from '@/types/club';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';
import type { LeagueTier } from '@/types/world';

const COMPETITION_TIERS: LeagueTier[] = ['pro_1', 'pro_2', 'pro_3', 'pro_4'];
const MIN_SQUAD_SIZE = 18;

/** Génère les effectifs manquants pour les clubs des championnats du pays de l'agence. */
export function ensureLeagueSquads(
  clubs: Club[],
  leagues: League[],
  players: Player[],
  agencyCountryCode: string,
): Player[] {
  const country = getCountryByCode(agencyCountryCode);
  if (!country) return players;

  const countryLeagues = leagues.filter(
    (l) => l.countryCode === agencyCountryCode && COMPETITION_TIERS.includes(l.tier),
  );

  const countByClub = new Map<string, number>();
  for (const player of players) {
    const clubId = player.contract.clubId;
    if (!clubId) continue;
    countByClub.set(clubId, (countByClub.get(clubId) ?? 0) + 1);
  }

  const additions: Player[] = [];

  for (const league of countryLeagues) {
    const leagueClubs = clubs.filter((c) => c.leagueId === league.id);
    for (const club of leagueClubs) {
      const current = countByClub.get(club.id) ?? 0;
      if (current >= MIN_SQUAD_SIZE) continue;

      const needed = MIN_SQUAD_SIZE - current;
      const squad = generateSquadForClub(club, league, country.name, needed);
      additions.push(...squad);
      countByClub.set(club.id, current + squad.length);
    }
  }

  return additions.length > 0 ? [...players, ...additions] : players;
}

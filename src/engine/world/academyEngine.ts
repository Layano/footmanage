import { getCountryByCode } from '@/data/world/countries';
import { generateAcademyPlayers } from '@/engine/world/squadGenerator';
import type { Club } from '@/types/club';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';

const MAX_SQUAD_SIZE = 24;
const RETIRE_AGE = 36;

/** Promotions académie en début de saison pour les pays débloqués. */
export function runAcademyIntake(
  clubs: Club[],
  leagues: League[],
  players: Player[],
  unlockedCountryCodes: string[],
  season: number,
): { players: Player[]; messages: string[] } {
  const messages: string[] = [];
  const unlocked = new Set(unlockedCountryCodes);
  let nextPlayers = [...players];

  const countByClub = new Map<string, number>();
  for (const p of nextPlayers) {
    const cid = p.contract.clubId;
    if (cid) countByClub.set(cid, (countByClub.get(cid) ?? 0) + 1);
  }

  const proLeagues = leagues.filter(
    (l) => unlocked.has(l.countryCode) && l.tier !== 'junior',
  );

  for (const league of proLeagues) {
    const country = getCountryByCode(league.countryCode);
    if (!country) continue;

    const leagueClubs = clubs.filter((c) => c.leagueId === league.id);
    for (const club of leagueClubs) {
      const current = countByClub.get(club.id) ?? 0;

      if (current > MAX_SQUAD_SIZE) {
        const clubPlayers = nextPlayers
          .filter((p) => p.contract.clubId === club.id && !p.isClient)
          .sort((a, b) => a.overallRating - b.overallRating);
        const toRemove = current - MAX_SQUAD_SIZE;
        const removeIds = new Set(
          clubPlayers
            .filter((p) => p.age >= RETIRE_AGE)
            .slice(0, toRemove)
            .map((p) => p.id),
        );
        if (removeIds.size > 0) {
          nextPlayers = nextPlayers.filter((p) => !removeIds.has(p.id));
          countByClub.set(club.id, current - removeIds.size);
        }
      }

      const intakeCount = club.reputation >= 75 ? 3 : club.reputation >= 55 ? 2 : 1;
      const youths = generateAcademyPlayers(club, league, country.name, intakeCount);
      for (const youth of youths) {
        youth.contract.startDate = `${season}-07-01`;
      }
      nextPlayers.push(...youths);
      countByClub.set(club.id, (countByClub.get(club.id) ?? 0) + youths.length);
    }
  }

  if (proLeagues.length > 0) {
    messages.push('Les académies ont promu de nouveaux jeunes dans les clubs débloqués.');
  }

  return { players: nextPlayers, messages };
}

import {
  COUNTRY_CONFEDERATION,
  getConfederation,
  getContinentalChampionsName,
  getDomesticCupName,
} from '@/data/world/competitions';
import { getCountryByCode } from '@/data/world/countries';
import type { Club } from '@/types/club';
import type {
  Competition,
  CompetitionResult,
  CupFixture,
  LeagueStanding,
  Trophy,
} from '@/types/competition';
import type { League } from '@/types/league';
import type { LeagueTier } from '@/types/world';
import { isLeagueMatchWeek } from './transferWindow';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Tirage de Poisson (Knuth) — produit surtout des 0–3 buts. */
function samplePoisson(lambda: number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > limit);
  return k - 1;
}

/**
 * Score selon l'écart de niveau : un D1 contre un D4/D5
 * peut marquer 4, 5, 6 buts ou plus.
 */
function simulateQuickScore(homeRep: number, awayRep: number): { home: number; away: number } {
  const gap = homeRep - awayRep;
  const homeLambda = clamp(1.35 + Math.max(0, gap) * 0.05 - Math.max(0, -gap) * 0.02, 0.2, 5.5);
  const awayLambda = clamp(1.1 + Math.max(0, -gap) * 0.05 - Math.max(0, gap) * 0.02, 0.15, 5.2);
  return {
    home: Math.min(samplePoisson(homeLambda), 9),
    away: Math.min(samplePoisson(awayLambda), 9),
  };
}

function standingRow(competitionId: string, clubId: string): LeagueStanding {
  return {
    competitionId,
    clubId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

function applyResult(standing: LeagueStanding, gf: number, ga: number): LeagueStanding {
  const won = gf > ga ? 1 : 0;
  const drawn = gf === ga ? 1 : 0;
  const lost = gf < ga ? 1 : 0;
  const points = won * 3 + drawn;
  return {
    ...standing,
    played: standing.played + 1,
    won: standing.won + won,
    drawn: standing.drawn + drawn,
    lost: standing.lost + lost,
    goalsFor: standing.goalsFor + gf,
    goalsAgainst: standing.goalsAgainst + ga,
    points: standing.points + points,
  };
}

const LEAGUE_TIERS: LeagueTier[] = ['pro_1', 'pro_2', 'pro_3', 'pro_4', 'junior'];

/** Compétitions (ligues + coupe) d'un seul pays, sans continental. */
export function buildCountryCompetitions(
  season: number,
  countryCode: string,
  leagues: League[],
  clubs: Club[],
): {
  competitions: Competition[];
  standings: LeagueStanding[];
  cupFixtures: CupFixture[];
} {
  const competitions: Competition[] = [];
  const standings: LeagueStanding[] = [];
  const cupFixtures: CupFixture[] = [];

  const country = getCountryByCode(countryCode);
  if (!country) {
    return { competitions, standings, cupFixtures };
  }

  for (const tier of LEAGUE_TIERS) {
    const league = leagues.find((l) => l.countryCode === countryCode && l.tier === tier);
    if (!league) continue;

    const leagueClubs = clubs.filter((c) => c.leagueId === league.id);
    if (leagueClubs.length < 2) continue;

    const compId = `league-${league.id}-${season}`;
    competitions.push({
      id: compId,
      name: league.name,
      shortName: league.shortName,
      type: 'league',
      countryCode,
      leagueId: league.id,
      leagueTier: tier,
      season,
    });

    for (const club of leagueClubs) {
      standings.push(standingRow(compId, club.id));
    }
  }

  const cupId = `cup-${countryCode}-${season}`;
  const cupClubs = clubs
    .filter((c) => c.countryCode === countryCode && !c.leagueId.endsWith('junior'))
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 8);

  if (cupClubs.length >= 4) {
    competitions.push({
      id: cupId,
      name: getDomesticCupName(countryCode, country.name),
      shortName: 'Coupe',
      type: 'domestic_cup',
      countryCode,
      season,
    });

    for (let i = 0; i < cupClubs.length; i += 2) {
      const home = cupClubs[i]!;
      const away = cupClubs[i + 1];
      if (!away) break;
      cupFixtures.push({
        id: `cupf-${cupId}-r1-${i}`,
        competitionId: cupId,
        season,
        round: 1,
        roundLabel: 'Huitièmes',
        homeClubId: home.id,
        awayClubId: away.id,
        status: 'pending',
        week: 12,
      });
    }
  }

  return { competitions, standings, cupFixtures };
}

/** Crée les compétitions pour tous les pays débloqués + continental. */
export function initializeCompetitions(
  season: number,
  leagues: League[],
  clubs: Club[],
  agencyCountryCode: string,
  unlockedCountryCodes?: string[],
): {
  competitions: Competition[];
  standings: LeagueStanding[];
  cupFixtures: CupFixture[];
} {
  const competitions: Competition[] = [];
  const standings: LeagueStanding[] = [];
  const cupFixtures: CupFixture[] = [];

  const countryCodes = unlockedCountryCodes?.length
    ? unlockedCountryCodes
    : [agencyCountryCode];

  for (const countryCode of countryCodes) {
    const chunk = buildCountryCompetitions(season, countryCode, leagues, clubs);
    competitions.push(...chunk.competitions);
    standings.push(...chunk.standings);
    cupFixtures.push(...chunk.cupFixtures);
  }

  const confederation = getConfederation(agencyCountryCode);
  const continentalId = `continental-${confederation}-${season}`;
  const confederationCountries = Object.entries(COUNTRY_CONFEDERATION)
    .filter(([, conf]) => conf === confederation)
    .map(([code]) => code);
  const eliteClubs = clubs
    .filter((c) => {
      const league = leagues.find((l) => l.id === c.leagueId);
      return (
        league?.tier === 'pro_1' && confederationCountries.includes(c.countryCode)
      );
    })
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 16);

  if (eliteClubs.length >= 8) {
    competitions.push({
      id: continentalId,
      name: getContinentalChampionsName(confederation),
      shortName: 'Continental',
      type: 'continental',
      confederation,
      season,
    });

    for (let i = 0; i < 8; i += 2) {
      const home = eliteClubs[i]!;
      const away = eliteClubs[i + 1];
      if (!away) break;
      cupFixtures.push({
        id: `conf-${continentalId}-r1-${i}`,
        competitionId: continentalId,
        season,
        round: 1,
        roundLabel: 'Huitièmes de finale',
        homeClubId: home.id,
        awayClubId: away.id,
        status: 'pending',
        week: 18,
      });
    }
  }

  return { competitions, standings, cupFixtures };
}

function pairLeagueRound(clubIds: string[], week: number): [string, string][] {
  const rotated = [...clubIds];
  const shift = week % Math.max(rotated.length - 1, 1);
  for (let i = 0; i < shift; i++) {
    const last = rotated.pop()!;
    rotated.splice(1, 0, last);
  }
  const pairs: [string, string][] = [];
  for (let i = 0; i < rotated.length; i += 2) {
    const a = rotated[i];
    const b = rotated[i + 1];
    if (a && b) pairs.push([a, b]);
  }
  return pairs;
}

function awardTrophy(
  trophies: Trophy[],
  comp: Competition,
  winner: Club,
  season: number,
): { trophies: Trophy[]; message: string } {
  return {
    trophies: [
      ...trophies,
      {
        id: `trophy-${comp.id}-${season}-${winner.id}`,
        competitionId: comp.id,
        competitionName: comp.name,
        type: comp.type,
        season,
        clubId: winner.id,
        clubName: winner.name,
        countryCode: comp.countryCode,
        confederation: comp.confederation,
      },
    ],
    message: `🏆 ${winner.name} remporte ${comp.name} !`,
  };
}

/** Résultat de match client à intégrer aux classements ou aux coupes. */
export interface ExternalMatchResult {
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
}

/** Vrai si au moins un match de coupe est programmé cette semaine. */
export function isCupWeek(cupFixtures: CupFixture[], week: number, season: number): boolean {
  return cupFixtures.some(
    (f) => f.week === week && f.season === season && f.status === 'pending',
  );
}

/** Match de coupe programmé impliquant un club donné cette semaine. */
export function getCupFixtureForClub(
  cupFixtures: CupFixture[],
  clubId: string,
  week: number,
  season: number,
): CupFixture | undefined {
  return cupFixtures.find(
    (f) =>
      f.week === week &&
      f.season === season &&
      f.status === 'pending' &&
      (f.homeClubId === clubId || f.awayClubId === clubId),
  );
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Prochaine semaine de coupe hors mercato (le championnat y sera suspendu). */
function nextCupRoundWeek(week: number, step: number): number {
  let candidate = week + step;
  while (candidate <= 52 && !isLeagueMatchWeek(candidate)) {
    candidate++;
  }
  return Math.min(candidate, 52);
}

/**
 * Simule une journée : coupes prioritaires (pas de championnat les semaines
 * de coupe), résultats des matchs clients intégrés.
 */
export function simulateCompetitionWeek(
  week: number,
  season: number,
  competitions: Competition[],
  standings: LeagueStanding[],
  cupFixtures: CupFixture[],
  clubs: Club[],
  leagues: League[],
  trophies: Trophy[],
  externalResults: ExternalMatchResult[] = [],
): {
  standings: LeagueStanding[];
  cupFixtures: CupFixture[];
  results: CompetitionResult[];
  trophies: Trophy[];
  messages: string[];
} {
  const results: CompetitionResult[] = [];
  const messages: string[] = [];
  let nextStandings = [...standings];
  let nextCupFixtures = [...cupFixtures];
  let nextTrophies = [...trophies];

  const clubMap = new Map(clubs.map((c) => [c.id, c]));

  const cupsThisWeek = nextCupFixtures.filter(
    (f) => f.season === season && f.week === week && f.status === 'pending',
  );
  const cupWeek = cupsThisWeek.length > 0;
  const cupPairs = new Set(cupsThisWeek.map((f) => pairKey(f.homeClubId, f.awayClubId)));

  // Sépare les résultats clients : coupe vs championnat.
  const cupExternals = new Map<string, ExternalMatchResult>();
  const leagueExternals: ExternalMatchResult[] = [];
  for (const ext of externalResults) {
    const key = pairKey(ext.homeClubId, ext.awayClubId);
    if (cupPairs.has(key)) {
      cupExternals.set(key, ext);
    } else {
      leagueExternals.push(ext);
    }
  }

  const externallyPlayed = new Set<string>();

  for (const ext of leagueExternals) {
    externallyPlayed.add(ext.homeClubId);
    externallyPlayed.add(ext.awayClubId);

    const homeStanding = nextStandings.find((s) => s.clubId === ext.homeClubId);
    if (!homeStanding) continue;
    const compId = homeStanding.competitionId;

    results.push({
      id: `res-ext-${compId}-w${week}-${ext.homeClubId}`,
      competitionId: compId,
      week,
      season,
      homeClubId: ext.homeClubId,
      awayClubId: ext.awayClubId,
      homeScore: ext.homeScore,
      awayScore: ext.awayScore,
    });

    nextStandings = nextStandings.map((s) => {
      if (s.competitionId !== compId) return s;
      if (s.clubId === ext.homeClubId) return applyResult(s, ext.homeScore, ext.awayScore);
      if (s.clubId === ext.awayClubId) return applyResult(s, ext.awayScore, ext.homeScore);
      return s;
    });
  }

  // Les semaines de coupe suspendent le championnat.
  if (!cupWeek) {
    for (const comp of competitions.filter((c) => c.type === 'league')) {
      const league = leagues.find((l) => l.id === comp.leagueId);
      if (!league) continue;

      const compStandings = nextStandings.filter((s) => s.competitionId === comp.id);
      const clubIds = compStandings
        .map((s) => s.clubId)
        .filter((id) => !externallyPlayed.has(id));
      const pairs = pairLeagueRound(clubIds, week);

      for (const [homeId, awayId] of pairs) {
        const home = clubMap.get(homeId);
        const away = clubMap.get(awayId);
        if (!home || !away) continue;

        const score = simulateQuickScore(home.reputation, away.reputation);
        results.push({
          id: `res-${comp.id}-w${week}-${homeId}`,
          competitionId: comp.id,
          week,
          season,
          homeClubId: homeId,
          awayClubId: awayId,
          homeScore: score.home,
          awayScore: score.away,
        });

        nextStandings = nextStandings.map((s) => {
          if (s.competitionId !== comp.id) return s;
          if (s.clubId === homeId) return applyResult(s, score.home, score.away);
          if (s.clubId === awayId) return applyResult(s, score.away, score.home);
          return s;
        });
      }
    }
  }

  for (const fixture of cupsThisWeek) {
    const home = clubMap.get(fixture.homeClubId);
    const away = clubMap.get(fixture.awayClubId);
    if (!home || !away) continue;

    // Résultat du match client si l'utilisateur y a assisté, sinon simulation.
    const external = cupExternals.get(pairKey(fixture.homeClubId, fixture.awayClubId));
    const score = external
      ? external.homeClubId === fixture.homeClubId
        ? { home: external.homeScore, away: external.awayScore }
        : { home: external.awayScore, away: external.homeScore }
      : simulateQuickScore(home.reputation, away.reputation);
    const homeWins = score.home > score.away || (score.home === score.away && Math.random() > 0.5);
    const winner = homeWins ? home : away;

    nextCupFixtures = nextCupFixtures.map((f) =>
      f.id === fixture.id
        ? { ...f, homeScore: score.home, awayScore: score.away, status: 'played' as const }
        : f,
    );

    const comp = competitions.find((c) => c.id === fixture.competitionId);
    if (!comp) continue;

    messages.push(
      `${comp.shortName} — ${home.shortName} ${score.home}-${score.away} ${away.shortName}`,
    );

    const sameRound = nextCupFixtures.filter(
      (f) =>
        f.competitionId === fixture.competitionId &&
        f.round === fixture.round &&
        f.season === season,
    );
    const allPlayed = sameRound.every((f) => f.status === 'played');

    if (!allPlayed) continue;

    const winners = sameRound.map((f) => {
      const h = clubMap.get(f.homeClubId)!;
      const a = clubMap.get(f.awayClubId)!;
      const hScore = f.homeScore ?? 0;
      const aScore = f.awayScore ?? 0;
      return hScore >= aScore ? h : a;
    });

    if (winners.length === 1) {
      const awarded = awardTrophy(nextTrophies, comp, winners[0]!, season);
      nextTrophies = awarded.trophies;
      messages.push(awarded.message);
      continue;
    }

    const nextRound = fixture.round + 1;
    const roundLabels = ['', 'Huitièmes', 'Quarts', 'Demi-finales', 'Finale'];
    const label = roundLabels[nextRound] ?? `Tour ${nextRound}`;
    const nextWeek = nextCupRoundWeek(week, comp.type === 'continental' ? 6 : 4);

    if (winners.length === 2) {
      nextCupFixtures.push({
        id: `cupf-${comp.id}-final-${season}`,
        competitionId: comp.id,
        season,
        round: nextRound,
        roundLabel: 'Finale',
        homeClubId: winners[0]!.id,
        awayClubId: winners[1]!.id,
        status: 'pending',
        week: nextWeek,
      });
      continue;
    }

    for (let i = 0; i < winners.length; i += 2) {
      const h = winners[i];
      const a = winners[i + 1];
      if (!h || !a) continue;
      nextCupFixtures.push({
        id: `cupf-${comp.id}-r${nextRound}-${i}-${Date.now()}`,
        competitionId: comp.id,
        season,
        round: nextRound,
        roundLabel: label,
        homeClubId: h.id,
        awayClubId: a.id,
        status: 'pending',
        week: nextWeek,
      });
    }
  }

  return {
    standings: nextStandings,
    cupFixtures: nextCupFixtures,
    results,
    trophies: nextTrophies,
    messages,
  };
}

export function getSortedStandings(
  competitionId: string,
  standings: LeagueStanding[],
  clubs: Club[],
): Array<LeagueStanding & { clubName: string; goalDiff: number }> {
  const clubMap = new Map(clubs.map((c) => [c.id, c.name]));
  return standings
    .filter((s) => s.competitionId === competitionId)
    .map((s) => ({
      ...s,
      clubName: clubMap.get(s.clubId) ?? s.clubId,
      goalDiff: s.goalsFor - s.goalsAgainst,
    }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
}

export function getRecentResults(
  results: CompetitionResult[],
  competitionId: string,
  limit = 8,
): CompetitionResult[] {
  return results
    .filter((r) => r.competitionId === competitionId)
    .slice(-limit)
    .reverse();
}

import {
  getCountryByCode,
  getLeagueTiersForCountry,
  LEAGUE_TIER_LABELS,
  LEAGUE_TIER_LEVEL,
  LEAGUE_TIER_REPUTATION,
} from '@/data/world/countries';
import {
  DEFAULT_CLUBS_PER_TIER,
  INSPIRED_CLUBS,
  type InspiredClubTemplate,
} from '@/data/world/majorLeagueData';
import { generateSquadForClub } from '@/engine/world/squadGenerator';
import type { Club } from '@/types/club';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';
import type { GeneratedWorld } from '@/types/world';
import type { LeagueTier } from '@/types/world';

const PROCEDURAL_PREFIXES = ['FC', 'AS', 'SC', 'United', 'Athletic', 'Sporting', 'Real', 'Inter'];
const PROCEDURAL_CITIES = [
  'Nord', 'Sud', 'Est', 'Ouest', 'Central', 'Riverside', 'Highland', 'Coastal',
  'Metro', 'Capital', 'Valley', 'Park', 'Town', 'City', 'Star', 'Victory',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildLeagueName(countryName: string, tier: LeagueTier): string {
  const label = LEAGUE_TIER_LABELS[tier];
  if (tier === 'junior') return `Ligue Junior ${countryName}`;
  if (tier === 'pro_1') return `Ligue Pro ${countryName}`;
  return `${label} ${countryName}`;
}

function createLeague(countryCode: string, countryName: string, tier: LeagueTier): League {
  const id = `league-${countryCode.toLowerCase()}-${tier}`;
  return {
    id,
    name: buildLeagueName(countryName, tier),
    shortName: `${countryCode}-${tier.toUpperCase()}`,
    countryCode,
    countryName,
    tier,
    level: LEAGUE_TIER_LEVEL[tier],
    reputation: LEAGUE_TIER_REPUTATION[tier],
    seasonWeeks: tier === 'junior' ? 20 : 34,
    transferWindows: {
      summer: { startWeek: 1, endWeek: 4 },
      winter: { startWeek: 25, endWeek: 33 },
    },
  };
}

function proceduralClub(
  countryCode: string,
  league: League,
  index: number,
  reputationBase: number,
): Club {
  const city = PROCEDURAL_CITIES[index % PROCEDURAL_CITIES.length];
  const prefix = PROCEDURAL_PREFIXES[index % PROCEDURAL_PREFIXES.length];
  const name = `${prefix} ${city}`;
  const rep = clamp(reputationBase - index * 2, 20, 95);
  const id = `club-${countryCode.toLowerCase()}-${league.tier}-${index}`;

  return {
    id,
    name,
    shortName: name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase(),
    leagueId: league.id,
    countryCode,
    reputation: rep,
    budget: Math.round(rep * rep * 15_000),
    wageBudget: Math.round(rep * 8_000),
    colors: {
      primary: `hsl(${(index * 47) % 360}, 60%, 40%)`,
      secondary: '#FFFFFF',
    },
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function createClubFromTemplate(
  template: InspiredClubTemplate,
  countryCode: string,
  league: League,
  index: number,
): Club {
  const id = `club-${countryCode.toLowerCase()}-${slugify(template.name)}-${index}`;
  return {
    id,
    name: template.name,
    shortName: template.shortName,
    leagueId: league.id,
    countryCode,
    reputation: template.reputation,
    budget: template.budget,
    wageBudget: Math.round(template.budget / 40),
    colors: template.colors,
  };
}

function generateClubsForLeague(countryCode: string, league: League): Club[] {
  const inspired = INSPIRED_CLUBS[countryCode]?.[league.tier];
  const defaultCount = DEFAULT_CLUBS_PER_TIER[league.tier] ?? 12;
  const targetCount = Math.max(inspired?.length ?? 0, defaultCount);
  const repBase = LEAGUE_TIER_REPUTATION[league.tier];

  if (inspired && inspired.length > 0) {
    const clubs = inspired.map((t, i) => createClubFromTemplate(t, countryCode, league, i));
    const remaining = targetCount - clubs.length;
    for (let i = 0; i < remaining; i++) {
      clubs.push(proceduralClub(countryCode, league, clubs.length + i, repBase - 10));
    }
    return clubs;
  }

  return Array.from({ length: targetCount }, (_, i) =>
    proceduralClub(countryCode, league, i, repBase),
  );
}

/** Complète les ligues d'une sauvegarde qui n'auraient pas assez de clubs. */
export function ensureLeagueClubs(
  leagues: League[],
  clubs: Club[],
): { clubs: Club[]; added: Club[] } {
  const added: Club[] = [];

  for (const league of leagues) {
    const existing = clubs.filter((c) => c.leagueId === league.id);
    const target = DEFAULT_CLUBS_PER_TIER[league.tier] ?? 12;
    if (existing.length >= Math.min(target, 8)) continue;

    const repBase = LEAGUE_TIER_REPUTATION[league.tier];
    const needed = target - existing.length;
    for (let i = 0; i < needed; i++) {
      added.push(proceduralClub(league.countryCode, league, existing.length + i + 100, repBase - 8));
    }
  }

  return { clubs: added.length > 0 ? [...clubs, ...added] : clubs, added };
}

export interface BuildWorldOptions {
  /** Pays dont les championnats sont actifs. */
  countryCodes: string[];
}

/** Génère ligues, clubs et joueurs pour un seul pays. */
export function generateCountryFootball(countryCode: string): GeneratedWorld {
  const country = getCountryByCode(countryCode);
  if (!country) {
    return { leagues: [], clubs: [], players: [] };
  }

  const leagues: League[] = [];
  const clubs: Club[] = [];
  const players: Player[] = [];
  const tiers = getLeagueTiersForCountry(country.tier);

  for (const tier of tiers) {
    const league = createLeague(country.code, country.name, tier);
    leagues.push(league);

    const leagueClubs = generateClubsForLeague(country.code, league);
    const sortedByRep = [...leagueClubs].sort((a, b) => b.reputation - a.reputation);

    for (let clubIndex = 0; clubIndex < leagueClubs.length; clubIndex++) {
      const club = leagueClubs[clubIndex]!;
      clubs.push(club);

      const rank = sortedByRep.findIndex((c) => c.id === club.id);
      const squadSize = tier === 'junior' ? 12 : 20;
      const squad = generateSquadForClub(club, league, country.name, squadSize, rank, leagueClubs.length);
      players.push(...squad);
    }
  }

  return { leagues, clubs, players };
}

/**
 * Construit le monde pour les pays débloqués uniquement.
 */
export function buildWorldForCountries(countryCodes: string[]): GeneratedWorld {
  const leagues: League[] = [];
  const clubs: Club[] = [];
  const players: Player[] = [];

  for (const code of countryCodes) {
    const chunk = generateCountryFootball(code);
    leagues.push(...chunk.leagues);
    clubs.push(...chunk.clubs);
    players.push(...chunk.players);
  }

  return { leagues, clubs, players };
}

/** @deprecated Utiliser buildWorldForCountries */
export function buildWorldDatabase(options: { agencyCountryCode: string }): GeneratedWorld {
  return buildWorldForCountries([options.agencyCountryCode]);
}

/** Tous les joueurs non-clients disponibles au mercato. */
export function getMercatoPool(players: Player[]): Player[] {
  return players.filter((p) => !p.isClient);
}

export function getCountryName(code: string): string {
  return getCountryByCode(code)?.name ?? code;
}

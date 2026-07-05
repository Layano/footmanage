import { calculateOverallRating } from '../players/ratingEngine';
import { estimateMonthlyWage } from '../simulation/salaryEngine';
import { GAME_CONFIG } from '../../constants/gameConfig';
import type { OutfieldPlayerAttributes } from '../../types/attributes';
import type { OutfieldPlayer, Player } from '../../types/player';
import type { PlayerPosition } from '../../types/positions';
import type { Club } from '../../types/club';
import type { League } from '../../types/league';

const FIRST_NAMES = [
  'Lucas', 'Noah', 'Ethan', 'Yanis', 'Tom', 'Axel', 'Marco', 'Diego', 'Omar', 'Kenji',
  'Pierre', 'Carlos', 'Ivan', 'Sven', 'Amir', 'João', 'Luis', 'Hugo', 'Max', 'Leo',
];
const LAST_NAMES = [
  'Martin', 'Silva', 'Garcia', 'Müller', 'Rossi', 'Dubois', 'Santos', 'Kowalski', 'Nielsen', 'Okonkwo',
  'Petit', 'Costa', 'Fernandez', 'Schmidt', 'Moreau', 'Alves', 'Johansson', 'Diallo', 'Popov', 'Chen',
];
const POSITIONS: Exclude<PlayerPosition, 'GK'>[] = ['ST', 'WING', 'AM', 'DM', 'CB', 'FB'];
const FEET: Array<'left' | 'right' | 'both'> = ['left', 'right', 'both'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/** Calcule la fourchette de stats selon le club et la ligue. */
function getStatRange(club: Club, league: League): { min: number; max: number; ageMin: number; ageMax: number } {
  const isJunior = league.tier === 'junior';
  const base = isJunior
    ? 3
    : clamp(Math.round(20 - league.level * 2 - (90 - club.reputation) / 12), 4, 17);

  return {
    min: isJunior ? GAME_CONFIG.AMATEUR_STAT_MIN : Math.max(4, base - 2),
    max: isJunior ? 8 : Math.min(19, base + 3),
    ageMin: isJunior ? 15 : 18,
    ageMax: isJunior ? 19 : 34,
  };
}

function randomStat(min: number, max: number): number {
  return randomInt(min, max);
}

function buildAttributes(min: number, max: number): OutfieldPlayerAttributes {
  return {
    physical: {
      speed: randomStat(min, max),
      acceleration: randomStat(min, max),
      endurance: randomStat(min, max),
      strength: randomStat(min, max),
      agility: randomStat(min, max),
    },
    technical: {
      shooting: randomStat(min, max),
      passing: randomStat(min, max),
      dribbling: randomStat(min, max),
      control: randomStat(min, max),
      crossing: randomStat(min, max),
      tackling: randomStat(min, max),
      marking: randomStat(min, max),
    },
    mental: {
      determination: randomStat(min, max),
      vision: randomStat(min, max),
      composure: randomStat(min, max),
      positioning: randomStat(min, max),
      workRate: randomStat(min, max),
    },
  };
}

function potentialFromStats(currentDisplay: number, league: League, isGem: boolean): number {
  const ceilingDisplay = isGem
    ? randomInt(Math.min(18, currentDisplay + 4), 19)
    : randomInt(currentDisplay, Math.min(19, currentDisplay + randomInt(1, 4)));
  return Math.round((ceilingDisplay / 20) * 98) + 1;
}

export function generateSquadForClub(
  club: Club,
  league: League,
  nationality: string,
  squadSize = 18,
): OutfieldPlayer[] {
  const range = getStatRange(club, league);
  const gemIndex = randomInt(0, squadSize - 1);

  return Array.from({ length: squadSize }, (_, i) => {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const position = pick(POSITIONS);
    const age = randomInt(range.ageMin, range.ageMax);
    const attributes = buildAttributes(range.min, range.max);
    const overallRating = calculateOverallRating(position, attributes);
    const currentDisplay = Math.round(overallRating / 5);
    const isGem = i === gemIndex && league.tier !== 'junior';
    const potentialRating = potentialFromStats(currentDisplay, league, isGem);

    const id = `player-${club.id}-${i}-${Date.now()}`;

    const basePlayer = {
      id,
      firstName,
      lastName,
      displayName: `${firstName.charAt(0)}. ${lastName}`,
      age,
      nationality,
      position,
      preferredFoot: pick(FEET),
      attributes,
      overallRating,
      potentialRating,
      potential: {
        ceiling: potentialRating,
        revealedPercent: randomInt(10, 35),
      },
      marketValue: Math.round(overallRating * randomInt(8_000, 25_000)),
      contract: {
        clubId: league.tier === 'junior' ? null : club.id,
        monthlyWage: 0,
        startDate: '2025-07-01',
        endDate: '2028-06-30',
      },
      status: league.tier === 'junior' ? ('free_agent' as const) : ('active' as const),
      isClient: false,
      morale: randomInt(60, 90),
      form: randomInt(50, 80),
      seasonMinutes: 0,
      weeklyMinutes: 0,
    } satisfies Omit<Player, 'attributes'> & { attributes: typeof attributes };

    const monthlyWage =
      league.tier === 'junior' ? 0 : estimateMonthlyWage(basePlayer as Player, club, league);

    return {
      ...basePlayer,
      contract: {
        ...basePlayer.contract,
        monthlyWage,
      },
      currentTeam: league.tier === 'junior' ? `${club.name}` : undefined,
    };
  });
}

/** Génère un pool réduit de joueurs pour les pays non actifs (mercato). */
export function generateLitePoolForClub(
  club: Club,
  league: League,
  nationality: string,
  count = 5,
): Player[] {
  return generateSquadForClub(club, league, nationality, count);
}

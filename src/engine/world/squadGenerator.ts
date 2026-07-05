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
const ATTACK_POSITIONS: Exclude<PlayerPosition, 'GK'>[] = ['ST', 'WING', 'AM'];
const MID_POSITIONS: Exclude<PlayerPosition, 'GK'>[] = ['DM', 'AM'];
const DEF_POSITIONS: Exclude<PlayerPosition, 'GK'>[] = ['CB', 'FB'];
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

/** Répartition de postes pour un effectif équilibré (buteurs inclus). */
function buildSquadPositions(squadSize: number): Exclude<PlayerPosition, 'GK'>[] {
  const positions: Exclude<PlayerPosition, 'GK'>[] = [];
  const stCount = Math.max(2, Math.round(squadSize * 0.15));
  const wingCount = Math.max(2, Math.round(squadSize * 0.15));
  const amCount = Math.max(1, Math.round(squadSize * 0.1));
  const dmCount = Math.max(2, Math.round(squadSize * 0.12));
  const cbCount = Math.max(3, Math.round(squadSize * 0.2));
  const fbCount = Math.max(2, Math.round(squadSize * 0.12));

  for (let i = 0; i < stCount; i++) positions.push('ST');
  for (let i = 0; i < wingCount; i++) positions.push('WING');
  for (let i = 0; i < amCount; i++) positions.push('AM');
  for (let i = 0; i < dmCount; i++) positions.push('DM');
  for (let i = 0; i < cbCount; i++) positions.push('CB');
  for (let i = 0; i < fbCount; i++) positions.push('FB');

  while (positions.length < squadSize) positions.push(pick([...ATTACK_POSITIONS, ...MID_POSITIONS, ...DEF_POSITIONS]));
  return positions.slice(0, squadSize);
}

/** Fourchette de stats selon club, ligue et classement dans le championnat. */
function getStatRange(
  club: Club,
  league: League,
  clubRank = 0,
  totalClubs = 1,
): { min: number; max: number; ageMin: number; ageMax: number } {
  const isJunior = league.tier === 'junior';
  const rankFactor = totalClubs > 1 ? 1 - clubRank / (totalClubs - 1) : 0.5;
  const repFactor = club.reputation / 100;
  const leagueFactor = (6 - league.level) / 5;

  const skillBase = isJunior
    ? 4
    : clamp(Math.round(6 + repFactor * 8 + rankFactor * 5 + leagueFactor * 3), 4, 17);

  return {
    min: isJunior ? GAME_CONFIG.AMATEUR_STAT_MIN : Math.max(4, skillBase - 2),
    max: isJunior ? 9 : Math.min(19, skillBase + 3),
    ageMin: isJunior ? 15 : 18,
    ageMax: isJunior ? 19 : 33,
  };
}

function randomStat(min: number, max: number): number {
  return randomInt(min, max);
}

function buildAttributes(min: number, max: number, position: Exclude<PlayerPosition, 'GK'>): OutfieldPlayerAttributes {
  const shootingBoost = ATTACK_POSITIONS.includes(position) ? 1 : 0;
  const attrs = {
    physical: {
      speed: randomStat(min, max),
      acceleration: randomStat(min, max),
      endurance: randomStat(min, max),
      strength: randomStat(min, max),
      agility: randomStat(min, max),
    },
    technical: {
      shooting: randomStat(min, max + shootingBoost),
      passing: randomStat(min, max),
      dribbling: randomStat(min, max + (position === 'WING' ? 1 : 0)),
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
  return attrs;
}

function potentialFromStats(currentDisplay: number, league: League, isGem: boolean): number {
  const ceilingDisplay = isGem
    ? randomInt(Math.min(18, currentDisplay + 4), 19)
    : randomInt(currentDisplay, Math.min(19, currentDisplay + randomInt(1, 4)));
  return Math.round((ceilingDisplay / 20) * 98) + 1;
}

function buildPlayerForClub(
  club: Club,
  league: League,
  nationality: string,
  position: Exclude<PlayerPosition, 'GK'>,
  range: ReturnType<typeof getStatRange>,
  index: number,
  isGem: boolean,
  isAcademy = false,
): OutfieldPlayer {
  const age = isAcademy
    ? randomInt(16, 18)
    : randomInt(range.ageMin, range.ageMax);
  const attrMin = isAcademy ? Math.max(3, range.min - 1) : range.min;
  const attrMax = isAcademy ? Math.min(range.max, range.min + 4) : range.max;
  const attributes = buildAttributes(attrMin, attrMax, position);
  const overallRating = calculateOverallRating(position, attributes);
  const potentialRating = potentialFromStats(Math.round(overallRating / 5), league, isGem || isAcademy);

  const id = `player-${club.id}-${isAcademy ? 'academy' : 'squad'}-${index}-${Date.now()}-${randomInt(0, 9999)}`;
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);

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
      revealedPercent: isAcademy ? 20 : randomInt(10, 35),
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
    currentTeam: isAcademy ? `${club.name} · Académie` : undefined,
  } satisfies Omit<Player, 'attributes'> & { attributes: typeof attributes };

  const monthlyWage =
    league.tier === 'junior' ? 0 : estimateMonthlyWage(basePlayer as Player, club, league);

  return {
    ...basePlayer,
    contract: { ...basePlayer.contract, monthlyWage },
    currentTeam: basePlayer.currentTeam ?? (league.tier === 'junior' ? club.name : undefined),
  };
}

export function generateSquadForClub(
  club: Club,
  league: League,
  nationality: string,
  squadSize = 18,
  clubRank = 0,
  totalClubs = 1,
): OutfieldPlayer[] {
  const range = getStatRange(club, league, clubRank, totalClubs);
  const positions = buildSquadPositions(squadSize);
  const gemIndex = randomInt(0, squadSize - 1);

  return positions.map((position, i) =>
    buildPlayerForClub(club, league, nationality, position, range, i, i === gemIndex && league.tier !== 'junior'),
  );
}

/** Jeunes promus depuis l'académie du club. */
export function generateAcademyPlayers(
  club: Club,
  league: League,
  nationality: string,
  count = 2,
): OutfieldPlayer[] {
  if (league.tier === 'junior') return [];

  const range = getStatRange(club, league, 0, 1);
  const attackSlots = Math.max(1, Math.round(count * 0.5));
  const positions: Exclude<PlayerPosition, 'GK'>[] = [];

  for (let i = 0; i < attackSlots; i++) positions.push(pick(['ST', 'WING', 'ST']));
  while (positions.length < count) positions.push(pick(['AM', 'DM', 'CB', 'FB', 'WING']));

  return positions.map((position, i) =>
    buildPlayerForClub(club, league, nationality, position, range, i, false, true),
  );
}

/** Génère un pool réduit de joueurs pour les pays non actifs (mercato). */
export function generateLitePoolForClub(
  club: Club,
  league: League,
  nationality: string,
  count = 5,
  clubRank = 0,
  totalClubs = 1,
): Player[] {
  return generateSquadForClub(club, league, nationality, count, clubRank, totalClubs);
}

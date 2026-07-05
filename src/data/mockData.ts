import { calculateOverallRating } from '../engine/players/ratingEngine';
import type { Agency } from '../types/agency';
import type { Club } from '../types/club';
import type { League } from '../types/league';
import type {
  GoalkeeperPlayer,
  OutfieldPlayer,
  OutfieldPlayerAttributes,
  GoalkeeperPlayerAttributes,
  Player,
} from '../types';
import type { Staff } from '../types/staff';

// ─── Identifiants constants ───────────────────────────────────────────────────

export const AGENCY_ID = 'agency-player-001';

// ─── Ligues ───────────────────────────────────────────────────────────────────

export const MOCK_LEAGUES: League[] = [
  {
    id: 'league-eng',
    name: 'English Premier Div',
    shortName: 'EPD',
    country: 'ENG',
    countryName: 'Angleterre',
    reputation: 95,
    seasonWeeks: 38,
    transferWindows: {
      summer: { startWeek: 1, endWeek: 8 },
      winter: { startWeek: 22, endWeek: 24 },
    },
  },
  {
    id: 'league-fra',
    name: 'Ligue 1 France',
    shortName: 'L1F',
    country: 'FRA',
    countryName: 'France',
    reputation: 82,
    seasonWeeks: 34,
    transferWindows: {
      summer: { startWeek: 1, endWeek: 8 },
      winter: { startWeek: 20, endWeek: 22 },
    },
  },
];

// ─── Clubs ────────────────────────────────────────────────────────────────────

export const MOCK_CLUBS: Club[] = [
  // English Premier Div
  {
    id: 'club-man-red',
    name: 'Man Red',
    shortName: 'MRE',
    leagueId: 'league-eng',
    reputation: 92,
    budget: 180_000_000,
    wageBudget: 3_500_000,
    colors: { primary: '#DA291C', secondary: '#FBE122' },
  },
  {
    id: 'club-london-blue',
    name: 'London Blue',
    shortName: 'LBL',
    leagueId: 'league-eng',
    reputation: 88,
    budget: 150_000_000,
    wageBudget: 3_000_000,
    colors: { primary: '#034694', secondary: '#FFFFFF' },
  },
  {
    id: 'club-liver-red',
    name: 'Liver Red',
    shortName: 'LVR',
    leagueId: 'league-eng',
    reputation: 90,
    budget: 120_000_000,
    wageBudget: 2_800_000,
    colors: { primary: '#C8102E', secondary: '#00B2A9' },
  },
  {
    id: 'club-north-london',
    name: 'North London',
    shortName: 'NLR',
    leagueId: 'league-eng',
    reputation: 85,
    budget: 100_000_000,
    wageBudget: 2_200_000,
    colors: { primary: '#EF0107', secondary: '#FFFFFF' },
  },
  // Ligue 1 France
  {
    id: 'club-paris-sg',
    name: 'Paris SG',
    shortName: 'PSG',
    leagueId: 'league-fra',
    reputation: 91,
    budget: 200_000_000,
    wageBudget: 4_000_000,
    colors: { primary: '#004170', secondary: '#DA0F16' },
  },
  {
    id: 'club-marseille-blue',
    name: 'Marseille Blue',
    shortName: 'OMB',
    leagueId: 'league-fra',
    reputation: 78,
    budget: 45_000_000,
    wageBudget: 1_200_000,
    colors: { primary: '#2FAEE0', secondary: '#FFFFFF' },
  },
  {
    id: 'club-lyon-ol',
    name: 'Lyon OL',
    shortName: 'OL',
    leagueId: 'league-fra',
    reputation: 80,
    budget: 60_000_000,
    wageBudget: 1_500_000,
    colors: { primary: '#FFFFFF', secondary: '#D00027' },
  },
  {
    id: 'club-monaco-asm',
    name: 'Monaco ASM',
    shortName: 'ASM',
    leagueId: 'league-fra',
    reputation: 76,
    budget: 55_000_000,
    wageBudget: 1_300_000,
    colors: { primary: '#E30613', secondary: '#FFFFFF' },
  },
];

// ─── Helpers de construction ────────────────────────────────────────────────────

function buildOutfieldPlayer(
  base: Omit<OutfieldPlayer, 'overallRating' | 'potentialRating' | 'potential' | 'attributes'> & {
    attributes: OutfieldPlayerAttributes;
    potentialCeiling: number;
  },
): OutfieldPlayer {
  const overallRating = calculateOverallRating(base.position, base.attributes);
  const potentialRating = Math.min(99, base.potentialCeiling);

  return {
    ...base,
    overallRating,
    potentialRating,
    potential: {
      ceiling: base.potentialCeiling,
      revealedPercent: base.isClient ? 65 : 20,
    },
  };
}

function buildGoalkeeper(
  base: Omit<GoalkeeperPlayer, 'overallRating' | 'potentialRating' | 'potential' | 'attributes'> & {
    attributes: GoalkeeperPlayerAttributes;
    potentialCeiling: number;
  },
): GoalkeeperPlayer {
  const overallRating = calculateOverallRating('GK', base.attributes);
  const potentialRating = Math.min(99, base.potentialCeiling);

  return {
    ...base,
    overallRating,
    potentialRating,
    potential: {
      ceiling: base.potentialCeiling,
      revealedPercent: base.isClient ? 60 : 15,
    },
  };
}

// ─── Joueurs ──────────────────────────────────────────────────────────────────

export const MOCK_PLAYERS: Player[] = [
  // ✅ Client 1 — Buteur star (Man Red)
  buildOutfieldPlayer({
    id: 'player-001',
    firstName: 'M.',
    lastName: 'Rashfard',
    displayName: 'M. Rashfard',
    age: 26,
    nationality: 'Angleterre',
    position: 'ST',
    preferredFoot: 'right',
    marketValue: 75_000_000,
    contract: {
      clubId: 'club-man-red',
      weeklyWage: 250_000,
      startDate: '2024-07-01',
      endDate: '2028-06-30',
      releaseClause: 120_000_000,
    },
    status: 'active',
    isClient: true,
    agentId: AGENCY_ID,
    morale: 82,
    form: 78,
    potentialCeiling: 88,
    attributes: {
      physical: { speed: 17, acceleration: 16, endurance: 14, strength: 13, agility: 16 },
      technical: { shooting: 17, passing: 13, dribbling: 15, control: 16, crossing: 12, tackling: 5, marking: 6 },
      mental: { determination: 16, vision: 13, composure: 15, positioning: 17, workRate: 14 },
    },
  }),

  // ✅ Client 2 — Milieu offensif créatif (Paris SG)
  buildOutfieldPlayer({
    id: 'player-002',
    firstName: 'K.',
    lastName: 'Mbappé-like',
    displayName: 'K. Dembélé Jr',
    age: 24,
    nationality: 'France',
    position: 'AM',
    preferredFoot: 'right',
    marketValue: 90_000_000,
    contract: {
      clubId: 'club-paris-sg',
      weeklyWage: 300_000,
      startDate: '2023-08-01',
      endDate: '2027-06-30',
      releaseClause: 150_000_000,
    },
    status: 'active',
    isClient: true,
    agentId: AGENCY_ID,
    morale: 88,
    form: 85,
    potentialCeiling: 92,
    attributes: {
      physical: { speed: 18, acceleration: 18, endurance: 15, strength: 12, agility: 17 },
      technical: { shooting: 15, passing: 16, dribbling: 18, control: 17, crossing: 14, tackling: 6, marking: 5 },
      mental: { determination: 14, vision: 17, composure: 15, positioning: 14, workRate: 13 },
    },
  }),

  // ✅ Client 3 — Défenseur central solide (Liver Red)
  buildOutfieldPlayer({
    id: 'player-003',
    firstName: 'V.',
    lastName: 'Van Dijk-like',
    displayName: 'V. De Ligt Jr',
    age: 28,
    nationality: 'Pays-Bas',
    position: 'CB',
    preferredFoot: 'right',
    marketValue: 55_000_000,
    contract: {
      clubId: 'club-liver-red',
      weeklyWage: 180_000,
      startDate: '2022-07-01',
      endDate: '2026-06-30',
    },
    status: 'active',
    isClient: true,
    agentId: AGENCY_ID,
    morale: 75,
    form: 80,
    potentialCeiling: 86,
    attributes: {
      physical: { speed: 14, acceleration: 13, endurance: 15, strength: 18, agility: 12 },
      technical: { shooting: 6, passing: 14, dribbling: 10, control: 13, crossing: 7, tackling: 17, marking: 18 },
      mental: { determination: 17, vision: 13, composure: 16, positioning: 18, workRate: 15 },
    },
  }),

  // Gardien (London Blue) — pas client
  buildGoalkeeper({
    id: 'player-004',
    firstName: 'A.',
    lastName: 'Becker-like',
    displayName: 'A. Mendy Jr',
    age: 31,
    nationality: 'Brésil',
    position: 'GK',
    preferredFoot: 'right',
    marketValue: 25_000_000,
    contract: {
      clubId: 'club-london-blue',
      weeklyWage: 120_000,
      startDate: '2023-07-01',
      endDate: '2026-06-30',
    },
    status: 'active',
    isClient: false,
    morale: 70,
    form: 76,
    potentialCeiling: 84,
    attributes: {
      physical: { speed: 10, acceleration: 11, endurance: 14, strength: 15, agility: 14 },
      technical: { reflexes: 17, diving: 16, passing: 13, control: 12 },
      mental: { determination: 15, vision: 11, composure: 16, positioning: 17, workRate: 12 },
    },
  }),

  // Ailier jeune talent (Monaco ASM)
  buildOutfieldPlayer({
    id: 'player-005',
    firstName: 'J.',
    lastName: 'Bellingham-like',
    displayName: 'J. Touré',
    age: 19,
    nationality: 'France',
    position: 'WING',
    preferredFoot: 'left',
    marketValue: 35_000_000,
    contract: {
      clubId: 'club-monaco-asm',
      weeklyWage: 45_000,
      startDate: '2025-01-01',
      endDate: '2028-06-30',
    },
    status: 'active',
    isClient: false,
    morale: 90,
    form: 82,
    potentialCeiling: 90,
    attributes: {
      physical: { speed: 16, acceleration: 17, endurance: 14, strength: 11, agility: 16 },
      technical: { shooting: 13, passing: 14, dribbling: 16, control: 15, crossing: 15, tackling: 8, marking: 7 },
      mental: { determination: 15, vision: 14, composure: 13, positioning: 12, workRate: 15 },
    },
  }),

  // Milieu défensif (Lyon OL)
  buildOutfieldPlayer({
    id: 'player-006',
    firstName: 'N.',
    lastName: 'Kanté-like',
    displayName: 'N. Kanté Jr',
    age: 32,
    nationality: 'France',
    position: 'DM',
    preferredFoot: 'right',
    marketValue: 20_000_000,
    contract: {
      clubId: 'club-lyon-ol',
      weeklyWage: 90_000,
      startDate: '2024-01-01',
      endDate: '2026-06-30',
    },
    status: 'active',
    isClient: false,
    morale: 72,
    form: 74,
    potentialCeiling: 82,
    attributes: {
      physical: { speed: 14, acceleration: 15, endurance: 18, strength: 14, agility: 15 },
      technical: { shooting: 8, passing: 14, dribbling: 13, control: 14, crossing: 9, tackling: 17, marking: 16 },
      mental: { determination: 18, vision: 13, composure: 15, positioning: 16, workRate: 18 },
    },
  }),

  // Latéral (North London)
  buildOutfieldPlayer({
    id: 'player-007',
    firstName: 'T.',
    lastName: 'Alexander-Arnold-like',
    displayName: 'T. Walker Jr',
    age: 25,
    nationality: 'Angleterre',
    position: 'FB',
    preferredFoot: 'right',
    marketValue: 40_000_000,
    contract: {
      clubId: 'club-north-london',
      weeklyWage: 110_000,
      startDate: '2023-07-01',
      endDate: '2027-06-30',
    },
    status: 'active',
    isClient: false,
    morale: 68,
    form: 71,
    potentialCeiling: 85,
    attributes: {
      physical: { speed: 15, acceleration: 14, endurance: 16, strength: 12, agility: 13 },
      technical: { shooting: 10, passing: 16, dribbling: 13, control: 14, crossing: 17, tackling: 13, marking: 12 },
      mental: { determination: 14, vision: 15, composure: 13, positioning: 13, workRate: 15 },
    },
  }),

  // Buteur en forme (Marseille Blue)
  buildOutfieldPlayer({
    id: 'player-008',
    firstName: 'P.',
    lastName: 'Aubameyang-like',
    displayName: 'P. Aubin',
    age: 34,
    nationality: 'Gabon',
    position: 'ST',
    preferredFoot: 'both',
    marketValue: 8_000_000,
    contract: {
      clubId: 'club-marseille-blue',
      weeklyWage: 70_000,
      startDate: '2024-08-01',
      endDate: '2025-06-30',
    },
    status: 'active',
    isClient: false,
    morale: 65,
    form: 69,
    potentialCeiling: 78,
    attributes: {
      physical: { speed: 15, acceleration: 15, endurance: 12, strength: 11, agility: 14 },
      technical: { shooting: 16, passing: 11, dribbling: 14, control: 15, crossing: 8, tackling: 4, marking: 5 },
      mental: { determination: 13, vision: 11, composure: 14, positioning: 16, workRate: 11 },
    },
  }),

  // Jeune défenseur prometteur (London Blue) — pépite scouting
  buildOutfieldPlayer({
    id: 'player-009',
    firstName: 'W.',
    lastName: 'Saliba-like',
    displayName: 'W. Colo Jr',
    age: 22,
    nationality: 'France',
    position: 'CB',
    preferredFoot: 'right',
    marketValue: 50_000_000,
    contract: {
      clubId: 'club-london-blue',
      weeklyWage: 95_000,
      startDate: '2024-07-01',
      endDate: '2029-06-30',
    },
    status: 'active',
    isClient: false,
    morale: 80,
    form: 83,
    potentialCeiling: 91,
    attributes: {
      physical: { speed: 16, acceleration: 15, endurance: 14, strength: 16, agility: 14 },
      technical: { shooting: 5, passing: 13, dribbling: 11, control: 12, crossing: 6, tackling: 16, marking: 17 },
      mental: { determination: 14, vision: 12, composure: 15, positioning: 16, workRate: 14 },
    },
  }),

  // Agent libre — opportunité mercato
  buildOutfieldPlayer({
    id: 'player-010',
    firstName: 'L.',
    lastName: 'Mussi',
    displayName: 'L. Mussi',
    age: 36,
    nationality: 'Argentine',
    position: 'AM',
    preferredFoot: 'left',
    marketValue: 5_000_000,
    contract: {
      clubId: null,
      weeklyWage: 0,
      startDate: '2025-07-01',
      endDate: '2025-06-30',
    },
    status: 'free_agent',
    isClient: false,
    morale: 60,
    form: 65,
    potentialCeiling: 75,
    attributes: {
      physical: { speed: 12, acceleration: 13, endurance: 14, strength: 10, agility: 15 },
      technical: { shooting: 14, passing: 17, dribbling: 18, control: 18, crossing: 14, tackling: 5, marking: 4 },
      mental: { determination: 16, vision: 19, composure: 17, positioning: 14, workRate: 11 },
    },
  }),
];

// ─── Staff ────────────────────────────────────────────────────────────────────

export const MOCK_STAFF: Staff[] = [
  {
    id: 'staff-scout-001',
    firstName: 'Marc',
    lastName: 'Dubois',
    role: 'scout',
    level: 1,
    weeklySalary: 2_500,
    bonuses: {
      discoveryRange: 2,
      potentialRevealBonus: 10,
    },
    hiredAt: '2025-07-01',
  },
];

// ─── Agence ───────────────────────────────────────────────────────────────────

export const MOCK_AGENCY: Agency = {
  id: AGENCY_ID,
  name: 'Elite Sport Management',
  reputation: 45,
  foundedYear: 2024,
  finances: {
    balance: 500_000,
    totalRevenue: 0,
    totalExpenses: 0,
    commissionRate: 10,
    operatingCosts: 5_000,
  },
  staff: MOCK_STAFF,
  clientPlayerIds: ['player-001', 'player-002', 'player-003'],
  maxClients: 10,
  office: {
    city: 'Paris',
    country: 'France',
    level: 1,
  },
};

// ─── Export global ────────────────────────────────────────────────────────────

export interface MockGameData {
  leagues: League[];
  clubs: Club[];
  players: Player[];
  agency: Agency;
}

export const MOCK_GAME_DATA: MockGameData = {
  leagues: MOCK_LEAGUES,
  clubs: MOCK_CLUBS,
  players: MOCK_PLAYERS,
  agency: MOCK_AGENCY,
};

/** Retourne les joueurs clients de l'agence. */
export function getAgencyClients(players: Player[] = MOCK_PLAYERS): Player[] {
  return players.filter((p) => p.isClient && p.agentId === AGENCY_ID);
}

/** Retourne les joueurs disponibles au scouting (non clients). */
export function getScoutingTargets(players: Player[] = MOCK_PLAYERS): Player[] {
  return players.filter((p) => !p.isClient);
}

/** Retourne un club par son identifiant. */
export function getClubById(clubId: string | null, clubs: Club[] = MOCK_CLUBS): Club | undefined {
  if (!clubId) return undefined;
  return clubs.find((c) => c.id === clubId);
}

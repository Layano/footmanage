import type { StaffRole } from '@/types/staff';

export interface OfficeLevelConfig {
  level: number;
  name: string;
  /** Coût d'achat du local (une fois). */
  upgradeCost: number;
  /** Frais de fonctionnement mensuels. */
  monthlyCost: number;
  /** Nombre max de clients gérables. */
  maxClients: number;
  /** Nombre max de membres du staff. */
  maxStaff: number;
}

export const OFFICE_LEVELS: OfficeLevelConfig[] = [
  { level: 1, name: 'Bureau de quartier', upgradeCost: 0, monthlyCost: 0, maxClients: 3, maxStaff: 1 },
  { level: 2, name: 'Petit local', upgradeCost: 4_000, monthlyCost: 250, maxClients: 6, maxStaff: 2 },
  { level: 3, name: 'Agence de ville', upgradeCost: 18_000, monthlyCost: 800, maxClients: 10, maxStaff: 4 },
  { level: 4, name: 'Agence régionale', upgradeCost: 60_000, monthlyCost: 2_200, maxClients: 16, maxStaff: 6 },
  { level: 5, name: 'Siège international', upgradeCost: 200_000, monthlyCost: 6_000, maxClients: 25, maxStaff: 10 },
];

export function getOfficeLevelConfig(level: number): OfficeLevelConfig {
  return OFFICE_LEVELS.find((o) => o.level === level) ?? OFFICE_LEVELS[0]!;
}

export function getNextOfficeLevel(level: number): OfficeLevelConfig | null {
  return OFFICE_LEVELS.find((o) => o.level === level + 1) ?? null;
}

export interface StaffTemplate {
  role: StaffRole;
  roleLabel: string;
  level: number;
  weeklySalary: number;
  /** Prime d'embauche (une fois). */
  hiringFee: number;
  description: string;
  bonuses: {
    discoveryRange?: number;
    potentialRevealBonus?: number;
    commissionBonus?: number;
    contractDiscount?: number;
    evolutionBonus?: number;
    moraleBonus?: number;
  };
}

export const STAFF_CATALOG: StaffTemplate[] = [
  {
    role: 'scout',
    roleLabel: 'Recruteur junior',
    level: 1,
    weeklySalary: 120,
    hiringFee: 300,
    description: 'Révèle mieux le potentiel des joueurs observés.',
    bonuses: { potentialRevealBonus: 12, discoveryRange: 1 },
  },
  {
    role: 'scout',
    roleLabel: 'Recruteur confirmé',
    level: 2,
    weeklySalary: 380,
    hiringFee: 1_200,
    description: 'Analyse précise du potentiel, réseau élargi.',
    bonuses: { potentialRevealBonus: 25, discoveryRange: 2 },
  },
  {
    role: 'trainer',
    roleLabel: 'Préparateur physique',
    level: 1,
    weeklySalary: 180,
    hiringFee: 500,
    description: 'Améliore la progression hebdomadaire des clients.',
    bonuses: { evolutionBonus: 10, moraleBonus: 5 },
  },
  {
    role: 'trainer',
    roleLabel: 'Coach individuel',
    level: 2,
    weeklySalary: 520,
    hiringFee: 2_000,
    description: 'Progression accélérée et moral au beau fixe.',
    bonuses: { evolutionBonus: 22, moraleBonus: 12 },
  },
  {
    role: 'lawyer',
    roleLabel: 'Juriste sportif',
    level: 1,
    weeklySalary: 250,
    hiringFee: 800,
    description: 'Négocie de meilleures commissions sur les contrats.',
    bonuses: { commissionBonus: 5, contractDiscount: 5 },
  },
];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  scout: 'Recruteur',
  trainer: 'Entraîneur',
  lawyer: 'Juriste',
};

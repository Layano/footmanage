import type { LeagueTier } from './world';

export interface League {
  id: string;
  name: string;
  shortName: string;
  countryCode: string;
  countryName: string;
  tier: LeagueTier;
  /** Niveau de base du championnat (1 = elite mondiale, 5 = amateur). */
  level: number;
  reputation: number;
  seasonWeeks: number;
  transferWindows: {
    summer: { startWeek: number; endWeek: number };
    winter: { startWeek: number; endWeek: number };
  };
}

/** @deprecated Utiliser countryCode */
export type CountryCode = string;

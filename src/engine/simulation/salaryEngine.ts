import { GAME_CONFIG } from '@/constants/gameConfig';
import type { Club } from '@/types/club';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';

const TIER_MULTIPLIER: Record<string, number> = {
  pro_1: 1.4,
  pro_2: 1.0,
  pro_3: 0.55,
  pro_4: 0.3,
  junior: 0.12,
};

/** Note affichée 1–20 (échelle FM). */
export function overallToDisplay(overallRating: number): number {
  return Math.max(1, Math.min(20, Math.round(overallRating / 5)));
}

function isYouthOrAmateur(player: Player): boolean {
  const display = overallToDisplay(player.overallRating);
  return (
    player.age <= 18 ||
    display <= 9 ||
    (player.contract.clubId === null && player.marketValue < 80_000)
  );
}

/**
 * Estime le salaire mensuel d'un joueur selon son niveau, l'âge,
 * l'expérience et le club intéressé.
 */
export function estimateMonthlyWage(
  player: Player,
  club: Club,
  league?: League | null,
): number {
  const display = overallToDisplay(player.overallRating);
  const tier = league?.tier ?? 'pro_1';
  const tierMult = TIER_MULTIPLIER[tier] ?? 1;
  const repFactor = club.reputation / 100;

  if (isYouthOrAmateur(player)) {
    const base = 650 + display * 90;
    const clubBonus = Math.round(repFactor * 400);
    const experienceBonus =
      player.seasonMinutes > 300 ? Math.round(display * 25) : 0;
    const raw = (base + clubBonus + experienceBonus) * (0.7 + tierMult * 0.35);
    return Math.round(Math.max(800, Math.min(raw, 4_500)));
  }

  const ratingPower = Math.pow(display, 1.85);
  const baseMonthly = 1_200 + ratingPower * 55;
  const clubScale = 0.45 + repFactor * 1.8;
  const experienceMult =
    player.seasonMinutes > 900 ? 1.15 : player.seasonMinutes > 400 ? 1.08 : 1;

  const raw = baseMonthly * clubScale * tierMult * experienceMult;
  const cap = tier === 'pro_1' ? 180_000 : tier === 'pro_2' ? 80_000 : 35_000;
  return Math.round(Math.max(1_500, Math.min(raw, cap)));
}

/** Commission hebdomadaire de l'agence sur le salaire mensuel du joueur. */
export function weeklySalaryCommission(monthlyWage: number, commissionPercent: number): number {
  if (monthlyWage <= 0 || commissionPercent <= 0) return 0;
  return Math.round((monthlyWage * commissionPercent) / 100 / 4);
}

/** Migre un ancien salaire hebdomadaire aberrant vers un mensuel réaliste. */
export function migrateLegacyWage(
  legacyWeeklyWage: number,
  player: Player,
  club?: Club | null,
  league?: League | null,
): number {
  if (legacyWeeklyWage <= 0) return 0;
  if (legacyWeeklyWage <= 500) {
    return Math.round(legacyWeeklyWage * 4);
  }
  if (club) {
    return estimateMonthlyWage(player, club, league);
  }
  return Math.round(legacyWeeklyWage / 4);
}

import type { Staff } from '../../types/staff';
import { GAME_CONFIG } from '../../constants/gameConfig';

export interface WeeklyEconomyResult {
  staffCost: number;
  operatingCost: number;
  commissionIncome: number;
  totalExpense: number;
  netChange: number;
}

/** Calcule les flux financiers hebdomadaires de l'agence. */
export function processWeeklyEconomy(
  staff: Staff[],
  operatingCostsMonthly: number,
): WeeklyEconomyResult {
  const staffCost = staff.reduce((sum, member) => sum + member.weeklySalary, 0);
  const operatingCost = Math.round(operatingCostsMonthly / 4);

  // Placeholder commissions : petites commissions aléatoires en attendant le moteur mercato complet.
  const commissionIncome =
    Math.random() < GAME_CONFIG.RANDOM_COMMISSION_CHANCE
      ? GAME_CONFIG.RANDOM_COMMISSION_AMOUNT
      : 0;

  const totalExpense = staffCost + operatingCost;
  const netChange = commissionIncome - totalExpense;

  return {
    staffCost,
    operatingCost,
    commissionIncome,
    totalExpense,
    netChange,
  };
}

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
  clients: import('../../types/player').Player[] = [],
): WeeklyEconomyResult {
  const staffCost = staff.reduce((sum, member) => sum + member.weeklySalary, 0);
  const operatingCost = Math.round(operatingCostsMonthly / 4);

  const clientCommissions = clients.reduce((sum, player) => {
    const rate = player.representationContract?.salaryCommissionPercent ?? 0;
    const wage = player.contract.weeklyWage;
    if (rate <= 0 || wage <= 0) return sum;
    return sum + Math.round((wage * rate) / 100);
  }, 0);

  const randomCommission =
    Math.random() < GAME_CONFIG.RANDOM_COMMISSION_CHANCE
      ? GAME_CONFIG.RANDOM_COMMISSION_AMOUNT
      : 0;

  const commissionIncome = clientCommissions + randomCommission;

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

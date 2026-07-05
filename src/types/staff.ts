export type StaffRole = 'scout' | 'lawyer' | 'trainer';

export interface StaffBonuses {
  discoveryRange?: number;
  potentialRevealBonus?: number;
  commissionBonus?: number;
  contractDiscount?: number;
  evolutionBonus?: number;
  moraleBonus?: number;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  level: number;
  weeklySalary: number;
  bonuses: StaffBonuses;
  hiredAt: string;
}

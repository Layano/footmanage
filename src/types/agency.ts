import type { Staff } from './staff';

export interface AgencyFinances {
  balance: number;
  totalRevenue: number;
  totalExpenses: number;
  commissionRate: number;
  operatingCosts: number;
}

export interface Agency {
  id: string;
  name: string;
  reputation: number;
  foundedYear: number;
  finances: AgencyFinances;
  staff: Staff[];
  clientPlayerIds: string[];
  maxClients: number;
  office: {
    city: string;
    country: string;
    level: number;
  };
}

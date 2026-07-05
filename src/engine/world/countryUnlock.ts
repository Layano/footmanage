import type { FootballCountry } from '@/types/world';

export function getUnlockCost(country: FootballCountry, alreadyUnlockedCount: number): number {
  const tierBase =
    country.tier === 'elite' ? 18_000 : country.tier === 'major' ? 10_000 : 5_000;
  return tierBase + alreadyUnlockedCount * 2_500;
}

export function getUnlockReputationRequired(country: FootballCountry): number {
  if (country.tier === 'elite') return 30;
  if (country.tier === 'major') return 18;
  return 8;
}

export function canUnlockCountry(
  country: FootballCountry,
  agencyCountryCode: string,
  unlockedCodes: string[],
  budget: number,
  reputation: number,
): { allowed: boolean; reason?: string; cost?: number } {
  if (country.code === agencyCountryCode) {
    return { allowed: false, reason: 'Pays d\'origine déjà actif.' };
  }
  if (unlockedCodes.includes(country.code)) {
    return { allowed: false, reason: 'Ce pays est déjà débloqué.' };
  }

  const cost = getUnlockCost(country, unlockedCodes.length);
  const repRequired = getUnlockReputationRequired(country);

  if (reputation < repRequired) {
    return {
      allowed: false,
      reason: `Réputation insuffisante (${reputation}/${repRequired}).`,
      cost,
    };
  }
  if (budget < cost) {
    return {
      allowed: false,
      reason: `Budget insuffisant (${budget.toLocaleString('fr-FR')} € / ${cost.toLocaleString('fr-FR')} €).`,
      cost,
    };
  }

  return { allowed: true, cost };
}

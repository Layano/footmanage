import type { CountryFootballTier, FootballCountry } from '@/types/world';

/**
 * Tous les pays disposant d'un championnat de football organisé.
 * elite = 5 ligues · major = 3 ligues · standard = 2 ligues (pro + junior)
 */
export const FOOTBALL_COUNTRIES: FootballCountry[] = [
  // ── Elite (5 ligues) ──────────────────────────────────────────────────────
  { code: 'ENG', name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', tier: 'elite', defaultCity: 'Londres' },
  { code: 'ESP', name: 'Espagne', flag: '🇪🇸', tier: 'elite', defaultCity: 'Madrid' },
  { code: 'GER', name: 'Allemagne', flag: '🇩🇪', tier: 'elite', defaultCity: 'Berlin' },
  { code: 'ITA', name: 'Italie', flag: '🇮🇹', tier: 'elite', defaultCity: 'Milan' },
  { code: 'FRA', name: 'France', flag: '🇫🇷', tier: 'elite', defaultCity: 'Paris' },

  // ── Major (3 ligues) ──────────────────────────────────────────────────────
  { code: 'NED', name: 'Pays-Bas', flag: '🇳🇱', tier: 'major', defaultCity: 'Amsterdam' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', tier: 'major', defaultCity: 'Lisbonne' },
  { code: 'BEL', name: 'Belgique', flag: '🇧🇪', tier: 'major', defaultCity: 'Bruxelles' },
  { code: 'TUR', name: 'Turquie', flag: '🇹🇷', tier: 'major', defaultCity: 'Istanbul' },
  { code: 'BRA', name: 'Brésil', flag: '🇧🇷', tier: 'major', defaultCity: 'São Paulo' },
  { code: 'ARG', name: 'Argentine', flag: '🇦🇷', tier: 'major', defaultCity: 'Buenos Aires' },
  { code: 'USA', name: 'États-Unis', flag: '🇺🇸', tier: 'major', defaultCity: 'New York' },
  { code: 'MEX', name: 'Mexique', flag: '🇲🇽', tier: 'major', defaultCity: 'Mexico' },
  { code: 'RUS', name: 'Russie', flag: '🇷🇺', tier: 'major', defaultCity: 'Moscou' },
  { code: 'UKR', name: 'Ukraine', flag: '🇺🇦', tier: 'major', defaultCity: 'Kyiv' },

  // ── Standard (2 ligues : pro + junior) ────────────────────────────────────
  { code: 'ALG', name: 'Algérie', flag: '🇩🇿', tier: 'standard', defaultCity: 'Alger' },
  { code: 'MAR', name: 'Maroc', flag: '🇲🇦', tier: 'standard', defaultCity: 'Casablanca' },
  { code: 'TUN', name: 'Tunisie', flag: '🇹🇳', tier: 'standard', defaultCity: 'Tunis' },
  { code: 'EGY', name: 'Égypte', flag: '🇪🇬', tier: 'standard', defaultCity: 'Le Caire' },
  { code: 'SEN', name: 'Sénégal', flag: '🇸🇳', tier: 'standard', defaultCity: 'Dakar' },
  { code: 'CIV', name: "Côte d'Ivoire", flag: '🇨🇮', tier: 'standard', defaultCity: 'Abidjan' },
  { code: 'NGA', name: 'Nigeria', flag: '🇳🇬', tier: 'standard', defaultCity: 'Lagos' },
  { code: 'CMR', name: 'Cameroun', flag: '🇨🇲', tier: 'standard', defaultCity: 'Douala' },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭', tier: 'standard', defaultCity: 'Accra' },
  { code: 'RSA', name: 'Afrique du Sud', flag: '🇿🇦', tier: 'standard', defaultCity: 'Johannesburg' },
  { code: 'JPN', name: 'Japon', flag: '🇯🇵', tier: 'standard', defaultCity: 'Tokyo' },
  { code: 'KOR', name: 'Corée du Sud', flag: '🇰🇷', tier: 'standard', defaultCity: 'Séoul' },
  { code: 'CHN', name: 'Chine', flag: '🇨🇳', tier: 'standard', defaultCity: 'Shanghai' },
  { code: 'AUS', name: 'Australie', flag: '🇦🇺', tier: 'standard', defaultCity: 'Sydney' },
  { code: 'KSA', name: 'Arabie Saoudite', flag: '🇸🇦', tier: 'standard', defaultCity: 'Riyad' },
  { code: 'IRN', name: 'Iran', flag: '🇮🇷', tier: 'standard', defaultCity: 'Téhéran' },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦', tier: 'standard', defaultCity: 'Doha' },
  { code: 'UAE', name: 'Émirats Arabes Unis', flag: '🇦🇪', tier: 'standard', defaultCity: 'Dubaï' },
  { code: 'SCO', name: 'Écosse', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', tier: 'standard', defaultCity: 'Glasgow' },
  { code: 'AUT', name: 'Autriche', flag: '🇦🇹', tier: 'standard', defaultCity: 'Vienne' },
  { code: 'SUI', name: 'Suisse', flag: '🇨🇭', tier: 'standard', defaultCity: 'Zurich' },
  { code: 'GRE', name: 'Grèce', flag: '🇬🇷', tier: 'standard', defaultCity: 'Athènes' },
  { code: 'CZE', name: 'République Tchèque', flag: '🇨🇿', tier: 'standard', defaultCity: 'Prague' },
  { code: 'POL', name: 'Pologne', flag: '🇵🇱', tier: 'standard', defaultCity: 'Varsovie' },
  { code: 'SWE', name: 'Suède', flag: '🇸🇪', tier: 'standard', defaultCity: 'Stockholm' },
  { code: 'NOR', name: 'Norvège', flag: '🇳🇴', tier: 'standard', defaultCity: 'Oslo' },
  { code: 'DEN', name: 'Danemark', flag: '🇩🇰', tier: 'standard', defaultCity: 'Copenhague' },
  { code: 'CRO', name: 'Croatie', flag: '🇭🇷', tier: 'standard', defaultCity: 'Zagreb' },
  { code: 'SRB', name: 'Serbie', flag: '🇷🇸', tier: 'standard', defaultCity: 'Belgrade' },
  { code: 'ROU', name: 'Roumanie', flag: '🇷🇴', tier: 'standard', defaultCity: 'Bucarest' },
  { code: 'HUN', name: 'Hongrie', flag: '🇭🇺', tier: 'standard', defaultCity: 'Budapest' },
  { code: 'ISR', name: 'Israël', flag: '🇮🇱', tier: 'standard', defaultCity: 'Tel Aviv' },
  { code: 'CHI', name: 'Chili', flag: '🇨🇱', tier: 'standard', defaultCity: 'Santiago' },
  { code: 'COL', name: 'Colombie', flag: '🇨🇴', tier: 'standard', defaultCity: 'Bogotá' },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾', tier: 'standard', defaultCity: 'Montevideo' },
  { code: 'PER', name: 'Pérou', flag: '🇵🇪', tier: 'standard', defaultCity: 'Lima' },
  { code: 'ECU', name: 'Équateur', flag: '🇪🇨', tier: 'standard', defaultCity: 'Quito' },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾', tier: 'standard', defaultCity: 'Asunción' },
  { code: 'CRC', name: 'Costa Rica', flag: '🇨🇷', tier: 'standard', defaultCity: 'San José' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', tier: 'standard', defaultCity: 'Toronto' },
  { code: 'IRL', name: 'Irlande', flag: '🇮🇪', tier: 'standard', defaultCity: 'Dublin' },
  { code: 'FIN', name: 'Finlande', flag: '🇫🇮', tier: 'standard', defaultCity: 'Helsinki' },
  { code: 'SVK', name: 'Slovaquie', flag: '🇸🇰', tier: 'standard', defaultCity: 'Bratislava' },
  { code: 'SVN', name: 'Slovénie', flag: '🇸🇮', tier: 'standard', defaultCity: 'Ljubljana' },
  { code: 'BUL', name: 'Bulgarie', flag: '🇧🇬', tier: 'standard', defaultCity: 'Sofia' },
  { code: 'BIH', name: 'Bosnie-Herzégovine', flag: '🇧🇦', tier: 'standard', defaultCity: 'Sarajevo' },
  { code: 'ISL', name: 'Islande', flag: '🇮🇸', tier: 'standard', defaultCity: 'Reykjavik' },
];

export function getCountryByCode(code: string): FootballCountry | undefined {
  return FOOTBALL_COUNTRIES.find((c) => c.code === code);
}

export function getLeagueCountForTier(tier: CountryFootballTier): number {
  switch (tier) {
    case 'elite':
      return 5;
    case 'major':
      return 3;
    case 'standard':
      return 2;
  }
}

export function getLeagueTiersForCountry(tier: CountryFootballTier): import('@/types/world').LeagueTier[] {
  switch (tier) {
    case 'elite':
      return ['pro_1', 'pro_2', 'pro_3', 'pro_4', 'junior'];
    case 'major':
      return ['pro_1', 'pro_2', 'junior'];
    case 'standard':
      return ['pro_1', 'junior'];
  }
}

export const LEAGUE_TIER_LABELS: Record<import('@/types/world').LeagueTier, string> = {
  pro_1: 'Division 1',
  pro_2: 'Division 2',
  pro_3: 'Division 3',
  pro_4: 'Division 4',
  pro_5: 'Division 5',
  junior: 'Ligue Junior',
};

export const LEAGUE_TIER_LEVEL: Record<import('@/types/world').LeagueTier, number> = {
  pro_1: 1,
  pro_2: 2,
  pro_3: 3,
  pro_4: 4,
  pro_5: 5,
  junior: 4,
};

export const LEAGUE_TIER_REPUTATION: Record<import('@/types/world').LeagueTier, number> = {
  pro_1: 85,
  pro_2: 68,
  pro_3: 52,
  pro_4: 38,
  pro_5: 28,
  junior: 25,
};

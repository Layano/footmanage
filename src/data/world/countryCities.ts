import { getCountryByCode } from '@/data/world/countries';

/** Villes hôtes des tournois de quartier par pays. */
const COUNTRY_CITIES: Record<string, string[]> = {
  FRA: ['Paris', 'Lyon', 'Marseille', 'Lille', 'Bordeaux', 'Toulouse', 'Nantes', 'Nice', 'Strasbourg', 'Montpellier'],
  ENG: ['Londres', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds', 'Newcastle', 'Brighton', 'Nottingham'],
  ESP: ['Madrid', 'Barcelone', 'Séville', 'Valence', 'Bilbao', 'Malaga', 'Saragosse'],
  GER: ['Berlin', 'Munich', 'Hambourg', 'Cologne', 'Francfort', 'Dortmund', 'Stuttgart'],
  ITA: ['Milan', 'Rome', 'Turin', 'Naples', 'Florence', 'Bologne', 'Gênes'],
  NED: ['Amsterdam', 'Rotterdam', 'Eindhoven', 'Utrecht', 'La Haye', 'Groningue'],
  POR: ['Lisbonne', 'Porto', 'Braga', 'Coimbra', 'Faro'],
  BEL: ['Bruxelles', 'Anvers', 'Gand', 'Liège', 'Charleroi'],
  BRA: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Salvador', 'Recife'],
  ARG: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'],
  USA: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Dallas', 'Atlanta'],
  MEX: ['Mexico', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana'],
};

function buildFallbackCities(defaultCity: string): string[] {
  return [
    defaultCity,
    `${defaultCity} Nord`,
    `${defaultCity} Sud`,
    `${defaultCity} Est`,
    `${defaultCity} Ouest`,
    `Grand ${defaultCity}`,
  ];
}

export function getCitiesForCountry(countryCode: string): string[] {
  const country = getCountryByCode(countryCode);
  const fallback = country?.defaultCity ?? 'Capital';
  return COUNTRY_CITIES[countryCode] ?? buildFallbackCities(fallback);
}

/** Sélectionne la ville du tournoi pour une semaine (déterministe). */
export function pickTournamentCity(
  week: number,
  season: number,
  countryCode: string,
  preferredCity?: string,
): string {
  const cities = getCitiesForCountry(countryCode);
  if (preferredCity && cities.includes(preferredCity)) {
    return preferredCity;
  }
  const index = (week + season * 11) % cities.length;
  return cities[index]!;
}

/** Indice de distance approximatif entre deux villes d'un même pays. */
export function getCityDistanceIndex(
  fromCity: string,
  toCity: string,
  countryCode: string,
): number {
  if (fromCity === toCity) return 0;
  const cities = getCitiesForCountry(countryCode);
  const fromIdx = cities.indexOf(fromCity);
  const toIdx = cities.indexOf(toCity);
  if (fromIdx < 0 || toIdx < 0) return 2;
  return Math.abs(fromIdx - toIdx);
}

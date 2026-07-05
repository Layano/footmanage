import { getCountryByCode } from '@/data/world/countries';

/** Villes hôtes des tournois de quartier et noms de clubs par pays. */
const COUNTRY_CITIES: Record<string, string[]> = {
  FRA: ['Paris', 'Lyon', 'Marseille', 'Lille', 'Bordeaux', 'Toulouse', 'Nantes', 'Nice', 'Strasbourg', 'Montpellier', 'Rennes', 'Reims'],
  ENG: ['Londres', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds', 'Newcastle', 'Brighton', 'Nottingham', 'Sheffield', 'Bristol'],
  ESP: ['Madrid', 'Barcelone', 'Séville', 'Valence', 'Bilbao', 'Malaga', 'Saragosse', 'Grenade', 'Vigo', 'La Corogne'],
  GER: ['Berlin', 'Munich', 'Hambourg', 'Cologne', 'Francfort', 'Dortmund', 'Stuttgart', 'Leipzig', 'Brême', 'Hanovre'],
  ITA: ['Milan', 'Rome', 'Turin', 'Naples', 'Florence', 'Bologne', 'Gênes', 'Palerme', 'Vérone', 'Bari'],
  NED: ['Amsterdam', 'Rotterdam', 'Eindhoven', 'Utrecht', 'La Haye', 'Groningue', 'Arnhem', 'Tilburg'],
  POR: ['Lisbonne', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Setúbal', 'Guimarães'],
  BEL: ['Bruxelles', 'Anvers', 'Gand', 'Liège', 'Charleroi', 'Bruges', 'Louvain'],
  TUR: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Trabzon'],
  BRA: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Salvador', 'Recife', 'Curitiba', 'Fortaleza'],
  ARG: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Tucumán'],
  USA: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Dallas', 'Atlanta', 'Seattle', 'Boston'],
  MEX: ['Mexico', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León'],
  RUS: ['Moscou', 'Saint-Pétersbourg', 'Kazan', 'Sotchi', 'Rostov'],
  UKR: ['Kyiv', 'Lviv', 'Odessa', 'Kharkiv', 'Dnipro'],
  MAR: ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir'],
  ALG: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif'],
  SEN: ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack'],
  CIV: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo'],
  JPN: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Kobe'],
  KOR: ['Séoul', 'Busan', 'Incheon', 'Daegu', 'Suwon'],
};

function buildFallbackCities(defaultCity: string): string[] {
  return [
    defaultCity,
    `${defaultCity} Nord`,
    `${defaultCity} Sud`,
    `${defaultCity} Est`,
    `${defaultCity} Ouest`,
    `Grand ${defaultCity}`,
    `${defaultCity} Centre`,
    `Vieux ${defaultCity}`,
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

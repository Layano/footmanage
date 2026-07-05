import type { Confederation } from '@/types/competition';

/** Confédération continentale par code pays. */
export const COUNTRY_CONFEDERATION: Record<string, Confederation> = {
  ENG: 'UEFA',
  ESP: 'UEFA',
  GER: 'UEFA',
  ITA: 'UEFA',
  FRA: 'UEFA',
  NED: 'UEFA',
  POR: 'UEFA',
  BEL: 'UEFA',
  TUR: 'UEFA',
  RUS: 'UEFA',
  UKR: 'UEFA',
  SCO: 'UEFA',
  AUT: 'UEFA',
  SUI: 'UEFA',
  GRE: 'UEFA',
  CZE: 'UEFA',
  POL: 'UEFA',
  SWE: 'UEFA',
  NOR: 'UEFA',
  DEN: 'UEFA',
  CRO: 'UEFA',
  SRB: 'UEFA',
  ROU: 'UEFA',
  HUN: 'UEFA',
  ISR: 'UEFA',
  IRL: 'UEFA',
  FIN: 'UEFA',
  SVK: 'UEFA',
  SVN: 'UEFA',
  BUL: 'UEFA',
  BIH: 'UEFA',
  ISL: 'UEFA',
  BRA: 'CONMEBOL',
  ARG: 'CONMEBOL',
  CHI: 'CONMEBOL',
  COL: 'CONMEBOL',
  URU: 'CONMEBOL',
  PER: 'CONMEBOL',
  ECU: 'CONMEBOL',
  PAR: 'CONMEBOL',
  USA: 'CONCACAF',
  MEX: 'CONCACAF',
  CRC: 'CONCACAF',
  CAN: 'CONCACAF',
  ALG: 'CAF',
  MAR: 'CAF',
  TUN: 'CAF',
  EGY: 'CAF',
  SEN: 'CAF',
  CIV: 'CAF',
  NGA: 'CAF',
  CMR: 'CAF',
  GHA: 'CAF',
  RSA: 'CAF',
  JPN: 'AFC',
  KOR: 'AFC',
  CHN: 'AFC',
  AUS: 'AFC',
  KSA: 'AFC',
  IRN: 'AFC',
  QAT: 'AFC',
  UAE: 'AFC',
};

export const CONTINENTAL_COMPETITIONS: Record<
  Confederation,
  { champions: string; secondary?: string }
> = {
  UEFA: { champions: 'Ligue des Champions', secondary: 'Ligue Europa' },
  CONMEBOL: { champions: 'Copa Libertadores', secondary: 'Copa Sudamericana' },
  CONCACAF: { champions: 'Ligue des Champions CONCACAF' },
  CAF: { champions: 'Ligue des Champions CAF', secondary: 'Coupe de la CAF' },
  AFC: { champions: "Ligue des Champions d'Asie", secondary: "Coupe de l'AFC" },
  OFC: { champions: "Ligue des Champions d'Océanie" },
};

const DOMESTIC_CUP_NAMES: Record<string, string> = {
  FRA: 'Coupe de France',
  ENG: 'FA Cup',
  ESP: 'Copa del Rey',
  GER: 'DFB-Pokal',
  ITA: 'Coppa Italia',
  NED: 'Coupe des Pays-Bas',
  POR: 'Coupe du Portugal',
  BEL: 'Coupe de Belgique',
  TUR: 'Coupe de Turquie',
  BRA: 'Copa do Brasil',
  ARG: 'Copa Argentina',
  USA: 'US Open Cup',
  MEX: 'Copa MX',
  JPN: 'Coupe du Japon',
  KOR: 'Coupe de Corée',
  ALG: "Coupe d'Algérie",
  MAR: 'Coupe du Maroc',
  SEN: 'Coupe du Sénégal',
  RSA: "Coupe d'Afrique du Sud",
};

export function getConfederation(countryCode: string): Confederation {
  return COUNTRY_CONFEDERATION[countryCode] ?? 'UEFA';
}

export function getDomesticCupName(countryCode: string, countryName: string): string {
  return DOMESTIC_CUP_NAMES[countryCode] ?? `Coupe ${countryName}`;
}

export function getContinentalChampionsName(confederation: Confederation): string {
  return CONTINENTAL_COMPETITIONS[confederation].champions;
}

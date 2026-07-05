import { getCountryByCode } from '@/data/world/countries';

const UNIVERSAL_FIRST = [
  'Lucas', 'Noah', 'Ethan', 'Marco', 'Diego', 'Omar', 'Kenji', 'Pierre', 'Carlos', 'Ivan',
  'Sven', 'Amir', 'João', 'Luis', 'Hugo', 'Max', 'Leo', 'Tom', 'Axel', 'Rayan',
];
const UNIVERSAL_LAST = [
  'Martin', 'Silva', 'Garcia', 'Müller', 'Rossi', 'Dubois', 'Santos', 'Kowalski', 'Nielsen',
  'Petit', 'Costa', 'Fernandez', 'Schmidt', 'Moreau', 'Alves', 'Johansson', 'Diallo', 'Popov',
];

const REGIONAL_NAMES: Record<string, { first: string[]; last: string[] }> = {
  FRA: {
    first: ['Lucas', 'Noah', 'Yanis', 'Tom', 'Axel', 'Rayan', 'Nolan', 'Léo', 'Maël', 'Hugo'],
    last: ['Martin', 'Bernard', 'Petit', 'Robert', 'Richard', 'Durand', 'Moreau', 'Simon', 'Laurent', 'Garcia'],
  },
  ENG: {
    first: ['Jack', 'Harry', 'Oliver', 'George', 'Charlie', 'James', 'William', 'Thomas', 'Henry', 'Leo'],
    last: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Johnson'],
  },
  ESP: {
    first: ['Pablo', 'Hugo', 'Martín', 'Lucas', 'Mateo', 'Leo', 'Daniel', 'Alejandro', 'Diego', 'Álvaro'],
    last: ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Pérez', 'González', 'Fernández', 'Ruiz', 'Torres'],
  },
  GER: {
    first: ['Leon', 'Paul', 'Ben', 'Finn', 'Noah', 'Elias', 'Jonas', 'Felix', 'Luis', 'Max'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Koch'],
  },
  ITA: {
    first: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Riccardo', 'Tommaso', 'Edoardo'],
    last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'],
  },
  BRA: {
    first: ['Gabriel', 'Lucas', 'Matheus', 'Pedro', 'João', 'Guilherme', 'Rafael', 'Felipe', 'Bruno', 'Thiago'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida'],
  },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickAmateurName(countryCode: string): { firstName: string; lastName: string } {
  const pool = REGIONAL_NAMES[countryCode] ?? { first: UNIVERSAL_FIRST, last: UNIVERSAL_LAST };
  return {
    firstName: pool.first[randomInt(0, pool.first.length - 1)]!,
    lastName: pool.last[randomInt(0, pool.last.length - 1)]!,
  };
}

export function buildJuniorClubLabel(city: string, age: number): string {
  const ageGroup = age <= 16 ? 'U16' : 'U17';
  const prefixes = ['AS', 'FC', 'US', 'Olympique', 'Entente'];
  const prefix = prefixes[randomInt(0, prefixes.length - 1)];
  return `${prefix} ${city} ${ageGroup}`;
}

export function getAmateurNationality(countryCode: string): string {
  return getCountryByCode(countryCode)?.name ?? countryCode;
}

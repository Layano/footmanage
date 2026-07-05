import { calculateOverallRating } from '../players/ratingEngine';
import {
  buildJuniorClubLabel,
  getAmateurNationality,
  pickAmateurName,
} from '../../data/world/amateurPools';
import { GAME_CONFIG } from '../../constants/gameConfig';
import type { OutfieldPlayerAttributes } from '../../types/attributes';
import type { OutfieldPlayer } from '../../types/player';
import type { PlayerPosition } from '../../types/positions';

const POSITIONS: Exclude<PlayerPosition, 'GK'>[] = ['ST', 'WING', 'AM', 'DM', 'CB', 'FB'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStat(): number {
  return randomInt(GAME_CONFIG.AMATEUR_STAT_MIN, GAME_CONFIG.AMATEUR_STAT_MAX);
}

function buildAmateurAttributes(): OutfieldPlayerAttributes {
  return {
    physical: {
      speed: randomStat(),
      acceleration: randomStat(),
      endurance: randomStat(),
      strength: randomStat(),
      agility: randomStat(),
    },
    technical: {
      shooting: randomStat(),
      passing: randomStat(),
      dribbling: randomStat(),
      control: randomStat(),
      crossing: randomStat(),
      tackling: randomStat(),
      marking: randomStat(),
    },
    mental: {
      determination: randomStat(),
      vision: randomStat(),
      composure: randomStat(),
      positioning: randomStat(),
      workRate: randomStat(),
    },
  };
}

/** Convertit un potentiel affiché (8–15) vers l'échelle interne 1–99. */
function potentialDisplayToRating(display: number): number {
  return Math.round((display / 20) * 98) + 1;
}

export interface AmateurGenerationOptions {
  countryCode: string;
  tournamentCity: string;
}

/**
 * Génère des jeunes amateurs repérés lors d'un tournoi de quartier.
 * Les joueurs sont du pays de l'agence et proviennent de la ville du tournoi.
 */
export function generateNeighborhoodAmateurs(
  week: number,
  season: number,
  options: AmateurGenerationOptions,
): OutfieldPlayer[] {
  const { countryCode, tournamentCity } = options;
  const nationality = getAmateurNationality(countryCode);
  const gemIndex = randomInt(0, GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_PLAYERS - 1);

  return Array.from({ length: GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_PLAYERS }, (_, index) => {
    const { firstName, lastName } = pickAmateurName(countryCode);
    const position = POSITIONS[randomInt(0, POSITIONS.length - 1)];
    const age = randomInt(15, 17);
    const attributes = buildAmateurAttributes();
    const overallRating = calculateOverallRating(position, attributes);

    const isGem = index === gemIndex;
    const gemPotentialDisplay = randomInt(
      GAME_CONFIG.AMATEUR_GEM_POTENTIAL_MIN,
      GAME_CONFIG.AMATEUR_GEM_POTENTIAL_MAX,
    );
    const lowPotentialDisplay = randomInt(3, 6);
    const potentialDisplay = isGem ? gemPotentialDisplay : lowPotentialDisplay;
    const potentialRating = potentialDisplayToRating(potentialDisplay);

    const juniorClub = buildJuniorClubLabel(tournamentCity, age);
    const id = `amateur-${season}-${week}-${Date.now()}-${index}`;

    return {
      id,
      firstName,
      lastName,
      displayName: `${firstName.charAt(0)}. ${lastName}`,
      age,
      nationality,
      currentTeam: `${juniorClub} · Ligue Junior`,
      scoutedFromCity: tournamentCity,
      position,
      preferredFoot: Math.random() > 0.5 ? 'right' : 'left',
      attributes,
      overallRating,
      potentialRating,
      potential: {
        ceiling: potentialRating,
        revealedPercent: isGem ? 40 : 15,
      },
      marketValue: randomInt(5_000, 25_000),
      contract: {
        clubId: null,
        monthlyWage: 0,
        startDate: `${season}-01-01`,
        endDate: `${season}-12-31`,
      },
      status: 'free_agent',
      isClient: false,
      morale: randomInt(70, 90),
      form: randomInt(60, 75),
      seasonMinutes: 0,
      weeklyMinutes: 0,
    };
  });
}

/** Indique si un joueur est un amateur signable (tournoi de quartier). */
export function isNeighborhoodAmateur(player: { contract: { clubId: string | null }; age: number }): boolean {
  return player.contract.clubId === null && player.age <= 17;
}

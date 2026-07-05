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

function randomStat(min: number, max: number): number {
  return randomInt(min, max);
}

/** Les stats plafonnent selon l'âge : à 15 ans on est loin du niveau d'un 17 ans. */
function buildAmateurAttributes(age: number): OutfieldPlayerAttributes {
  const min = GAME_CONFIG.AMATEUR_STAT_MIN;
  const max = Math.max(min + 1, GAME_CONFIG.AMATEUR_STAT_MAX - (17 - age));
  return {
    physical: {
      speed: randomStat(min, max),
      acceleration: randomStat(min, max),
      endurance: randomStat(min, max),
      strength: randomStat(min, max),
      agility: randomStat(min, max),
    },
    technical: {
      shooting: randomStat(min, max),
      passing: randomStat(min, max),
      dribbling: randomStat(min, max),
      control: randomStat(min, max),
      crossing: randomStat(min, max),
      tackling: randomStat(min, max),
      marking: randomStat(min, max),
    },
    mental: {
      determination: randomStat(min, max),
      vision: randomStat(min, max),
      composure: randomStat(min, max),
      positioning: randomStat(min, max),
      workRate: randomStat(min, max),
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
    const attributes = buildAmateurAttributes(age);
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

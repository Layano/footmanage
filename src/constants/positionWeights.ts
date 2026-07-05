import type { PositionWeightMatrix } from './positions';

/**
 * Matrice de pondération par poste pour le calcul de la note globale.
 *
 * Exemple : le Tir (shooting) pèse 3.0 pour un Buteur (ST) mais 0.3 pour un Défenseur Central (CB).
 * Les coefficients sont relatifs ; le moteur de calcul normalise le résultat sur l'échelle 1–99.
 */
export const POSITION_ATTRIBUTE_WEIGHTS: PositionWeightMatrix = {
  GK: {
    reflexes: 3.0,
    diving: 3.0,
    positioning: 2.5,
    composure: 2.0,
    agility: 1.8,
    acceleration: 1.2,
    passing: 1.0,
    control: 0.8,
    strength: 1.0,
    speed: 0.5,
    endurance: 1.0,
    determination: 1.2,
    workRate: 0.5,
    vision: 0.8,
  },

  CB: {
    marking: 3.0,
    tackling: 3.0,
    positioning: 2.5,
    strength: 2.5,
    composure: 2.0,
    passing: 1.5,
    speed: 1.5,
    acceleration: 1.2,
    endurance: 1.5,
    determination: 1.5,
    workRate: 1.8,
    vision: 1.0,
    shooting: 0.3,
    dribbling: 0.5,
    crossing: 0.5,
    control: 1.2,
    agility: 1.0,
  },

  FB: {
    speed: 2.5,
    acceleration: 2.5,
    endurance: 2.5,
    crossing: 2.5,
    tackling: 2.0,
    marking: 2.0,
    dribbling: 1.8,
    passing: 1.8,
    workRate: 2.0,
    positioning: 1.8,
    control: 1.5,
    strength: 1.2,
    composure: 1.2,
    determination: 1.2,
    vision: 1.0,
    shooting: 0.5,
    agility: 1.5,
  },

  DM: {
    tackling: 3.0,
    marking: 2.5,
    passing: 2.5,
    positioning: 2.5,
    workRate: 2.5,
    endurance: 2.5,
    strength: 2.0,
    vision: 2.0,
    composure: 2.0,
    control: 1.8,
    determination: 1.8,
    speed: 1.2,
    acceleration: 1.0,
    dribbling: 1.0,
    shooting: 0.8,
    crossing: 0.5,
    agility: 1.0,
  },

  AM: {
    passing: 3.0,
    vision: 3.0,
    dribbling: 2.5,
    control: 2.5,
    shooting: 2.0,
    composure: 2.0,
    acceleration: 1.8,
    agility: 1.8,
    workRate: 1.5,
    positioning: 1.5,
    determination: 1.5,
    speed: 1.5,
    endurance: 1.5,
    crossing: 1.2,
    tackling: 0.8,
    marking: 0.5,
    strength: 0.8,
  },

  WING: {
    speed: 3.0,
    acceleration: 3.0,
    dribbling: 3.0,
    crossing: 2.5,
    agility: 2.5,
    endurance: 2.0,
    shooting: 1.8,
    passing: 1.5,
    control: 2.0,
    workRate: 1.5,
    composure: 1.2,
    positioning: 1.0,
    determination: 1.2,
    vision: 1.2,
    tackling: 0.5,
    marking: 0.3,
    strength: 0.8,
  },

  ST: {
    shooting: 3.0,
    composure: 2.5,
    positioning: 2.5,
    dribbling: 2.0,
    control: 2.0,
    acceleration: 2.0,
    speed: 2.0,
    strength: 2.0,
    agility: 1.5,
    passing: 1.0,
    vision: 1.0,
    determination: 1.5,
    workRate: 1.2,
    endurance: 1.2,
    tackling: 0.2,
    marking: 0.2,
    crossing: 0.5,
  },
};

/**
 * Convertit une moyenne pondérée d'attributs (1–20) vers la note globale affichée (1–99).
 * Formule : rating = round((weightedAvg / 20) * 98) + 1
 */
export function attributesToOverallRating(weightedAverage: number): number {
  const clamped = Math.max(1, Math.min(20, weightedAverage));
  return Math.round((clamped / 20) * 98) + 1;
}

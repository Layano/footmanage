import type { AttributeKey, PlayerAttributes } from '../types/attributes';
import type { PlayerPosition } from '../types/positions';
import {
  POSITION_ATTRIBUTE_WEIGHTS,
  attributesToOverallRating,
} from '../constants/positionWeights';

/** Aplatit tous les attributs d'un joueur en un dictionnaire clé → valeur. */
export function flattenAttributes(attributes: PlayerAttributes): Partial<Record<AttributeKey, number>> {
  return {
    ...attributes.physical,
    ...attributes.technical,
    ...attributes.mental,
  };
}

/**
 * Calcule la note globale (1–99) d'un joueur selon son poste et ses attributs détaillés (1–20).
 *
 * Le Tir (shooting) pèse par exemple 3.0 pour un Buteur (ST) mais 0.3 pour un CB.
 */
export function calculateOverallRating(
  position: PlayerPosition,
  attributes: PlayerAttributes,
): number {
  const flat = flattenAttributes(attributes);
  const weights = POSITION_ATTRIBUTE_WEIGHTS[position];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights) as [AttributeKey, number][]) {
    const value = flat[key];
    if (value !== undefined && weight > 0) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 1;

  const weightedAverage = weightedSum / totalWeight;
  return attributesToOverallRating(weightedAverage);
}

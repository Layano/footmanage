import type { AttributeKey, PlayerAttributes } from '../../types/attributes';
import type { Player } from '../../types/player';
import { calculateOverallRating } from '../players/ratingEngine';
import { GAME_CONFIG } from '../../constants/gameConfig';

function clampAttribute(value: number): number {
  return Math.max(1, Math.min(20, value));
}

function getAllAttributeKeys(attributes: PlayerAttributes): AttributeKey[] {
  return [
    ...Object.keys(attributes.physical),
    ...Object.keys(attributes.technical),
    ...Object.keys(attributes.mental),
  ] as AttributeKey[];
}

function mutateAttribute(
  attributes: PlayerAttributes,
  key: AttributeKey,
  delta: number,
): PlayerAttributes {
  const next = JSON.parse(JSON.stringify(attributes)) as PlayerAttributes;

  if (key in next.physical) {
    next.physical[key as keyof typeof next.physical] = clampAttribute(
      next.physical[key as keyof typeof next.physical] + delta,
    );
  } else if (key in next.technical) {
    next.technical[key as keyof typeof next.technical] = clampAttribute(
      next.technical[key as keyof typeof next.technical] + delta,
    );
  } else if (key in next.mental) {
    next.mental[key as keyof typeof next.mental] = clampAttribute(
      next.mental[key as keyof typeof next.mental] + delta,
    );
  }

  return next;
}

/**
 * Tente une évolution hebdomadaire d'un joueur.
 * Le temps de jeu augmente fortement les chances de progression.
 */
export function tryWeeklyPlayerEvolution(player: Player): Player {
  const minutesFactor = 1 + (player.weeklyMinutes / 90) * GAME_CONFIG.PLAYING_TIME_EVOLUTION_MULTIPLIER;
  const chance = GAME_CONFIG.PLAYER_EVOLUTION_CHANCE * minutesFactor;

  if (player.weeklyMinutes < GAME_CONFIG.MIN_MINUTES_FOR_EVOLUTION && player.age < GAME_CONFIG.YOUNG_AGE_THRESHOLD) {
    return { ...player, weeklyMinutes: 0 };
  }

  if (Math.random() > chance) {
    return { ...player, weeklyMinutes: 0 };
  }

  const isYoung = player.age < GAME_CONFIG.YOUNG_AGE_THRESHOLD;
  const isOld = player.age >= GAME_CONFIG.OLD_AGE_THRESHOLD;
  const hasRoomToGrow = player.overallRating < player.potentialRating;

  let delta = 0;
  if (isYoung && hasRoomToGrow) {
    delta = 1;
  } else if (isOld) {
    delta = -1;
  }

  if (delta === 0) {
    return { ...player, weeklyMinutes: 0 };
  }

  const keys = getAllAttributeKeys(player.attributes);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const newAttributes = mutateAttribute(player.attributes, randomKey, delta);
  const overallRating = calculateOverallRating(player.position, newAttributes);

  return {
    ...player,
    attributes: newAttributes,
    overallRating,
    marketValue: Math.round(player.marketValue * (delta > 0 ? 1.02 : 0.98)),
    weeklyMinutes: 0,
  } as Player;
}

/** Applique le vieillissement (+1 an) à un joueur. */
export function agePlayerByOneYear(player: Player): Player {
  return { ...player, age: player.age + 1 };
}

import { overallToDisplay } from '@/engine/players/potentialEstimate';
import type { MatchResult, MatchScoutProfile, PlayerMatchStat } from '@/types/match';
import type { Player } from '@/types/player';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Construit une fourchette d'estimation (ex. 3–8) contenant la vraie note. */
export function buildEstimatedRange(trueDisplay: number): { min: number; max: number } {
  const spread = randomInt(2, 4);
  let min = clamp(trueDisplay - spread, 3, 18);
  let max = clamp(trueDisplay + spread, min + 2, 20);

  if (trueDisplay < min) min = trueDisplay;
  if (trueDisplay > max) max = trueDisplay;

  if (max - min < 3) {
    max = Math.min(20, min + 3);
    if (trueDisplay > max) max = trueDisplay;
  }

  return { min, max };
}

function profileFromStat(
  stat: PlayerMatchStat,
  player: Player,
): MatchScoutProfile | null {
  if (stat.minutes < 10) return null;

  const trueDisplay = overallToDisplay(player.overallRating);
  const { min, max } = buildEstimatedRange(trueDisplay);

  return {
    playerId: player.id,
    clubId: player.contract.clubId ?? '',
    estimatedMin: min,
    estimatedMax: max,
    minutes: stat.minutes,
    goals: stat.goals,
    matchRating: stat.rating,
  };
}

/** Joueurs ayant joué le match et repérables par l'agence (hors clients). */
export function buildMatchScoutProfiles(
  result: MatchResult,
  players: Player[],
  excludePlayerIds: Set<string>,
): MatchScoutProfile[] {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const allStats = [...result.homeStats, ...result.awayStats];
  const profiles: MatchScoutProfile[] = [];
  const seen = new Set<string>();

  for (const stat of allStats) {
    if (seen.has(stat.playerId) || excludePlayerIds.has(stat.playerId)) continue;
    const player = playerMap.get(stat.playerId);
    if (!player || player.isClient) continue;

    const profile = profileFromStat(stat, player);
    if (!profile) continue;

    profiles.push(profile);
    seen.add(stat.playerId);
  }

  return profiles.sort((a, b) => b.minutes - a.minutes || b.goals - a.goals);
}

export function formatEstimatedRange(min: number, max: number): string {
  return min === max ? `${min}/20` : `${min} à ${max}/20`;
}

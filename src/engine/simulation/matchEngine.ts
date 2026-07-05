import {
  PLAYING_TIME_ROLE_MINUTES,
  type PlayingTimeRole,
} from '@/constants/playingTime';
import type { Club } from '@/types/club';
import type { GameMessage } from '@/types/game';
import type { MatchEvent, MatchFixture, MatchResult, MatchScoutProfile, PlayerMatchStat } from '@/types/match';
import type { Player } from '@/types/player';
import type { PlayerPosition } from '@/types/positions';
import { isGoalkeeper } from '@/types/player';
import { buildMatchScoutProfiles } from './matchScouting';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function teamStrength(players: Player[]): number {
  if (players.length === 0) return 40;
  const sorted = [...players].sort((a, b) => b.overallRating - a.overallRating);
  const xi = sorted.slice(0, 11);
  return xi.reduce((s, p) => s + p.overallRating, 0) / xi.length;
}

function pickOpponent(clubId: string, leagueId: string, clubs: Club[]): Club | null {
  const sameLeague = clubs.filter((c) => c.leagueId === leagueId && c.id !== clubId);
  if (sameLeague.length === 0) return null;
  return sameLeague[randomInt(0, sameLeague.length - 1)]!;
}

function assignMinutes(
  squad: Player[],
  clientId?: string,
  clientRole?: PlayingTimeRole,
): Map<string, number> {
  const minutes = new Map<string, number>();
  const sorted = [...squad].sort((a, b) => b.overallRating - a.overallRating);
  const starters = sorted.slice(0, 11);
  const subs = sorted.slice(11, 16);

  for (const p of starters) {
    if (clientId === p.id && clientRole) {
      const target = PLAYING_TIME_ROLE_MINUTES[clientRole];
      minutes.set(p.id, randomInt(Math.max(45, target - 8), Math.min(90, target + 5)));
    } else {
      minutes.set(p.id, randomInt(60, 90));
    }
  }
  for (const p of subs) {
    if (clientId === p.id && clientRole) {
      const target = PLAYING_TIME_ROLE_MINUTES[clientRole];
      minutes.set(p.id, randomInt(Math.max(10, target - 15), Math.min(60, target + 10)));
    } else {
      minutes.set(p.id, randomInt(5, 35));
    }
  }
  return minutes;
}

function pickWeighted<T>(items: T[], weights: number[]): T | null {
  if (items.length === 0) return null;
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return items[randomInt(0, items.length - 1)]!;
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function goalScorerWeight(position: PlayerPosition): number {
  switch (position) {
    case 'ST':
      return 6;
    case 'WING':
      return 4.5;
    case 'AM':
      return 3;
    case 'DM':
      return 1.2;
    case 'FB':
      return 1;
    case 'CB':
      return 0.7;
    default:
      return 1;
  }
}

function pickGoalScorer(squad: Player[], minutesMap: Map<string, number>): Player | null {
  const eligible = squad.filter((p) => (minutesMap.get(p.id) ?? 0) > 0 && !isGoalkeeper(p));
  if (eligible.length === 0) return null;
  const weights = eligible.map((p) => goalScorerWeight(p.position) * (1 + (minutesMap.get(p.id) ?? 0) / 90));
  return pickWeighted(eligible, weights);
}

function buildPlayerStats(
  squad: Player[],
  minutesMap: Map<string, number>,
  goalsMap: Map<string, number>,
): PlayerMatchStat[] {
  return squad
    .filter((p) => (minutesMap.get(p.id) ?? 0) > 0)
    .map((p) => {
      const mins = minutesMap.get(p.id) ?? 0;
      const goals = goalsMap.get(p.id) ?? 0;
      const rating = clamp(5.5 + (p.overallRating / 99) * 2 + goals * 0.8 + mins / 90, 5, 10);
      return {
        playerId: p.id,
        displayName: p.displayName,
        minutes: mins,
        goals,
        assists: 0,
        rating: Math.round(rating * 10) / 10,
        cleanSheet: isGoalkeeper(p) && goals === 0,
      };
    });
}

/** Simule un match complet et retourne le résultat. */
export function simulateMatch(
  homeClub: Club,
  awayClub: Club,
  homeSquad: Player[],
  awaySquad: Player[],
  clientPlayerId?: string,
  clientPlayingTimeRole?: PlayingTimeRole,
): MatchResult {
  const homeStr = teamStrength(homeSquad);
  const awayStr = teamStrength(awaySquad);
  const homeAdv = 1.08;
  const homeLambda = clamp((homeStr / 70) * homeAdv, 0.4, 2.8);
  const awayLambda = clamp(awayStr / 70, 0.4, 2.8);

  let homeScore = 0;
  let awayScore = 0;
  const events: MatchEvent[] = [
    {
      minute: 0,
      type: 'kickoff',
      teamSide: 'home',
      text: `Coup d'envoi ! ${homeClub.name} reçoit ${awayClub.name}.`,
    },
  ];

  const homeMinutes = assignMinutes(
    homeSquad,
    clientPlayerId,
    homeSquad.some((p) => p.id === clientPlayerId) ? clientPlayingTimeRole : undefined,
  );
  const awayMinutes = assignMinutes(
    awaySquad,
    clientPlayerId,
    awaySquad.some((p) => p.id === clientPlayerId) ? clientPlayingTimeRole : undefined,
  );
  const homeGoals = new Map<string, number>();
  const awayGoals = new Map<string, number>();

  const goalChanceHome = homeLambda / 30;
  const goalChanceAway = awayLambda / 30;

  for (let min = 1; min <= 90; min++) {
    if (min === 45) {
      events.push({
        minute: 45,
        type: 'halftime',
        teamSide: 'home',
        text: `Mi-temps : ${homeScore} - ${awayScore}`,
      });
    }

    if (Math.random() < goalChanceHome) {
      homeScore++;
      const scorer = pickGoalScorer(homeSquad, homeMinutes);
      if (scorer) {
        homeGoals.set(scorer.id, (homeGoals.get(scorer.id) ?? 0) + 1);
        events.push({
          minute: min,
          type: 'goal',
          teamSide: 'home',
          playerId: scorer.id,
          playerName: scorer.displayName,
          text: `⚽ ${min}' — But de ${scorer.displayName} (${homeClub.shortName}) !`,
        });
      } else {
        events.push({
          minute: min,
          type: 'goal',
          teamSide: 'home',
          text: `⚽ ${min}' — But pour ${homeClub.shortName} !`,
        });
      }
    } else if (Math.random() < goalChanceAway) {
      awayScore++;
      const scorer = pickGoalScorer(awaySquad, awayMinutes);
      if (scorer) {
        awayGoals.set(scorer.id, (awayGoals.get(scorer.id) ?? 0) + 1);
        events.push({
          minute: min,
          type: 'goal',
          teamSide: 'away',
          playerId: scorer.id,
          playerName: scorer.displayName,
          text: `⚽ ${min}' — But de ${scorer.displayName} (${awayClub.shortName}) !`,
        });
      } else {
        events.push({
          minute: min,
          type: 'goal',
          teamSide: 'away',
          text: `⚽ ${min}' — But pour ${awayClub.shortName} !`,
        });
      }
    } else if (Math.random() < 0.04) {
      const side = Math.random() > 0.5 ? 'home' : 'away';
      events.push({
        minute: min,
        type: 'chance',
        teamSide: side,
        text: `${min}' — Grosse occasion pour ${side === 'home' ? homeClub.shortName : awayClub.shortName} !`,
      });
    }
  }

  events.push({
    minute: 90,
    type: 'fulltime',
    teamSide: 'home',
    text: `Fin du match : ${homeClub.name} ${homeScore} - ${awayScore} ${awayClub.name}`,
  });

  return {
    homeScore,
    awayScore,
    events,
    homeStats: buildPlayerStats(homeSquad, homeMinutes, homeGoals),
    awayStats: buildPlayerStats(awaySquad, awayMinutes, awayGoals),
  };
}

/** Simule un match et prépare les profils de scouting. */
export function simulateMatchFixture(
  fixture: MatchFixture,
  homeClub: Club,
  awayClub: Club,
  homeSquad: Player[],
  awaySquad: Player[],
  myPlayerIds: Set<string>,
  clientPlayingTimeRole?: import('@/constants/playingTime').PlayingTimeRole,
): { result: MatchResult; scoutProfiles: MatchScoutProfile[] } {
  const result = simulateMatch(
    homeClub,
    awayClub,
    homeSquad,
    awaySquad,
    fixture.clientPlayerId,
    clientPlayingTimeRole,
  );

  const allPlayers = [...homeSquad, ...awaySquad];
  const scoutProfiles = buildMatchScoutProfiles(result, allPlayers, myPlayerIds);

  return { result, scoutProfiles };
}

/** Applique les minutes et la forme après un match (assisté ou auto-simulé). */
export function applyMatchResultToPlayers(
  fixture: MatchFixture,
  myPlayers: Player[],
  worldPlayers: Player[],
): { myPlayers: Player[]; worldPlayers: Player[] } {
  if (!fixture.result) return { myPlayers, worldPlayers };

  const allStats = [...fixture.result.homeStats, ...fixture.result.awayStats];
  const clientStat = allStats.find((s) => s.playerId === fixture.clientPlayerId);

  const nextMyPlayers = myPlayers.map((p) => {
    if (p.id !== fixture.clientPlayerId) return p;
    const mins = clientStat?.minutes ?? 0;
    return {
      ...p,
      weeklyMinutes: mins,
      seasonMinutes: p.seasonMinutes + mins,
      form: Math.min(100, p.form + (clientStat && clientStat.rating >= 7 ? 2 : -1)),
    };
  });

  const nextWorldPlayers = worldPlayers.map((p) => {
    const stat = allStats.find((s) => s.playerId === p.id);
    if (!stat) return p;
    return {
      ...p,
      weeklyMinutes: stat.minutes,
      seasonMinutes: p.seasonMinutes + stat.minutes,
    };
  });

  return { myPlayers: nextMyPlayers, worldPlayers: nextWorldPlayers };
}

export function createMatchSkippedMessage(
  fixture: MatchFixture,
  home: Club,
  away: Club,
  client: Player,
  scoutCount: number,
): GameMessage {
  const score = fixture.result
    ? `${fixture.result.homeScore} - ${fixture.result.awayScore}`
    : '? - ?';

  return {
    id: `msg-match-skipped-${fixture.id}`,
    type: 'match',
    title: `Résultat — ${home.shortName} ${score} ${away.shortName}`,
    body: `Vous n'avez pas assisté au match de ${client.displayName}. ${scoutCount} joueur${scoutCount > 1 ? 's' : ''} à observer dans les équipes ayant joué.`,
    week: fixture.week,
    season: fixture.season,
    createdAt: new Date().toISOString(),
    read: false,
    playerId: client.id,
    action: 'match_scout',
    matchId: fixture.id,
  };
}

/** Crée une invitation match pour un client sous contrat club. */
export function createMatchInvite(
  client: Player,
  clubs: Club[],
  allPlayers: Player[],
  week: number,
  season: number,
): MatchFixture | null {
  const clubId = client.contract.clubId;
  if (!clubId) return null;

  const homeClub = clubs.find((c) => c.id === clubId);
  if (!homeClub) return null;

  const awayClub = pickOpponent(clubId, homeClub.leagueId, clubs);
  if (!awayClub) return null;

  return {
    id: `match-${season}-${week}-${client.id}`,
    homeClubId: homeClub.id,
    awayClubId: awayClub.id,
    week,
    season,
    clientPlayerId: client.id,
    status: 'scheduled',
  };
}

export function getClubSquad(clubId: string, players: Player[]): Player[] {
  return players.filter((p) => p.contract.clubId === clubId);
}

export function createMatchInviteMessage(fixture: MatchFixture, home: Club, away: Club, client: Player) {
  return {
    id: `msg-match-${fixture.id}`,
    type: 'match' as const,
    title: `Invitation match — ${home.shortName} vs ${away.shortName}`,
    body: `${client.displayName} joue avec ${home.name}. Assistez au match ou il sera simulé automatiquement la semaine suivante.`,
    week: fixture.week,
    season: fixture.season,
    createdAt: new Date().toISOString(),
    read: false,
    playerId: client.id,
    action: 'match_invite' as const,
    matchId: fixture.id,
  };
}

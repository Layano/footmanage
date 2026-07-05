import {
  PLAYING_TIME_ROLE_MINUTES,
  type PlayingTimeRole,
} from '@/constants/playingTime';
import type { Club } from '@/types/club';
import type { MatchEvent, MatchFixture, MatchResult, PlayerMatchStat } from '@/types/match';
import type { Player } from '@/types/player';
import { isGoalkeeper } from '@/types/player';

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
      const scorers = homeSquad.filter((p) => (homeMinutes.get(p.id) ?? 0) > 0 && !isGoalkeeper(p));
      const scorer = scorers[randomInt(0, Math.max(0, scorers.length - 1))];
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
      }
    } else if (Math.random() < goalChanceAway) {
      awayScore++;
      const scorers = awaySquad.filter((p) => (awayMinutes.get(p.id) ?? 0) > 0 && !isGoalkeeper(p));
      const scorer = scorers[randomInt(0, Math.max(0, scorers.length - 1))];
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
    body: `${client.displayName} joue avec ${home.name}. Assistez au match pour rencontrer les joueurs après la rencontre.`,
    week: fixture.week,
    season: fixture.season,
    createdAt: new Date().toISOString(),
    read: false,
    playerId: client.id,
    action: 'match_invite' as const,
    matchId: fixture.id,
  };
}

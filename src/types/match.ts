export type MatchStatus = 'scheduled' | 'watched' | 'skipped';

export type MatchEventType =
  | 'kickoff'
  | 'chance'
  | 'goal'
  | 'yellow'
  | 'halftime'
  | 'fulltime';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  teamSide: 'home' | 'away';
  playerId?: string;
  playerName?: string;
  text: string;
}

export interface PlayerMatchStat {
  playerId: string;
  displayName: string;
  minutes: number;
  goals: number;
  assists: number;
  rating: number;
  cleanSheet: boolean;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  homeStats: PlayerMatchStat[];
  awayStats: PlayerMatchStat[];
}

/** Invitation à assister à un match d'un client. */
export interface MatchFixture {
  id: string;
  homeClubId: string;
  awayClubId: string;
  week: number;
  season: number;
  clientPlayerId: string;
  status: MatchStatus;
  result?: MatchResult;
}

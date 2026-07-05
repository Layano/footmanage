export type CompetitionType = 'league' | 'domestic_cup' | 'continental';

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';

export interface Competition {
  id: string;
  name: string;
  shortName: string;
  type: CompetitionType;
  countryCode?: string;
  confederation?: Confederation;
  leagueId?: string;
  leagueTier?: string;
  season: number;
}

export interface LeagueStanding {
  competitionId: string;
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface CompetitionResult {
  id: string;
  competitionId: string;
  week: number;
  season: number;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
}

export type CupRoundStatus = 'pending' | 'played';

export interface CupFixture {
  id: string;
  competitionId: string;
  season: number;
  round: number;
  roundLabel: string;
  homeClubId: string;
  awayClubId: string;
  homeScore?: number;
  awayScore?: number;
  status: CupRoundStatus;
  week: number;
}

export interface Trophy {
  id: string;
  competitionId: string;
  competitionName: string;
  type: CompetitionType;
  season: number;
  clubId: string;
  clubName: string;
  countryCode?: string;
  confederation?: Confederation;
}

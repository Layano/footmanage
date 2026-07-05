export type GamePhase = 'pre_season' | 'in_season' | 'transfer_window' | 'off_season';

export type GameMessageType =
  | 'info'
  | 'transfer'
  | 'loan'
  | 'contract'
  | 'scout'
  | 'finance'
  | 'match';

export type InboxAction =
  | 'none'
  | 'transfer_offer'
  | 'loan_offer'
  | 'match_invite';

export interface GameMessage {
  id: string;
  type: GameMessageType;
  title: string;
  body: string;
  week: number;
  season: number;
  createdAt: string;
  read: boolean;
  playerId?: string;
  action: InboxAction;
  offerId?: string;
  matchId?: string;
}

export interface GameTime {
  currentWeek: number;
  currentMonth: number;
  currentSeason: number;
  phase: GamePhase;
}

export const WEEKS_PER_SEASON = 52;

export type GamePhase = 'pre_season' | 'in_season' | 'transfer_window' | 'off_season';

export type GameMessageType = 'info' | 'transfer' | 'contract' | 'scout' | 'finance';

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
}

export interface GameTime {
  currentWeek: number;
  currentMonth: number;
  currentSeason: number;
  phase: GamePhase;
}

export const WEEKS_PER_SEASON = 52;

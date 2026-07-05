export interface GameTime {
  currentWeek: number;
  currentMonth: number;
  currentSeason: number;
  phase: 'pre_season' | 'in_season' | 'transfer_window' | 'off_season';
}

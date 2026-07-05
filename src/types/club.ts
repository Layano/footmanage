export interface Club {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  reputation: number;
  budget: number;
  wageBudget: number;
  colors: {
    primary: string;
    secondary: string;
  };
}

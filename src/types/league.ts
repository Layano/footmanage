export type CountryCode = 'ENG' | 'ESP' | 'ITA' | 'GER' | 'FRA';

export interface League {
  id: string;
  name: string;
  shortName: string;
  country: CountryCode;
  countryName: string;
  reputation: number;
  seasonWeeks: number;
  transferWindows: {
    summer: { startWeek: number; endWeek: number };
    winter: { startWeek: number; endWeek: number };
  };
}

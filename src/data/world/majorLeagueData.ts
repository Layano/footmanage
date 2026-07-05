/** Clubs inspirés (noms alternatifs) pour les grands championnats. */
export interface InspiredClubTemplate {
  name: string;
  shortName: string;
  reputation: number;
  budget: number;
  colors: { primary: string; secondary: string };
}

export const INSPIRED_CLUBS: Record<string, Record<string, InspiredClubTemplate[]>> = {
  ENG: {
    pro_1: [
      { name: 'Man Red', shortName: 'MRE', reputation: 92, budget: 180_000_000, colors: { primary: '#DA291C', secondary: '#FBE122' } },
      { name: 'London Blue', shortName: 'LBL', reputation: 88, budget: 150_000_000, colors: { primary: '#034694', secondary: '#FFFFFF' } },
      { name: 'Liver Red', shortName: 'LVR', reputation: 90, budget: 120_000_000, colors: { primary: '#C8102E', secondary: '#00B2A9' } },
      { name: 'North London', shortName: 'NLR', reputation: 85, budget: 100_000_000, colors: { primary: '#EF0107', secondary: '#FFFFFF' } },
      { name: 'Manchester Sky', shortName: 'MSY', reputation: 91, budget: 160_000_000, colors: { primary: '#6CABDD', secondary: '#FFFFFF' } },
      { name: 'West London', shortName: 'WLD', reputation: 84, budget: 130_000_000, colors: { primary: '#034694', secondary: '#FFFFFF' } },
      { name: 'Newcastle Stripes', shortName: 'NCS', reputation: 78, budget: 90_000_000, colors: { primary: '#241F20', secondary: '#FFFFFF' } },
      { name: 'Villa Claret', shortName: 'AVL', reputation: 76, budget: 70_000_000, colors: { primary: '#95BFE5', secondary: '#670E36' } },
    ],
    pro_2: [
      { name: 'Leeds White', shortName: 'LEE', reputation: 72, budget: 45_000_000, colors: { primary: '#FFFFFF', secondary: '#1D428A' } },
      { name: 'Leicester Fox', shortName: 'LEI', reputation: 74, budget: 55_000_000, colors: { primary: '#003090', secondary: '#FDBE11' } },
      { name: 'Southampton Red', shortName: 'SOU', reputation: 68, budget: 35_000_000, colors: { primary: '#D71920', secondary: '#FFFFFF' } },
      { name: 'Norwich Canary', shortName: 'NOR', reputation: 62, budget: 25_000_000, colors: { primary: '#FFF200', secondary: '#00A650' } },
    ],
    pro_3: [
      { name: 'Sheffield Blade', shortName: 'SHU', reputation: 58, budget: 15_000_000, colors: { primary: '#EE2737', secondary: '#FFFFFF' } },
      { name: 'Ipswich Blue', shortName: 'IPS', reputation: 55, budget: 12_000_000, colors: { primary: '#003399', secondary: '#FFFFFF' } },
    ],
    pro_4: [
      { name: 'Bradford Bantam', shortName: 'BRA', reputation: 42, budget: 3_000_000, colors: { primary: '#6B1F2A', secondary: '#F9E547' } },
      { name: 'Swindon Robin', shortName: 'SWI', reputation: 40, budget: 2_500_000, colors: { primary: '#E03A3E', secondary: '#FFFFFF' } },
    ],
    junior: [
      { name: 'Academy London U18', shortName: 'ALU', reputation: 35, budget: 500_000, colors: { primary: '#1E293B', secondary: '#22C55E' } },
      { name: 'Midlands Youth U17', shortName: 'MYU', reputation: 32, budget: 400_000, colors: { primary: '#334155', secondary: '#F59E0B' } },
    ],
  },
  NED: {
    pro_1: [
      { name: 'Amsterdam Red', shortName: 'AJA', reputation: 82, budget: 80_000_000, colors: { primary: '#FFFFFF', secondary: '#C4122E' } },
      { name: 'Rotterdam Port', shortName: 'FEP', reputation: 80, budget: 70_000_000, colors: { primary: '#ED1C24', secondary: '#FFFFFF' } },
      { name: 'Eindhoven Light', shortName: 'PSV', reputation: 79, budget: 65_000_000, colors: { primary: '#ED1C24', secondary: '#FFFFFF' } },
      { name: 'Alkmaar Cheese', shortName: 'AZA', reputation: 68, budget: 25_000_000, colors: { primary: '#E30613', secondary: '#FFFFFF' } },
    ],
    pro_2: [
      { name: 'Utrecht Dom', shortName: 'FCU', reputation: 58, budget: 8_000_000, colors: { primary: '#ED1C24', secondary: '#FFFFFF' } },
      { name: 'Nijmegen Green', shortName: 'NEC', reputation: 52, budget: 5_000_000, colors: { primary: '#007A33', secondary: '#000000' } },
    ],
    junior: [
      { name: 'Randstad U19', shortName: 'RU19', reputation: 30, budget: 350_000, colors: { primary: '#FF6600', secondary: '#FFFFFF' } },
    ],
  },
  FRA: {
    pro_1: [
      { name: 'Paris SG', shortName: 'PSG', reputation: 91, budget: 200_000_000, colors: { primary: '#004170', secondary: '#DA0F16' } },
      { name: 'Marseille Blue', shortName: 'OMB', reputation: 78, budget: 45_000_000, colors: { primary: '#2FAEE0', secondary: '#FFFFFF' } },
      { name: 'Lyon OL', shortName: 'OL', reputation: 80, budget: 60_000_000, colors: { primary: '#FFFFFF', secondary: '#D00027' } },
      { name: 'Monaco ASM', shortName: 'ASM', reputation: 76, budget: 55_000_000, colors: { primary: '#E30613', secondary: '#FFFFFF' } },
      { name: 'Lille Nord', shortName: 'LOSC', reputation: 74, budget: 40_000_000, colors: { primary: '#E30613', secondary: '#1A2B4A' } },
    ],
    pro_2: [
      { name: 'Lens Blood', shortName: 'RCL', reputation: 65, budget: 20_000_000, colors: { primary: '#D00027', secondary: '#F7D117' } },
      { name: 'Saint-Étienne Green', shortName: 'ASSE', reputation: 62, budget: 15_000_000, colors: { primary: '#1E5631', secondary: '#FFFFFF' } },
    ],
    pro_3: [
      { name: 'Auxerre Blue', shortName: 'AJA', reputation: 48, budget: 5_000_000, colors: { primary: '#0033A0', secondary: '#FFFFFF' } },
    ],
    pro_4: [
      { name: 'Red Star Paris', shortName: 'RSP', reputation: 38, budget: 1_500_000, colors: { primary: '#006633', secondary: '#FFFFFF' } },
    ],
    junior: [
      { name: 'Île-de-France U17', shortName: 'IDF', reputation: 28, budget: 300_000, colors: { primary: '#1E40AF', secondary: '#FFFFFF' } },
    ],
  },
  ESP: {
    pro_1: [
      { name: 'Real M.', shortName: 'RMA', reputation: 93, budget: 190_000_000, colors: { primary: '#FFFFFF', secondary: '#FEBE10' } },
      { name: 'Barça Catal', shortName: 'BAR', reputation: 92, budget: 170_000_000, colors: { primary: '#A50044', secondary: '#004D98' } },
      { name: 'Atlético Colchon', shortName: 'ATM', reputation: 86, budget: 100_000_000, colors: { primary: '#CB3524', secondary: '#FFFFFF' } },
      { name: 'Sevilla Red', shortName: 'SEV', reputation: 78, budget: 50_000_000, colors: { primary: '#D71920', secondary: '#FFFFFF' } },
    ],
    pro_2: [
      { name: 'Bilbao Lion', shortName: 'ATH', reputation: 72, budget: 35_000_000, colors: { primary: '#EE2523', secondary: '#FFFFFF' } },
      { name: 'Valencia Bat', shortName: 'VAL', reputation: 70, budget: 30_000_000, colors: { primary: '#FFFFFF', secondary: '#FF6600' } },
    ],
    pro_3: [
      { name: 'Zaragoza Blue', shortName: 'ZAR', reputation: 50, budget: 6_000_000, colors: { primary: '#0033A0', secondary: '#FFFFFF' } },
    ],
    pro_4: [
      { name: 'Girona Cat', shortName: 'GIR', reputation: 42, budget: 3_000_000, colors: { primary: '#CE1126', secondary: '#FFFFFF' } },
    ],
    junior: [
      { name: 'Cantera Esp U18', shortName: 'CEU', reputation: 30, budget: 400_000, colors: { primary: '#F59E0B', secondary: '#1E293B' } },
    ],
  },
  GER: {
    pro_1: [
      { name: 'Bayern M.', shortName: 'BAY', reputation: 92, budget: 150_000_000, colors: { primary: '#DC052D', secondary: '#0066B2' } },
      { name: 'Dortmund Yellow', shortName: 'BVB', reputation: 86, budget: 90_000_000, colors: { primary: '#FDE100', secondary: '#000000' } },
      { name: 'Leipzig Bull', shortName: 'RBL', reputation: 82, budget: 80_000_000, colors: { primary: '#DD0741', secondary: '#FFFFFF' } },
      { name: 'Leverkusen Pharma', shortName: 'B04', reputation: 80, budget: 70_000_000, colors: { primary: '#E32221', secondary: '#000000' } },
    ],
    pro_2: [
      { name: 'Frankfurt Eagle', shortName: 'SGE', reputation: 72, budget: 40_000_000, colors: { primary: '#E1000F', secondary: '#000000' } },
      { name: 'Stuttgart White', shortName: 'VFB', reputation: 68, budget: 30_000_000, colors: { primary: '#FFFFFF', secondary: '#E32221' } },
    ],
    pro_3: [
      { name: 'Hamburg Blue', shortName: 'HSV', reputation: 55, budget: 10_000_000, colors: { primary: '#1C5DA8', secondary: '#FFFFFF' } },
    ],
    pro_4: [
      { name: 'Kaiserslautern Red', shortName: 'FCK', reputation: 40, budget: 2_000_000, colors: { primary: '#C8102E', secondary: '#FFFFFF' } },
    ],
    junior: [
      { name: 'Bundes Nachwuchs U17', shortName: 'BNU', reputation: 28, budget: 350_000, colors: { primary: '#000000', secondary: '#FDE100' } },
    ],
  },
  ITA: {
    pro_1: [
      { name: 'Inter Mil.', shortName: 'INT', reputation: 88, budget: 120_000_000, colors: { primary: '#010E80', secondary: '#000000' } },
      { name: 'Milan Rosso', shortName: 'MIL', reputation: 87, budget: 110_000_000, colors: { primary: '#FB090B', secondary: '#000000' } },
      { name: 'Juve Bian', shortName: 'JUV', reputation: 86, budget: 100_000_000, colors: { primary: '#FFFFFF', secondary: '#000000' } },
      { name: 'Naples Blue', shortName: 'NAP', reputation: 82, budget: 80_000_000, colors: { primary: '#12A0D7', secondary: '#FFFFFF' } },
    ],
    pro_2: [
      { name: 'Roma Wolf', shortName: 'ROM', reputation: 78, budget: 55_000_000, colors: { primary: '#8E1F2F', secondary: '#F0BC42' } },
      { name: 'Lazio Eagle', shortName: 'LAZ', reputation: 74, budget: 45_000_000, colors: { primary: '#87D8F7', secondary: '#FFFFFF' } },
    ],
    pro_3: [
      { name: 'Parma Croce', shortName: 'PAR', reputation: 52, budget: 8_000_000, colors: { primary: '#FCD005', secondary: '#0033A0' } },
    ],
    pro_4: [
      { name: 'Brescia Lion', shortName: 'BRE', reputation: 38, budget: 1_800_000, colors: { primary: '#0033A0', secondary: '#FFFFFF' } },
    ],
    junior: [
      { name: 'Settore Giovanile U18', shortName: 'SGU', reputation: 28, budget: 300_000, colors: { primary: '#009246', secondary: '#CE2B37' } },
    ],
  },
  BRA: {
    pro_1: [
      { name: 'Flamengo Red', shortName: 'FLA', reputation: 80, budget: 60_000_000, colors: { primary: '#C8102E', secondary: '#000000' } },
      { name: 'Palmeiras Green', shortName: 'PAL', reputation: 78, budget: 55_000_000, colors: { primary: '#006437', secondary: '#FFFFFF' } },
      { name: 'São Paulo Tri', shortName: 'SAO', reputation: 76, budget: 45_000_000, colors: { primary: '#FFFFFF', secondary: '#C8102E' } },
    ],
    pro_2: [
      { name: 'Santos Whale', shortName: 'SAN', reputation: 65, budget: 15_000_000, colors: { primary: '#FFFFFF', secondary: '#000000' } },
    ],
    junior: [
      { name: 'Brasil Sub-17', shortName: 'BS17', reputation: 28, budget: 300_000, colors: { primary: '#FFDF00', secondary: '#009C3B' } },
    ],
  },
  ARG: {
    pro_1: [
      { name: 'Boca Blue', shortName: 'BOC', reputation: 78, budget: 40_000_000, colors: { primary: '#003087', secondary: '#FFD700' } },
      { name: 'River Plate', shortName: 'RIV', reputation: 77, budget: 38_000_000, colors: { primary: '#FFFFFF', secondary: '#C8102E' } },
    ],
    pro_2: [
      { name: 'Racing Avellaneda', shortName: 'RAC', reputation: 62, budget: 10_000_000, colors: { primary: '#6CACE4', secondary: '#FFFFFF' } },
    ],
    junior: [
      { name: 'Argentina U17', shortName: 'ARU', reputation: 28, budget: 280_000, colors: { primary: '#74ACDF', secondary: '#FFFFFF' } },
    ],
  },
  POR: {
    pro_1: [
      { name: 'Porto Dragon', shortName: 'FCP', reputation: 78, budget: 50_000_000, colors: { primary: '#003893', secondary: '#FFFFFF' } },
      { name: 'Benfica Eagle', shortName: 'SLB', reputation: 77, budget: 48_000_000, colors: { primary: '#FF0000', secondary: '#FFFFFF' } },
    ],
    pro_2: [
      { name: 'Sporting Lion', shortName: 'SCP', reputation: 72, budget: 35_000_000, colors: { primary: '#008057', secondary: '#FFFFFF' } },
    ],
    junior: [
      { name: 'Liga Jovem U17', shortName: 'LJU', reputation: 26, budget: 250_000, colors: { primary: '#006600', secondary: '#FF0000' } },
    ],
  },
};

/** Nombre de clubs cibles par tier si pas de template détaillé. */
export const DEFAULT_CLUBS_PER_TIER: Record<string, number> = {
  pro_1: 16,
  pro_2: 18,
  pro_3: 16,
  pro_4: 14,
  pro_5: 12,
  junior: 10,
};

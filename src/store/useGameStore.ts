import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { GAME_CONFIG, SAVE_GAME_KEY, SAVE_GAME_VERSION } from '@/constants/gameConfig';
import { getCountryByCode } from '@/data/world/countries';
import {
  buildRepresentationContract,
  evaluateNegotiation,
} from '@/engine/negotiation/amateurNegotiation';
import { generateNeighborhoodAmateurs } from '@/engine/players/amateurGenerator';
import { buildTournamentForWeek } from '@/engine/scouting/tournamentEngine';
import { buildWorldDatabase } from '@/engine/world/worldGenerator';
import { processWeeklyEconomy } from '@/engine/simulation/economyEngine';
import {
  createMatchInvite,
  createMatchInviteMessage,
  getClubSquad,
  simulateMatch,
} from '@/engine/simulation/matchEngine';
import {
  adjustAgencyReputation,
  reputationDeltaForMatchAttendance,
  reputationDeltaForSigning,
  reputationDeltaForTransferDeal,
} from '@/engine/simulation/reputationEngine';
import {
  expireOldOffers,
  generateWeeklyTransferOffers,
} from '@/engine/simulation/transferOfferEngine';
import { getTransferWindowLabel } from '@/engine/simulation/transferWindow';
import {
  agePlayerByOneYear,
  tryWeeklyPlayerEvolution,
} from '@/engine/simulation/evolutionEngine';
import { clearAllSaves } from '@/store/saveMigration';
import type { NegotiationOffer, SignPlayerResult } from '@/types/agentContract';
import type { Agency } from '@/types/agency';
import type { Club } from '@/types/club';
import type { GameMessage } from '@/types/game';
import { WEEKS_PER_SEASON } from '@/types/game';
import type { MatchFixture } from '@/types/match';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';
import type { ClubContractOffer } from '@/types/transfer';
import type { Staff } from '@/types/staff';
import type { NeighborhoodTournament } from '@/types/tournament';
import type { GameMode, NewGameConfig } from '@/types/world';

// ─── Types persistés ──────────────────────────────────────────────────────────

export interface PersistedGameState {
  saveVersion: number;
  currentWeek: number;
  currentSeason: number;
  agencyBudget: number;
  agency: Agency;
  myPlayers: Player[];
  scoutedPlayers: Player[];
  staff: Staff[];
  leagues: League[];
  clubs: Club[];
  messages: GameMessage[];
  totalRevenue: number;
  totalExpenses: number;
  isTutorialActive: boolean;
  tutorialStep: number;
  worldPlayers: Player[];
  gameMode: GameMode;
  agencyCountryCode: string;
  hasActiveGame: boolean;
  currentTournament: NeighborhoodTournament | null;
  pendingOffers: ClubContractOffer[];
  matchFixtures: MatchFixture[];
}

interface GameStore extends PersistedGameState {
  isHydrated: boolean;
  startNewGame: (config: NewGameConfig) => Promise<void>;
  loadGame: () => Promise<boolean>;
  saveGame: () => Promise<void>;
  advanceTime: () => Promise<void>;
  scoutNeighborhoodTournament: () => Promise<boolean>;
  signAmateurPlayer: (playerId: string, offer: NegotiationOffer) => Promise<SignPlayerResult>;
  signProPlayer: (playerId: string, offer: NegotiationOffer) => Promise<SignPlayerResult>;
  markMessageRead: (messageId: string) => void;
  acceptTransferOffer: (offerId: string) => Promise<boolean>;
  rejectTransferOffer: (offerId: string) => Promise<void>;
  runMatchSimulation: (matchId: string) => MatchFixture | null;
  completeMatch: (matchId: string) => Promise<void>;
  setTutorialStep: (step: number) => void;
  resetGame: () => Promise<void>;
  revealPlayerScouting: (playerId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createInitialTournament(
  week: number,
  season: number,
  countryCode: string,
  agencyCity: string,
  tutorialLocal = false,
): NeighborhoodTournament {
  return buildTournamentForWeek(week, season, countryCode, agencyCity, {
    forceCity: tutorialLocal ? agencyCity : undefined,
  });
}

function createStarterAgency(name: string, countryName: string, city: string): Agency {
  return {
    id: GAME_CONFIG.AGENCY_ID,
    name,
    reputation: 5,
    foundedYear: 2025,
    finances: {
      balance: GAME_CONFIG.STARTING_BUDGET,
      totalRevenue: 0,
      totalExpenses: 0,
      commissionRate: 10,
      operatingCosts: 0,
    },
    staff: [],
    clientPlayerIds: [],
    maxClients: 10,
    office: {
      city,
      country: countryName,
      level: 1,
    },
  };
}

function getEmptyShellState(): PersistedGameState {
  return {
    saveVersion: SAVE_GAME_VERSION,
    currentWeek: 1,
    currentSeason: 2025,
    agencyBudget: GAME_CONFIG.STARTING_BUDGET,
    agency: createStarterAgency('Mon Agence', 'France', 'Paris'),
    myPlayers: [],
    scoutedPlayers: [],
    staff: [],
    leagues: [],
    clubs: [],
    worldPlayers: [],
    messages: [],
    totalRevenue: 0,
    totalExpenses: 0,
    isTutorialActive: false,
    tutorialStep: 0,
    gameMode: 'career',
    agencyCountryCode: 'FRA',
    hasActiveGame: false,
    currentTournament: null,
    pendingOffers: [],
    matchFixtures: [],
  };
}

function withPlayerDefaults(player: Player): Player {
  return {
    ...player,
    seasonMinutes: player.seasonMinutes ?? 0,
    weeklyMinutes: player.weeklyMinutes ?? 0,
  };
}

function buildFreshGameState(config: NewGameConfig): PersistedGameState {
  const country = getCountryByCode(config.countryCode) ?? getCountryByCode('FRA')!;
  const world = buildWorldDatabase({ agencyCountryCode: config.countryCode });

  return {
    saveVersion: SAVE_GAME_VERSION,
    currentWeek: 1,
    currentSeason: 2025,
    agencyBudget: GAME_CONFIG.STARTING_BUDGET,
    agency: createStarterAgency(config.agencyName, country.name, country.defaultCity),
    myPlayers: [],
    scoutedPlayers: [],
    staff: [],
    leagues: world.leagues,
    clubs: world.clubs,
    worldPlayers: world.players,
    messages: [
      {
        id: 'msg-welcome',
        type: 'info',
        title: 'Nouveau départ',
        body: `Bienvenue à ${config.agencyName} ! Votre agence est basée à ${country.defaultCity}.`,
        week: 1,
        season: 2025,
        createdAt: new Date().toISOString(),
        read: false,
        action: 'none',
      },
    ],
    totalRevenue: 0,
    totalExpenses: 0,
    isTutorialActive: true,
    tutorialStep: 1,
    gameMode: config.gameMode,
    agencyCountryCode: config.countryCode,
    hasActiveGame: true,
    currentTournament: createInitialTournament(
      1,
      2025,
      config.countryCode,
      country.defaultCity,
      true,
    ),
    pendingOffers: [],
    matchFixtures: [],
  };
}

function toPersistedState(state: GameStore): PersistedGameState {
  return {
    saveVersion: SAVE_GAME_VERSION,
    currentWeek: state.currentWeek,
    currentSeason: state.currentSeason,
    agencyBudget: state.agencyBudget,
    agency: state.agency,
    myPlayers: state.myPlayers,
    scoutedPlayers: state.scoutedPlayers,
    staff: state.staff,
    leagues: state.leagues,
    clubs: state.clubs,
    messages: state.messages,
    totalRevenue: state.totalRevenue,
    totalExpenses: state.totalExpenses,
    isTutorialActive: state.isTutorialActive,
    tutorialStep: state.tutorialStep,
    worldPlayers: state.worldPlayers,
    gameMode: state.gameMode,
    agencyCountryCode: state.agencyCountryCode,
    hasActiveGame: state.hasActiveGame,
    currentTournament: state.currentTournament,
    pendingOffers: state.pendingOffers,
    matchFixtures: state.matchFixtures,
  };
}

function evolveAllPlayers(players: Player[]): Player[] {
  return players.map((player) => tryWeeklyPlayerEvolution(player));
}

function ageAllPlayers(players: Player[]): Player[] {
  return players.map((player) => agePlayerByOneYear(player));
}

function syncAgency(state: PersistedGameState, overrides?: Partial<Agency>): Agency {
  return {
    ...(overrides ? { ...state.agency, ...overrides } : state.agency),
    finances: {
      ...state.agency.finances,
      balance: state.agencyBudget,
      totalRevenue: state.totalRevenue,
      totalExpenses: state.totalExpenses,
    },
    clientPlayerIds: state.myPlayers.map((p) => p.id),
    staff: state.staff,
  };
}

function normalizeLoadedState(saved: Partial<PersistedGameState>): PersistedGameState | null {
  if (!saved.saveVersion || saved.saveVersion < SAVE_GAME_VERSION) {
    return null;
  }

  const defaults = getEmptyShellState();
  return {
    ...defaults,
    ...saved,
    saveVersion: SAVE_GAME_VERSION,
    agency: { ...defaults.agency, ...saved.agency },
    isTutorialActive: saved.isTutorialActive ?? false,
    tutorialStep: saved.tutorialStep ?? 0,
    gameMode: saved.gameMode ?? 'career',
    agencyCountryCode: saved.agencyCountryCode ?? 'FRA',
    hasActiveGame: saved.hasActiveGame ?? true,
    currentTournament:
      saved.currentTournament ??
      createInitialTournament(
        saved.currentWeek ?? 1,
        saved.currentSeason ?? 2025,
        saved.agencyCountryCode ?? 'FRA',
        saved.agency?.office.city ?? 'Paris',
      ),
    pendingOffers: saved.pendingOffers ?? [],
    matchFixtures: saved.matchFixtures ?? [],
    myPlayers: (saved.myPlayers ?? []).map(withPlayerDefaults),
    scoutedPlayers: (saved.scoutedPlayers ?? []).map(withPlayerDefaults),
    worldPlayers: (saved.worldPlayers ?? []).map(withPlayerDefaults),
    messages: (saved.messages ?? []).map((m) => ({ ...m, action: m.action ?? 'none' })),
  };
}

function updatePlayerInLists(
  state: PersistedGameState,
  playerId: string,
  updater: (player: Player) => Player,
): Pick<PersistedGameState, 'myPlayers' | 'scoutedPlayers' | 'worldPlayers'> {
  return {
    myPlayers: state.myPlayers.map((p) => (p.id === playerId ? updater(p) : p)),
    scoutedPlayers: state.scoutedPlayers.map((p) => (p.id === playerId ? updater(p) : p)),
    worldPlayers: state.worldPlayers.map((p) => (p.id === playerId ? updater(p) : p)),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  ...getEmptyShellState(),
  isHydrated: false,

  startNewGame: async (config: NewGameConfig) => {
    await clearAllSaves();
    const freshState = buildFreshGameState(config);
    set({ ...freshState, isHydrated: true, hasActiveGame: true });
    await get().saveGame();
  },

  resetGame: async () => {
    await clearAllSaves();
    set({ ...getEmptyShellState(), isHydrated: true, hasActiveGame: false });
  },

  saveGame: async () => {
    const state = get();
    const payload = toPersistedState(state);
    await AsyncStorage.setItem(SAVE_GAME_KEY, JSON.stringify(payload));
  },

  loadGame: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVE_GAME_KEY);
      if (!raw) {
        set({ isHydrated: true, hasActiveGame: false });
        return false;
      }

      const saved = normalizeLoadedState(JSON.parse(raw) as Partial<PersistedGameState>);
      if (!saved) {
        await clearAllSaves();
        set({ isHydrated: true, hasActiveGame: false });
        return false;
      }

      set({ ...saved, isHydrated: true, hasActiveGame: saved.hasActiveGame ?? true });
      return true;
    } catch {
      await clearAllSaves();
      set({ isHydrated: true, hasActiveGame: false });
      return false;
    }
  },

  setTutorialStep: (step: number) => {
    set({ tutorialStep: step });
    void get().saveGame();
  },

  scoutNeighborhoodTournament: async () => {
    const state = get();
    const tournament =
      state.currentTournament ??
      createInitialTournament(
        state.currentWeek,
        state.currentSeason,
        state.agencyCountryCode,
        state.agency.office.city,
      );

    if (state.agencyBudget < tournament.travelCost) {
      return false;
    }

    const newAmateurs = generateNeighborhoodAmateurs(state.currentWeek, state.currentSeason, {
      countryCode: state.agencyCountryCode,
      tournamentCity: tournament.city,
    });

    let nextWeek = state.currentWeek + 1;
    let nextSeason = state.currentSeason;
    if (nextWeek > WEEKS_PER_SEASON) {
      nextWeek = 1;
      nextSeason += 1;
    }

    const nextBudget = state.agencyBudget - tournament.travelCost;
    const nextExpenses = state.totalExpenses + tournament.travelCost;
    const nextTournament = createInitialTournament(
      nextWeek,
      nextSeason,
      state.agencyCountryCode,
      state.agency.office.city,
    );

    const countryName = getCountryByCode(state.agencyCountryCode)?.name ?? state.agencyCountryCode;
    const newMessage: GameMessage = {
      id: `msg-tournament-${Date.now()}`,
      type: 'scout',
      title: `Tournoi — ${tournament.city}`,
      body: `${newAmateurs.length} jeunes ${countryName} repérés à ${tournament.city} (trajet : ${tournament.travelCost} €).`,
      week: nextWeek,
      season: nextSeason,
      createdAt: new Date().toISOString(),
      read: false,
      action: 'none',
    };

    const nextState: PersistedGameState = {
      ...state,
      currentWeek: nextWeek,
      currentSeason: nextSeason,
      agencyBudget: nextBudget,
      totalExpenses: nextExpenses,
      scoutedPlayers: [...newAmateurs, ...state.scoutedPlayers],
      currentTournament: nextTournament,
      messages: [newMessage, ...state.messages].slice(0, GAME_CONFIG.MAX_DASHBOARD_MESSAGES),
      tutorialStep: state.isTutorialActive && state.tutorialStep === 2 ? 3 : state.tutorialStep,
    };

    set({
      ...nextState,
      agency: syncAgency(nextState),
    });

    await get().saveGame();
    return true;
  },

  signAmateurPlayer: async (playerId: string, offer: NegotiationOffer): Promise<SignPlayerResult> => {
    const state = get();
    const player = state.scoutedPlayers.find((p) => p.id === playerId);

    if (!player || player.contract.clubId !== null) {
      return { success: false, reason: 'Ce joueur ne peut pas être signé.' };
    }

    const evaluation = evaluateNegotiation(player, offer, state.agency.reputation);
    if (!evaluation.accepted) {
      return { success: false, reason: evaluation.feedback };
    }

    const representationContract = buildRepresentationContract(offer, state.currentSeason);
    const signedPlayer: Player = withPlayerDefaults({
      ...player,
      isClient: true,
      agentId: GAME_CONFIG.AGENCY_ID,
      status: 'active',
      representationContract,
      seasonMinutes: 0,
      weeklyMinutes: 0,
    });

    const myPlayers = [...state.myPlayers, signedPlayer];
    const scoutedPlayers = state.scoutedPlayers.filter((p) => p.id !== playerId);
    const isFirstClient = state.myPlayers.length === 0;
    const bonusIncome = offer.signingBonus;
    const nextBudget = state.agencyBudget + bonusIncome;
    const nextRevenue = state.totalRevenue + bonusIncome;

    const newMessage: GameMessage = {
      id: `msg-sign-${playerId}-${Date.now()}`,
      type: 'info',
      title: isFirstClient ? 'Premier client !' : 'Joueur signé',
      body: `${signedPlayer.displayName} rejoint votre agence (${offer.salaryCommissionPercent}% salaire, ${offer.transferCommissionPercent}% transfert${bonusIncome > 0 ? `, prime ${bonusIncome} €` : ''}).`,
      week: state.currentWeek,
      season: state.currentSeason,
      createdAt: new Date().toISOString(),
      read: false,
      action: 'none',
    };

    const nextAgency = adjustAgencyReputation(state.agency, reputationDeltaForSigning(signedPlayer));

    const nextState: PersistedGameState = {
      ...state,
      myPlayers,
      scoutedPlayers,
      agencyBudget: nextBudget,
      totalRevenue: nextRevenue,
      agency: nextAgency,
      messages: [newMessage, ...state.messages].slice(0, GAME_CONFIG.MAX_DASHBOARD_MESSAGES),
      isTutorialActive: isFirstClient ? false : state.isTutorialActive,
      tutorialStep: isFirstClient ? 0 : state.tutorialStep,
    };

    set({
      ...nextState,
      agency: syncAgency({ ...nextState, agency: nextAgency }),
    });

    await get().saveGame();
    return { success: true };
  },

  signProPlayer: async (playerId: string, offer: NegotiationOffer): Promise<SignPlayerResult> => {
    const state = get();
    const player = state.worldPlayers.find((p) => p.id === playerId);

    if (!player || player.isClient) {
      return { success: false, reason: 'Joueur indisponible.' };
    }

    const evaluation = evaluateNegotiation(player, offer, state.agency.reputation);
    if (!evaluation.accepted) {
      return { success: false, reason: evaluation.feedback };
    }

    const representationContract = buildRepresentationContract(offer, state.currentSeason);
    const signedPlayer = withPlayerDefaults({
      ...player,
      isClient: true,
      agentId: GAME_CONFIG.AGENCY_ID,
      representationContract,
    });

    const myPlayers = [...state.myPlayers, signedPlayer];
    const worldPlayers = state.worldPlayers.filter((p) => p.id !== playerId);
    const nextBudget = state.agencyBudget + offer.signingBonus;
    const nextAgency = adjustAgencyReputation(state.agency, reputationDeltaForSigning(signedPlayer));

    const newMessage: GameMessage = {
      id: `msg-pro-sign-${playerId}-${Date.now()}`,
      type: 'info',
      title: 'Nouveau client professionnel',
      body: `${signedPlayer.displayName} rejoint votre agence après vos discussions post-match.`,
      week: state.currentWeek,
      season: state.currentSeason,
      createdAt: new Date().toISOString(),
      read: false,
      action: 'none',
    };

    const nextState: PersistedGameState = {
      ...state,
      myPlayers,
      worldPlayers,
      agencyBudget: nextBudget,
      totalRevenue: state.totalRevenue + offer.signingBonus,
      agency: nextAgency,
      messages: [newMessage, ...state.messages].slice(0, GAME_CONFIG.MAX_DASHBOARD_MESSAGES),
    };

    set({ ...nextState, agency: syncAgency(nextState) });
    await get().saveGame();
    return { success: true };
  },

  markMessageRead: (messageId: string) => {
    const state = get();
    const messages = state.messages.map((m) =>
      m.id === messageId ? { ...m, read: true } : m,
    );
    set({ messages });
    void get().saveGame();
  },

  acceptTransferOffer: async (offerId: string) => {
    const state = get();
    const offer = state.pendingOffers.find((o) => o.id === offerId && o.status === 'pending');
    if (!offer) return false;

    const club = state.clubs.find((c) => c.id === offer.clubId);
    const playerIndex = state.myPlayers.findIndex((p) => p.id === offer.playerId);
    if (!club || playerIndex < 0) return false;

    const player = state.myPlayers[playerIndex]!;
    const commission =
      offer.type === 'transfer' && player.representationContract
        ? Math.round((offer.fee * player.representationContract.transferCommissionPercent) / 100)
        : 0;

    const updatedPlayer: Player = {
      ...player,
      contract: {
        ...player.contract,
        clubId: offer.clubId,
        weeklyWage: offer.weeklyWage,
        endDate: `${state.currentSeason + offer.contractYears}-06-30`,
      },
      currentTeam: club.name,
      weeklyMinutes: 0,
    };

    const myPlayers = [...state.myPlayers];
    myPlayers[playerIndex] = updatedPlayer;

    const pendingOffers = state.pendingOffers.map((o) =>
      o.id === offerId
        ? { ...o, status: 'accepted' as const }
        : o.playerId === offer.playerId && o.status === 'pending'
          ? { ...o, status: 'rejected' as const }
          : o,
    );

    const nextAgency = adjustAgencyReputation(
      state.agency,
      reputationDeltaForTransferDeal(offer.fee),
    );

    const newMessage: GameMessage = {
      id: `msg-offer-accepted-${offerId}`,
      type: offer.type === 'loan' ? 'loan' : 'transfer',
      title: offer.type === 'loan' ? 'Prêt accepté' : 'Transfert accepté',
      body: `${player.displayName} rejoint ${club.name} (${offer.expectedMinutesPercent}% temps de jeu, ${offer.weeklyWage.toLocaleString('fr-FR')} €/sem.)${commission > 0 ? ` · Commission : ${commission.toLocaleString('fr-FR')} €` : ''}.`,
      week: state.currentWeek,
      season: state.currentSeason,
      createdAt: new Date().toISOString(),
      read: true,
      action: 'none',
      playerId: player.id,
    };

    const nextState: PersistedGameState = {
      ...state,
      myPlayers,
      pendingOffers,
      agencyBudget: state.agencyBudget + commission,
      totalRevenue: state.totalRevenue + commission,
      agency: nextAgency,
      messages: [newMessage, ...state.messages].slice(0, GAME_CONFIG.MAX_DASHBOARD_MESSAGES),
    };

    set({ ...nextState, agency: syncAgency(nextState) });
    await get().saveGame();
    return true;
  },

  rejectTransferOffer: async (offerId: string) => {
    const state = get();
    const pendingOffers = state.pendingOffers.map((o) =>
      o.id === offerId ? { ...o, status: 'rejected' as const } : o,
    );
    set({ pendingOffers });
    await get().saveGame();
  },

  runMatchSimulation: (matchId: string) => {
    const state = get();
    const fixture = state.matchFixtures.find((m) => m.id === matchId);
    if (!fixture) return null;

    if (fixture.result) return fixture;

    const homeClub = state.clubs.find((c) => c.id === fixture.homeClubId);
    const awayClub = state.clubs.find((c) => c.id === fixture.awayClubId);
    if (!homeClub || !awayClub) return null;

    const allPlayers = [...state.worldPlayers, ...state.myPlayers];
    const homeSquad = getClubSquad(fixture.homeClubId, allPlayers);
    const awaySquad = getClubSquad(fixture.awayClubId, allPlayers);
    const result = simulateMatch(homeClub, awayClub, homeSquad, awaySquad, fixture.clientPlayerId);

    const matchFixtures = state.matchFixtures.map((m) =>
      m.id === matchId ? { ...m, result } : m,
    );
    set({ matchFixtures });
    void get().saveGame();
    return { ...fixture, result };
  },

  completeMatch: async (matchId: string) => {
    const state = get();
    const fixture = state.matchFixtures.find((m) => m.id === matchId);
    if (!fixture?.result || fixture.status === 'watched') return;

    const allStats = [...fixture.result.homeStats, ...fixture.result.awayStats];
    const clientStat = allStats.find((s) => s.playerId === fixture.clientPlayerId);

    let myPlayers = state.myPlayers.map((p) => {
      if (p.id !== fixture.clientPlayerId) return p;
      const mins = clientStat?.minutes ?? 0;
      return {
        ...p,
        weeklyMinutes: mins,
        seasonMinutes: p.seasonMinutes + mins,
        form: Math.min(100, p.form + (clientStat && clientStat.rating >= 7 ? 2 : -1)),
      };
    });

    myPlayers = myPlayers.map((p) => tryWeeklyPlayerEvolution(p));

    let worldPlayers = state.worldPlayers.map((p) => {
      const stat = allStats.find((s) => s.playerId === p.id);
      if (!stat) return p;
      return {
        ...p,
        weeklyMinutes: stat.minutes,
        seasonMinutes: p.seasonMinutes + stat.minutes,
      };
    });

    const repDelta = clientStat ? reputationDeltaForMatchAttendance(clientStat.rating) : 0;
    const nextAgency = adjustAgencyReputation(state.agency, repDelta);

    const matchFixtures = state.matchFixtures.map((m) =>
      m.id === matchId ? { ...m, status: 'watched' as const } : m,
    );

    const nextState: PersistedGameState = {
      ...state,
      myPlayers,
      worldPlayers,
      matchFixtures,
      agency: nextAgency,
    };

    set({ ...nextState, agency: syncAgency(nextState) });
    await get().saveGame();
  },

  revealPlayerScouting: (playerId: string) => {
    const state = get();
    const scoutBonus = state.staff
      .filter((s) => s.role === 'scout')
      .reduce((max, s) => Math.max(max, (s.bonuses.potentialRevealBonus ?? 10) + s.level * 8), 0);

    if (scoutBonus === 0) return;

    const lists = updatePlayerInLists(state, playerId, (player) => ({
      ...player,
      potential: {
        ...player.potential,
        revealedPercent: Math.min(100, player.potential.revealedPercent + Math.round(scoutBonus / 2)),
      },
    }));

    const nextState = { ...state, ...lists };
    set({ ...nextState, agency: syncAgency(nextState) });
    void get().saveGame();
  },

  advanceTime: async () => {
    const state = get();
    let nextWeek = state.currentWeek + 1;
    let nextSeason = state.currentSeason;

    const economy = processWeeklyEconomy(
      state.staff,
      state.agency.finances.operatingCosts,
      state.myPlayers,
    );
    let nextBudget = state.agencyBudget + economy.netChange;
    let nextRevenue = state.totalRevenue + economy.commissionIncome;
    let nextExpenses = state.totalExpenses + economy.totalExpense;

    const newMessages: GameMessage[] = [];
    if (economy.commissionIncome > 0) {
      newMessages.push({
        id: `msg-commission-${nextWeek}-${Date.now()}`,
        type: 'finance',
        title: 'Commission perçue',
        body: `Vous avez encaissé ${economy.commissionIncome.toLocaleString('fr-FR')} € de commission.`,
        week: nextWeek,
        season: nextSeason,
        createdAt: new Date().toISOString(),
        read: false,
        action: 'none',
      });
    }

    let myPlayers = evolveAllPlayers(state.myPlayers);
    let scoutedPlayers = evolveAllPlayers(state.scoutedPlayers);
    let worldPlayers = evolveAllPlayers(state.worldPlayers);

    let pendingOffers = state.pendingOffers;
    const expired = expireOldOffers(pendingOffers, nextWeek);
    pendingOffers = expired.offers;

    const transferWindowLabel = getTransferWindowLabel(nextWeek, state.leagues, state.agencyCountryCode);
    if (transferWindowLabel && state.myPlayers.length > 0) {
      const generated = generateWeeklyTransferOffers(
        nextWeek,
        nextSeason,
        myPlayers,
        state.clubs,
        state.leagues,
        state.agencyCountryCode,
      );
      pendingOffers = [...pendingOffers, ...generated.offers];
      newMessages.push(...generated.messages);
    }

    let matchFixtures = [...state.matchFixtures];
    for (const client of myPlayers) {
      if (!client.contract.clubId) continue;
      if (Math.random() > GAME_CONFIG.MATCH_INVITE_CHANCE_PER_CLIENT) continue;
      const fixture = createMatchInvite(client, state.clubs, worldPlayers, nextWeek, nextSeason);
      if (!fixture || matchFixtures.some((m) => m.id === fixture.id)) continue;
      const home = state.clubs.find((c) => c.id === fixture.homeClubId);
      const away = state.clubs.find((c) => c.id === fixture.awayClubId);
      if (!home || !away) continue;
      matchFixtures.push(fixture);
      newMessages.push(createMatchInviteMessage(fixture, home, away, client));
    }

    const isSeasonEnd = nextWeek > WEEKS_PER_SEASON;
    if (isSeasonEnd) {
      myPlayers = ageAllPlayers(myPlayers);
      scoutedPlayers = ageAllPlayers(scoutedPlayers);
      worldPlayers = ageAllPlayers(worldPlayers);
      nextWeek = 1;
      nextSeason += 1;

      newMessages.push({
        id: `msg-season-${nextSeason}-${Date.now()}`,
        type: 'info',
        title: 'Nouvelle saison',
        body: `La saison ${nextSeason - 1}/${nextSeason} est terminée. Tous les joueurs vieillissent d'un an.`,
        week: nextWeek,
        season: nextSeason,
        createdAt: new Date().toISOString(),
        read: false,
        action: 'none',
      });
    }

    const messages = [...newMessages, ...state.messages].slice(
      0,
      GAME_CONFIG.MAX_DASHBOARD_MESSAGES,
    );

    const nextState: PersistedGameState = {
      ...state,
      currentWeek: nextWeek,
      currentSeason: nextSeason,
      agencyBudget: nextBudget,
      myPlayers,
      scoutedPlayers,
      worldPlayers,
      messages,
      pendingOffers,
      matchFixtures,
      totalRevenue: nextRevenue,
      totalExpenses: nextExpenses,
      currentTournament: createInitialTournament(
        nextWeek,
        nextSeason,
        state.agencyCountryCode,
        state.agency.office.city,
      ),
    };

    set({
      ...nextState,
      agency: syncAgency(nextState),
    });

    await get().saveGame();
  },
}));

/** Sélecteurs utilitaires */
export function getClubFromStore(clubId: string | null): Club | undefined {
  if (!clubId) return undefined;
  return useGameStore.getState().clubs.find((c) => c.id === clubId);
}

export function formatGameDate(week: number, season: number): string {
  return `Semaine ${week} — Saison ${season}/${season + 1}`;
}

/** Pendant le tutoriel, seuls Scouting (étapes 1–2) puis tous les onglets (étape 3+) sont accessibles. */
export function isTabLockedDuringTutorial(
  tabName: 'index' | 'players' | 'scouting' | 'finance',
  isTutorialActive: boolean,
  tutorialStep: number,
): boolean {
  if (!isTutorialActive || tutorialStep < 1) return false;
  if (tutorialStep <= 2) return tabName !== 'scouting';
  return false;
}

export type PlayerSource = 'client' | 'scouted' | 'world';

export function findPlayerById(playerId: string): { player: Player; source: PlayerSource } | null {
  const state = useGameStore.getState();
  const client = state.myPlayers.find((p) => p.id === playerId);
  if (client) return { player: client, source: 'client' };
  const scouted = state.scoutedPlayers.find((p) => p.id === playerId);
  if (scouted) return { player: scouted, source: 'scouted' };
  const world = state.worldPlayers.find((p) => p.id === playerId);
  if (world) return { player: world, source: 'world' };
  return null;
}

/** Joueurs du marché mondial (hors clients et hors tournois locaux). */
export function getWorldMarketPlayers(agencyCountryCode?: string): Player[] {
  const state = useGameStore.getState();
  const code = agencyCountryCode ?? state.agencyCountryCode;
  const clientIds = new Set(state.myPlayers.map((p) => p.id));
  const scoutedIds = new Set(state.scoutedPlayers.map((p) => p.id));

  return state.worldPlayers.filter(
    (p) =>
      !p.isClient &&
      !clientIds.has(p.id) &&
      !scoutedIds.has(p.id) &&
      p.contract.clubId !== null &&
      state.clubs.find((c) => c.id === p.contract.clubId)?.countryCode === code,
  );
}

export function getUnreadMessageCount(): number {
  return useGameStore.getState().messages.filter((m) => !m.read).length;
}

export function getOfferById(offerId: string) {
  return useGameStore.getState().pendingOffers.find((o) => o.id === offerId);
}

export function getMatchFixtureById(matchId: string) {
  return useGameStore.getState().matchFixtures.find((m) => m.id === matchId);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { GAME_CONFIG, SAVE_GAME_KEY } from '@/constants/gameConfig';
import { AGENCY_ID, MOCK_CLUBS, MOCK_GAME_DATA, MOCK_LEAGUES } from '@/data/mockData';
import { generateNeighborhoodAmateurs } from '@/engine/players/amateurGenerator';
import { processWeeklyEconomy } from '@/engine/simulation/economyEngine';
import { generateWeeklyEvent } from '@/engine/simulation/eventGenerator';
import {
  agePlayerByOneYear,
  tryWeeklyPlayerEvolution,
} from '@/engine/simulation/evolutionEngine';
import type { Agency } from '@/types/agency';
import type { Club } from '@/types/club';
import type { GameMessage } from '@/types/game';
import { WEEKS_PER_SEASON } from '@/types/game';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';
import type { Staff } from '@/types/staff';

// ─── Types persistés ──────────────────────────────────────────────────────────

export interface PersistedGameState {
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
}

interface GameStore extends PersistedGameState {
  isHydrated: boolean;
  initNewGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  saveGame: () => Promise<void>;
  advanceTime: () => Promise<void>;
  scoutNeighborhoodTournament: () => Promise<boolean>;
  signAmateurPlayer: (playerId: string) => Promise<boolean>;
  setTutorialStep: (step: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createStarterAgency(): Agency {
  const base = clone(MOCK_GAME_DATA.agency);

  return {
    ...base,
    reputation: 5,
    finances: {
      ...base.finances,
      balance: GAME_CONFIG.STARTING_BUDGET,
      totalRevenue: 0,
      totalExpenses: 0,
      operatingCosts: 0,
    },
    staff: [],
    clientPlayerIds: [],
    office: {
      city: 'Banlieue',
      country: 'France',
      level: 1,
    },
  };
}

function getInitialState(): PersistedGameState {
  const agency = createStarterAgency();

  return {
    currentWeek: 1,
    currentSeason: 2025,
    agencyBudget: GAME_CONFIG.STARTING_BUDGET,
    agency,
    myPlayers: [],
    scoutedPlayers: [],
    staff: [],
    leagues: clone(MOCK_LEAGUES),
    clubs: clone(MOCK_CLUBS),
    messages: [
      {
        id: 'msg-welcome',
        type: 'info',
        title: 'Nouveau départ',
        body: "Votre agence est vide. Pas d'argent, pas de clients. À vous de construire votre empire.",
        week: 1,
        season: 2025,
        createdAt: new Date().toISOString(),
        read: false,
      },
    ],
    totalRevenue: 0,
    totalExpenses: 0,
    isTutorialActive: true,
    tutorialStep: 1,
  };
}

function toPersistedState(state: GameStore): PersistedGameState {
  return {
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

function normalizeLoadedState(saved: Partial<PersistedGameState>): PersistedGameState {
  const defaults = getInitialState();
  return {
    ...defaults,
    ...saved,
    agency: { ...defaults.agency, ...saved.agency },
    isTutorialActive: saved.isTutorialActive ?? false,
    tutorialStep: saved.tutorialStep ?? 0,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),
  isHydrated: false,

  initNewGame: async () => {
    const freshState = getInitialState();
    set({ ...freshState, isHydrated: true });
    await get().saveGame();
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
        set({ isHydrated: true });
        return false;
      }

      const saved = normalizeLoadedState(JSON.parse(raw) as Partial<PersistedGameState>);
      set({ ...saved, isHydrated: true });
      return true;
    } catch {
      set({ isHydrated: true });
      return false;
    }
  },

  setTutorialStep: (step: number) => {
    set({ tutorialStep: step });
    void get().saveGame();
  },

  scoutNeighborhoodTournament: async () => {
    const state = get();
    const cost = GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_COST;

    if (state.agencyBudget < cost) {
      return false;
    }

    const newAmateurs = generateNeighborhoodAmateurs(state.currentWeek, state.currentSeason);
    const nextWeek = state.currentWeek + 1;
    const nextBudget = state.agencyBudget - cost;
    const nextExpenses = state.totalExpenses + cost;

    const newMessage: GameMessage = {
      id: `msg-tournament-${Date.now()}`,
      type: 'scout',
      title: 'Tournoi de quartier',
      body: `${newAmateurs.length} jeunes talents repérés dans les tournois locaux.`,
      week: nextWeek,
      season: state.currentSeason,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const nextState: PersistedGameState = {
      ...state,
      currentWeek: nextWeek,
      agencyBudget: nextBudget,
      totalExpenses: nextExpenses,
      scoutedPlayers: [...newAmateurs, ...state.scoutedPlayers],
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

  signAmateurPlayer: async (playerId: string) => {
    const state = get();
    const player = state.scoutedPlayers.find((p) => p.id === playerId);

    if (!player || player.contract.clubId !== null) {
      return false;
    }

    const signedPlayer: Player = {
      ...player,
      isClient: true,
      agentId: AGENCY_ID,
      status: 'active',
    };

    const myPlayers = [...state.myPlayers, signedPlayer];
    const scoutedPlayers = state.scoutedPlayers.filter((p) => p.id !== playerId);
    const isFirstClient = state.myPlayers.length === 0;

    const newMessage: GameMessage = {
      id: `msg-sign-${playerId}-${Date.now()}`,
      type: 'info',
      title: 'Premier client !',
      body: `Vous représentez désormais ${signedPlayer.displayName}.`,
      week: state.currentWeek,
      season: state.currentSeason,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const nextState: PersistedGameState = {
      ...state,
      myPlayers,
      scoutedPlayers,
      messages: isFirstClient
        ? [newMessage, ...state.messages].slice(0, GAME_CONFIG.MAX_DASHBOARD_MESSAGES)
        : state.messages,
      isTutorialActive: isFirstClient ? false : state.isTutorialActive,
      tutorialStep: isFirstClient ? 0 : state.tutorialStep,
    };

    set({
      ...nextState,
      agency: syncAgency(nextState),
    });

    await get().saveGame();
    return true;
  },

  advanceTime: async () => {
    const state = get();
    let nextWeek = state.currentWeek + 1;
    let nextSeason = state.currentSeason;

    const economy = processWeeklyEconomy(state.staff, state.agency.finances.operatingCosts);
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
      });
    }

    let myPlayers = evolveAllPlayers(state.myPlayers);
    let scoutedPlayers = evolveAllPlayers(state.scoutedPlayers);

    const isSeasonEnd = nextWeek > WEEKS_PER_SEASON;
    if (isSeasonEnd) {
      myPlayers = ageAllPlayers(myPlayers);
      scoutedPlayers = ageAllPlayers(scoutedPlayers);
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
      });
    }

    const weeklyEvent = generateWeeklyEvent(nextWeek, nextSeason, myPlayers, state.clubs);
    if (weeklyEvent) {
      newMessages.push(weeklyEvent);
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
      messages,
      totalRevenue: nextRevenue,
      totalExpenses: nextExpenses,
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

/** Pendant le tutoriel, seul l'onglet Scouting est accessible (étapes 1 à 3). */
export function isTabLockedDuringTutorial(
  tabName: 'index' | 'players' | 'scouting' | 'finance',
  isTutorialActive: boolean,
  tutorialStep: number,
): boolean {
  if (!isTutorialActive || tutorialStep < 1) return false;
  if (tutorialStep <= 3) return tabName !== 'scouting';
  return false;
}

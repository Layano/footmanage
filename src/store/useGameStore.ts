import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { GAME_CONFIG, SAVE_GAME_KEY } from '@/constants/gameConfig';
import { MOCK_CLUBS, MOCK_GAME_DATA, MOCK_LEAGUES } from '@/data/mockData';
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
}

interface GameStore extends PersistedGameState {
  isHydrated: boolean;
  initNewGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  saveGame: () => Promise<void>;
  advanceTime: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function splitPlayers(players: Player[]): { myPlayers: Player[]; scoutedPlayers: Player[] } {
  return {
    myPlayers: players.filter((p) => p.isClient),
    scoutedPlayers: players.filter((p) => !p.isClient),
  };
}

function getInitialState(): PersistedGameState {
  const { myPlayers, scoutedPlayers } = splitPlayers(clone(MOCK_GAME_DATA.players));
  const agency = clone(MOCK_GAME_DATA.agency);

  return {
    currentWeek: 1,
    currentSeason: 2025,
    agencyBudget: agency.finances.balance,
    agency,
    myPlayers,
    scoutedPlayers,
    staff: clone(agency.staff),
    leagues: clone(MOCK_LEAGUES),
    clubs: clone(MOCK_CLUBS),
    messages: [
      {
        id: 'msg-welcome',
        type: 'info',
        title: 'Bienvenue',
        body: 'Votre agence est opérationnelle. Recrutez des talents et développez votre réseau.',
        week: 1,
        season: 2025,
        createdAt: new Date().toISOString(),
        read: false,
      },
    ],
    totalRevenue: 0,
    totalExpenses: 0,
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
  };
}

function evolveAllPlayers(players: Player[]): Player[] {
  return players.map((player) => tryWeeklyPlayerEvolution(player));
}

function ageAllPlayers(players: Player[]): Player[] {
  return players.map((player) => agePlayerByOneYear(player));
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

      const saved = JSON.parse(raw) as PersistedGameState;
      set({ ...saved, isHydrated: true });
      return true;
    } catch {
      set({ isHydrated: true });
      return false;
    }
  },

  advanceTime: async () => {
    const state = get();
    let nextWeek = state.currentWeek + 1;
    let nextSeason = state.currentSeason;

    // ── 1. Économie hebdomadaire ─────────────────────────────────────────────
    const economy = processWeeklyEconomy(state.staff, state.agency.finances.operatingCosts);
    let nextBudget = state.agencyBudget + economy.netChange;
    let nextRevenue = state.totalRevenue + economy.commissionIncome;
    let nextExpenses = state.totalExpenses + economy.totalExpense;

    // Message financier si commission reçue (placeholder en attendant le moteur mercato).
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

    // ── 2. Évolution des joueurs (clients + marché) ────────────────────────────
    let myPlayers = evolveAllPlayers(state.myPlayers);
    let scoutedPlayers = evolveAllPlayers(state.scoutedPlayers);

    // ── 3. Fin de saison : vieillissement ────────────────────────────────────
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

    // ── 4. Événements aléatoires ─────────────────────────────────────────────
    const weeklyEvent = generateWeeklyEvent(nextWeek, nextSeason, myPlayers, state.clubs);
    if (weeklyEvent) {
      newMessages.push(weeklyEvent);
    }

    const messages = [...newMessages, ...state.messages].slice(
      0,
      GAME_CONFIG.MAX_DASHBOARD_MESSAGES,
    );

    const updatedAgency: Agency = {
      ...state.agency,
      finances: {
        ...state.agency.finances,
        balance: nextBudget,
        totalRevenue: nextRevenue,
        totalExpenses: nextExpenses,
      },
      clientPlayerIds: myPlayers.map((p) => p.id),
    };

    set({
      currentWeek: nextWeek,
      currentSeason: nextSeason,
      agencyBudget: nextBudget,
      agency: updatedAgency,
      myPlayers,
      scoutedPlayers,
      messages,
      totalRevenue: nextRevenue,
      totalExpenses: nextExpenses,
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

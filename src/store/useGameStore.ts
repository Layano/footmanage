import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { GAME_CONFIG, SAVE_GAME_KEY, SAVE_GAME_VERSION } from '@/constants/gameConfig';
import { getCountryByCode } from '@/data/world/countries';
import { generateNeighborhoodAmateurs } from '@/engine/players/amateurGenerator';
import { buildWorldDatabase } from '@/engine/world/worldGenerator';
import { processWeeklyEconomy } from '@/engine/simulation/economyEngine';
import { generateWeeklyEvent } from '@/engine/simulation/eventGenerator';
import {
  agePlayerByOneYear,
  tryWeeklyPlayerEvolution,
} from '@/engine/simulation/evolutionEngine';
import { clearAllSaves } from '@/store/saveMigration';
import type { Agency } from '@/types/agency';
import type { Club } from '@/types/club';
import type { GameMessage } from '@/types/game';
import { WEEKS_PER_SEASON } from '@/types/game';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';
import type { Staff } from '@/types/staff';
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
}

interface GameStore extends PersistedGameState {
  isHydrated: boolean;
  startNewGame: (config: NewGameConfig) => Promise<void>;
  loadGame: () => Promise<boolean>;
  saveGame: () => Promise<void>;
  advanceTime: () => Promise<void>;
  scoutNeighborhoodTournament: () => Promise<boolean>;
  signAmateurPlayer: (playerId: string) => Promise<boolean>;
  setTutorialStep: (step: number) => void;
  resetGame: () => Promise<void>;
  revealPlayerScouting: (playerId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
      },
    ],
    totalRevenue: 0,
    totalExpenses: 0,
    isTutorialActive: true,
    tutorialStep: 1,
    gameMode: config.gameMode,
    agencyCountryCode: config.countryCode,
    hasActiveGame: true,
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
    worldPlayers: saved.worldPlayers ?? [],
    isTutorialActive: saved.isTutorialActive ?? false,
    tutorialStep: saved.tutorialStep ?? 0,
    gameMode: saved.gameMode ?? 'career',
    agencyCountryCode: saved.agencyCountryCode ?? 'FRA',
    hasActiveGame: saved.hasActiveGame ?? true,
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
      agentId: GAME_CONFIG.AGENCY_ID,
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
    let worldPlayers = evolveAllPlayers(state.worldPlayers);

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
      worldPlayers,
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

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
import { buildWorldForCountries, ensureLeagueClubs, generateCountryFootball } from '@/engine/world/worldGenerator';
import { runAcademyIntake } from '@/engine/world/academyEngine';
import { canUnlockCountry } from '@/engine/world/countryUnlock';
import { processWeeklyEconomy } from '@/engine/simulation/economyEngine';
import {
  applyMatchResultToPlayers,
  createMatchInvite,
  createMatchInviteMessage,
  createMatchSkippedMessage,
  getClubSquad,
  simulateMatchFixture,
} from '@/engine/simulation/matchEngine';
import { ensureLeagueSquads } from '@/engine/world/leagueSquadEnsurer';
import {
  adjustAgencyReputation,
  reputationDeltaForMatchAttendance,
  reputationDeltaForSigning,
  reputationDeltaForTransferDeal,
} from '@/engine/simulation/reputationEngine';
import {
  expireOldOffers,
  generateWeeklyTransferOffers,
  normalizeClubOffer,
} from '@/engine/simulation/transferOfferEngine';
import { getTransferWindowLabel, isLeagueMatchWeek, normalizeLeagueTransferWindows } from '@/engine/simulation/transferWindow';
import {
  buildCountryCompetitions,
  initializeCompetitions,
  simulateCompetitionWeek,
} from '@/engine/simulation/competitionEngine';
import { migrateLegacyWage } from '@/engine/simulation/salaryEngine';
import { evaluateClubNegotiation } from '@/engine/negotiation/clubOfferNegotiation';
import { PLAYING_TIME_ROLE_LABELS } from '@/constants/playingTime';
import type { NegotiableClubOfferTerms } from '@/types/transfer';
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
import type {
  Competition,
  CompetitionResult,
  CupFixture,
  LeagueStanding,
  Trophy,
} from '@/types/competition';
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
  unlockedCountryCodes: string[];
  hasActiveGame: boolean;
  currentTournament: NeighborhoodTournament | null;
  pendingOffers: ClubContractOffer[];
  matchFixtures: MatchFixture[];
  competitions: Competition[];
  standings: LeagueStanding[];
  competitionResults: CompetitionResult[];
  cupFixtures: CupFixture[];
  trophies: Trophy[];
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
  acceptTransferOffer: (offerId: string, terms: NegotiableClubOfferTerms) => Promise<SignPlayerResult>;
  rejectTransferOffer: (offerId: string) => Promise<void>;
  runMatchSimulation: (matchId: string) => MatchFixture | null;
  completeMatch: (matchId: string) => Promise<void>;
  setTutorialStep: (step: number) => void;
  resetGame: () => Promise<void>;
  revealPlayerScouting: (playerId: string) => void;
  unlockCountry: (countryCode: string) => Promise<{ success: boolean; reason?: string }>;
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
    unlockedCountryCodes: ['FRA'],
    hasActiveGame: false,
    currentTournament: null,
    pendingOffers: [],
    matchFixtures: [],
    competitions: [],
    standings: [],
    competitionResults: [],
    cupFixtures: [],
    trophies: [],
  };
}

function withPlayerDefaults(player: Player, clubs: Club[], leagues: League[]): Player {
  const club = clubs.find((c) => c.id === player.contract.clubId);
  const league = club ? leagues.find((l) => l.id === club.leagueId) : undefined;
  const legacyWeekly = player.contract.weeklyWage;
  const monthlyWage =
    player.contract.monthlyWage ??
    (legacyWeekly != null
      ? migrateLegacyWage(legacyWeekly, player, club, league)
      : 0);

  return {
    ...player,
    seasonMinutes: player.seasonMinutes ?? 0,
    weeklyMinutes: player.weeklyMinutes ?? 0,
    contract: {
      ...player.contract,
      monthlyWage,
    },
  };
}

function filterWorldToUnlocked(
  leagues: League[],
  clubs: Club[],
  players: Player[],
  unlockedCountryCodes: string[],
): { leagues: League[]; clubs: Club[]; players: Player[] } {
  const unlocked = new Set(unlockedCountryCodes);
  const filteredLeagues = leagues.filter((l) => unlocked.has(l.countryCode));
  const leagueIds = new Set(filteredLeagues.map((l) => l.id));
  const filteredClubs = clubs.filter(
    (c) => unlocked.has(c.countryCode) && leagueIds.has(c.leagueId),
  );
  const clubIds = new Set(filteredClubs.map((c) => c.id));
  const filteredPlayers = players.filter(
    (p) => p.contract.clubId === null || clubIds.has(p.contract.clubId),
  );
  return { leagues: filteredLeagues, clubs: filteredClubs, players: filteredPlayers };
}

function buildFreshGameState(config: NewGameConfig): PersistedGameState {
  const country = getCountryByCode(config.countryCode) ?? getCountryByCode('FRA')!;
  const unlockedCountryCodes = [config.countryCode];
  const world = buildWorldForCountries(unlockedCountryCodes);
  const worldPlayers = ensureLeagueSquads(
    world.clubs,
    world.leagues,
    world.players,
    unlockedCountryCodes,
  );
  const compInit = initializeCompetitions(
    2025,
    world.leagues,
    world.clubs,
    config.countryCode,
    unlockedCountryCodes,
  );

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
    worldPlayers,
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
    unlockedCountryCodes,
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
    competitions: compInit.competitions,
    standings: compInit.standings,
    competitionResults: [],
    cupFixtures: compInit.cupFixtures,
    trophies: [],
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
    unlockedCountryCodes: state.unlockedCountryCodes,
    hasActiveGame: state.hasActiveGame,
    currentTournament: state.currentTournament,
    pendingOffers: state.pendingOffers,
    matchFixtures: state.matchFixtures,
    competitions: state.competitions,
    standings: state.standings,
    competitionResults: state.competitionResults,
    cupFixtures: state.cupFixtures,
    trophies: state.trophies,
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
  if (!saved.saveVersion || saved.saveVersion < 7) {
    return null;
  }

  const defaults = getEmptyShellState();
  const agencyCountryCode = saved.agencyCountryCode ?? 'FRA';
  const unlockedCountryCodes = saved.unlockedCountryCodes ?? [agencyCountryCode];
  const currentSeason = saved.currentSeason ?? 2025;

  const rawLeagues = (saved.leagues ?? defaults.leagues).map(normalizeLeagueTransferWindows);
  const rawClubs = saved.clubs ?? defaults.clubs;
  const rawPlayers = saved.worldPlayers ?? defaults.worldPlayers;
  const filtered = filterWorldToUnlocked(rawLeagues, rawClubs, rawPlayers, unlockedCountryCodes);
  const leagues = filtered.leagues;
  const backfill = ensureLeagueClubs(leagues, filtered.clubs);
  const clubs = backfill.clubs;

  let competitions = saved.competitions ?? [];
  let standings = saved.standings ?? [];
  let cupFixtures = saved.cupFixtures ?? [];

  if (
    (competitions.length === 0 || backfill.added.length > 0) &&
    leagues.length > 0 &&
    clubs.length > 0
  ) {
    const compInit = initializeCompetitions(
      currentSeason,
      leagues,
      clubs,
      agencyCountryCode,
      unlockedCountryCodes,
    );
    competitions = compInit.competitions;
    standings = compInit.standings;
    cupFixtures = compInit.cupFixtures;
  }

  const mapPlayer = (p: Player) => withPlayerDefaults(p, clubs, leagues);
  const worldPlayers = ensureLeagueSquads(
    clubs,
    leagues,
    filtered.players.map(mapPlayer),
    unlockedCountryCodes,
  );

  return {
    ...defaults,
    ...saved,
    saveVersion: SAVE_GAME_VERSION,
    agency: { ...defaults.agency, ...saved.agency },
    isTutorialActive: saved.isTutorialActive ?? false,
    tutorialStep: saved.tutorialStep ?? 0,
    gameMode: saved.gameMode ?? 'career',
    agencyCountryCode,
    unlockedCountryCodes,
    hasActiveGame: saved.hasActiveGame ?? true,
    currentTournament:
      saved.currentTournament ??
      createInitialTournament(
        saved.currentWeek ?? 1,
        currentSeason,
        agencyCountryCode,
        saved.agency?.office.city ?? 'Paris',
      ),
    pendingOffers: (saved.pendingOffers ?? []).map((o) =>
      normalizeClubOffer(o as ClubContractOffer & { expectedMinutesPercent?: number }),
    ),
    matchFixtures: saved.matchFixtures ?? [],
    leagues,
    clubs,
    competitions,
    standings,
    competitionResults: saved.competitionResults ?? [],
    cupFixtures,
    trophies: saved.trophies ?? [],
    myPlayers: (saved.myPlayers ?? []).map(mapPlayer),
    scoutedPlayers: (saved.scoutedPlayers ?? []).map(mapPlayer),
    worldPlayers,
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

function tryGenerateTransferOffers(state: {
  currentWeek: number;
  currentSeason: number;
  myPlayers: Player[];
  clubs: Club[];
  leagues: League[];
  agencyCountryCode: string;
  pendingOffers: ClubContractOffer[];
}): {
  pendingOffers: ClubContractOffer[];
  myPlayers: Player[];
  messages: GameMessage[];
} {
  if (state.myPlayers.length === 0) {
    return { pendingOffers: state.pendingOffers, myPlayers: state.myPlayers, messages: [] };
  }

  const generated = generateWeeklyTransferOffers(
    state.currentWeek,
    state.currentSeason,
    state.myPlayers,
    state.clubs,
    state.leagues,
    state.agencyCountryCode,
    state.pendingOffers,
  );

  return {
    pendingOffers: [...state.pendingOffers, ...generated.offers],
    myPlayers: generated.updatedClients,
    messages: generated.messages,
  };
}

/** Simule les matchs non suivis de la semaine écoulée. */
function resolveStaleMatchFixtures(
  week: number,
  season: number,
  matchFixtures: MatchFixture[],
  clubs: Club[],
  myPlayers: Player[],
  worldPlayers: Player[],
): {
  matchFixtures: MatchFixture[];
  myPlayers: Player[];
  worldPlayers: Player[];
  messages: GameMessage[];
} {
  const messages: GameMessage[] = [];
  let nextMyPlayers = myPlayers;
  let nextWorldPlayers = worldPlayers;
  const myIds = new Set(myPlayers.map((p) => p.id));

  const pending = matchFixtures.filter(
    (f) => f.week === week && f.season === season && f.status === 'scheduled',
  );

  if (pending.length === 0) {
    return { matchFixtures, myPlayers, worldPlayers, messages };
  }

  const updated = matchFixtures.map((fixture) => {
    if (fixture.week !== week || fixture.season !== season || fixture.status !== 'scheduled') {
      return fixture;
    }

    const homeClub = clubs.find((c) => c.id === fixture.homeClubId);
    const awayClub = clubs.find((c) => c.id === fixture.awayClubId);
    if (!homeClub || !awayClub) return fixture;

    const allPlayers = [...nextWorldPlayers, ...nextMyPlayers];
    const homeSquad = getClubSquad(fixture.homeClubId, allPlayers);
    const awaySquad = getClubSquad(fixture.awayClubId, allPlayers);
    const client = nextMyPlayers.find((p) => p.id === fixture.clientPlayerId);

    const { result, scoutProfiles } = simulateMatchFixture(
      fixture,
      homeClub,
      awayClub,
      homeSquad,
      awaySquad,
      myIds,
      client?.playingTimeRole,
    );

    const resolvedFixture: MatchFixture = {
      ...fixture,
      result,
      scoutProfiles,
      status: 'skipped',
    };

    const applied = applyMatchResultToPlayers(resolvedFixture, nextMyPlayers, nextWorldPlayers);
    nextMyPlayers = applied.myPlayers.map((p) =>
      p.id === fixture.clientPlayerId ? tryWeeklyPlayerEvolution(p) : p,
    );
    nextWorldPlayers = applied.worldPlayers;

    if (client) {
      messages.push(
        createMatchSkippedMessage(
          resolvedFixture,
          homeClub,
          awayClub,
          client,
          scoutProfiles.length,
        ),
      );
    }

    return resolvedFixture;
  });

  return {
    matchFixtures: updated,
    myPlayers: nextMyPlayers,
    worldPlayers: nextWorldPlayers,
    messages,
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
      let raw = await AsyncStorage.getItem(SAVE_GAME_KEY);
      if (!raw) {
        raw = await AsyncStorage.getItem('@footmanage/save-v8');
      }
      if (!raw) {
        raw = await AsyncStorage.getItem('@footmanage/save-v7');
      }
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

      const hydrated = get();
      const offers = tryGenerateTransferOffers(hydrated);
      if (offers.messages.length > 0) {
        set({
          pendingOffers: offers.pendingOffers,
          myPlayers: offers.myPlayers,
          messages: [...offers.messages, ...hydrated.messages].slice(
            0,
            GAME_CONFIG.MAX_DASHBOARD_MESSAGES,
          ),
        });
        await get().saveGame();
      }

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
    }, state.clubs, state.leagues);

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

    const offers = tryGenerateTransferOffers({
      ...nextState,
      pendingOffers: state.pendingOffers,
    });

    const stateWithOffers: PersistedGameState = {
      ...nextState,
      myPlayers: offers.myPlayers,
      pendingOffers: offers.pendingOffers,
      messages: [...offers.messages, ...nextState.messages].slice(
        0,
        GAME_CONFIG.MAX_DASHBOARD_MESSAGES,
      ),
    };

    set({
      ...stateWithOffers,
      agency: syncAgency({ ...stateWithOffers, agency: nextAgency }),
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
    }, state.clubs, state.leagues);

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

  acceptTransferOffer: async (
    offerId: string,
    terms: NegotiableClubOfferTerms,
  ): Promise<SignPlayerResult> => {
    const state = get();
    const offer = state.pendingOffers.find((o) => o.id === offerId && o.status === 'pending');
    if (!offer) return { success: false, reason: 'Offre introuvable.' };

    const club = state.clubs.find((c) => c.id === offer.clubId);
    const playerIndex = state.myPlayers.findIndex((p) => p.id === offer.playerId);
    if (!club || playerIndex < 0) return { success: false, reason: 'Joueur introuvable.' };

    const player = state.myPlayers[playerIndex]!;
    const evaluation = evaluateClubNegotiation(offer, terms, club, player);
    if (!evaluation.accepted) {
      return { success: false, reason: evaluation.feedback };
    }

    const commission =
      offer.type === 'transfer' && player.representationContract
        ? Math.round((terms.fee * player.representationContract.transferCommissionPercent) / 100)
        : 0;

    const updatedPlayer: Player = {
      ...player,
      contract: {
        ...player.contract,
        clubId: offer.clubId,
        monthlyWage: terms.monthlyWage,
        endDate: `${state.currentSeason + terms.contractYears}-06-30`,
      },
      currentTeam: club.name,
      playingTimeRole: terms.playingTimeRole,
      weeklyMinutes: 0,
      lastTransferredWeek: state.currentWeek,
      lastTransferredSeason: state.currentSeason,
    };

    const myPlayers = [...state.myPlayers];
    myPlayers[playerIndex] = updatedPlayer;

    const pendingOffers = state.pendingOffers.map((o) =>
      o.id === offerId
        ? { ...o, status: 'accepted' as const, ...terms }
        : o.playerId === offer.playerId && o.status === 'pending'
          ? { ...o, status: 'rejected' as const }
          : o,
    );

    const nextAgency = adjustAgencyReputation(
      state.agency,
      reputationDeltaForTransferDeal(terms.fee),
    );

    const roleLabel = PLAYING_TIME_ROLE_LABELS[terms.playingTimeRole];
    const newMessage: GameMessage = {
      id: `msg-offer-accepted-${offerId}`,
      type: offer.type === 'loan' ? 'loan' : 'transfer',
      title: offer.type === 'loan' ? 'Prêt conclu' : 'Transfert conclu',
      body: `${player.displayName} rejoint ${club.name} (${roleLabel}, ${terms.monthlyWage.toLocaleString('fr-FR')} €/mois)${commission > 0 ? ` · Commission : ${commission.toLocaleString('fr-FR')} €` : ''}.`,
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
    return { success: true };
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
    const client = state.myPlayers.find((p) => p.id === fixture.clientPlayerId);
    const myIds = new Set(state.myPlayers.map((p) => p.id));

    const { result, scoutProfiles } = simulateMatchFixture(
      fixture,
      homeClub,
      awayClub,
      homeSquad,
      awaySquad,
      myIds,
      client?.playingTimeRole,
    );

    const matchFixtures = state.matchFixtures.map((m) =>
      m.id === matchId ? { ...m, result, scoutProfiles } : m,
    );
    set({ matchFixtures });
    void get().saveGame();
    return { ...fixture, result, scoutProfiles };
  },

  completeMatch: async (matchId: string) => {
    const state = get();
    const fixture = state.matchFixtures.find((m) => m.id === matchId);
    if (!fixture?.result || fixture.status === 'watched' || fixture.status === 'skipped') return;

    const applied = applyMatchResultToPlayers(fixture, state.myPlayers, state.worldPlayers);
    let myPlayers = applied.myPlayers.map((p) =>
      p.id === fixture.clientPlayerId ? tryWeeklyPlayerEvolution(p) : p,
    );

    const allStats = [...fixture.result.homeStats, ...fixture.result.awayStats];
    const clientStat = allStats.find((s) => s.playerId === fixture.clientPlayerId);
    const repDelta = clientStat ? reputationDeltaForMatchAttendance(clientStat.rating) : 0;
    const nextAgency = adjustAgencyReputation(state.agency, repDelta);

    const matchFixtures = state.matchFixtures.map((m) =>
      m.id === matchId ? { ...m, status: 'watched' as const } : m,
    );

    const nextState: PersistedGameState = {
      ...state,
      myPlayers,
      worldPlayers: applied.worldPlayers,
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

  unlockCountry: async (countryCode: string) => {
    const state = get();
    const country = getCountryByCode(countryCode);
    if (!country) {
      return { success: false, reason: 'Pays introuvable.' };
    }

    const check = canUnlockCountry(
      country,
      state.agencyCountryCode,
      state.unlockedCountryCodes,
      state.agencyBudget,
      state.agency.reputation,
    );
    if (!check.allowed || check.cost == null) {
      return { success: false, reason: check.reason ?? 'Déblocage impossible.' };
    }

    const chunk = generateCountryFootball(countryCode);
    const nextUnlocked = [...state.unlockedCountryCodes, countryCode];
    const nextLeagues = [...state.leagues, ...chunk.leagues];
    const nextClubs = [...state.clubs, ...chunk.clubs];
    const nextWorldPlayers = ensureLeagueSquads(
      nextClubs,
      nextLeagues,
      [...state.worldPlayers, ...chunk.players],
      nextUnlocked,
    );

    const countryComps = buildCountryCompetitions(
      state.currentSeason,
      countryCode,
      nextLeagues,
      nextClubs,
    );

    const newMessage: GameMessage = {
      id: `msg-unlock-${countryCode}-${Date.now()}`,
      type: 'scout',
      title: `Marché débloqué — ${country.name}`,
      body: `Championnats, clubs et effectifs générés pour ${country.name}. Coût : ${check.cost.toLocaleString('fr-FR')} €.`,
      week: state.currentWeek,
      season: state.currentSeason,
      createdAt: new Date().toISOString(),
      read: false,
      action: 'none',
    };

    const nextState: PersistedGameState = {
      ...state,
      unlockedCountryCodes: nextUnlocked,
      leagues: nextLeagues,
      clubs: nextClubs,
      worldPlayers: nextWorldPlayers,
      competitions: [...state.competitions, ...countryComps.competitions],
      standings: [...state.standings, ...countryComps.standings],
      cupFixtures: [...state.cupFixtures, ...countryComps.cupFixtures],
      agencyBudget: state.agencyBudget - check.cost,
      totalExpenses: state.totalExpenses + check.cost,
      messages: [newMessage, ...state.messages].slice(0, GAME_CONFIG.MAX_DASHBOARD_MESSAGES),
    };

    set({ ...nextState, agency: syncAgency(nextState) });
    await get().saveGame();
    return { success: true };
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

    let myPlayers = evolveAllPlayers(state.myPlayers);
    let scoutedPlayers = evolveAllPlayers(state.scoutedPlayers);
    let worldPlayers = evolveAllPlayers(state.worldPlayers);

    const staleMatches = resolveStaleMatchFixtures(
      state.currentWeek,
      state.currentSeason,
      state.matchFixtures,
      state.clubs,
      myPlayers,
      worldPlayers,
    );
    let matchFixtures = staleMatches.matchFixtures;
    myPlayers = staleMatches.myPlayers;
    worldPlayers = staleMatches.worldPlayers;
    newMessages.push(...staleMatches.messages);

    let pendingOffers = state.pendingOffers;

    const transferWindowLabel = getTransferWindowLabel(nextWeek, state.leagues, state.agencyCountryCode);
    if (transferWindowLabel && myPlayers.length > 0) {
      const generated = generateWeeklyTransferOffers(
        nextWeek,
        nextSeason,
        myPlayers,
        state.clubs,
        state.leagues,
        state.agencyCountryCode,
        pendingOffers,
      );
      pendingOffers = [...pendingOffers, ...generated.offers];
      myPlayers = generated.updatedClients;
      newMessages.push(...generated.messages);
    }

    const expired = expireOldOffers(pendingOffers, nextWeek);
    pendingOffers = expired.offers;

    let competitions = state.competitions;
    let standings = state.standings;
    let competitionResults = [...state.competitionResults];
    let cupFixtures = state.cupFixtures;
    let trophies = state.trophies;

    // Simule la journée de la semaine écoulée, en intégrant les matchs clients
    // (assistés ou auto-simulés) dans les classements.
    if (isLeagueMatchWeek(state.currentWeek) && competitions.length > 0) {
      const clientResults = matchFixtures
        .filter(
          (f) =>
            f.week === state.currentWeek &&
            f.season === state.currentSeason &&
            f.result != null,
        )
        .map((f) => ({
          homeClubId: f.homeClubId,
          awayClubId: f.awayClubId,
          homeScore: f.result!.homeScore,
          awayScore: f.result!.awayScore,
        }));

      const compSim = simulateCompetitionWeek(
        state.currentWeek,
        state.currentSeason,
        competitions,
        standings,
        cupFixtures,
        state.clubs,
        state.leagues,
        trophies,
        clientResults,
      );
      standings = compSim.standings;
      cupFixtures = compSim.cupFixtures;
      competitionResults = [...competitionResults, ...compSim.results].slice(-400);
      trophies = compSim.trophies;
      for (const msg of compSim.messages.slice(0, 3)) {
        newMessages.push({
          id: `msg-comp-${nextWeek}-${msg.slice(0, 12)}-${Date.now()}`,
          type: 'info',
          title: 'Compétitions',
          body: msg,
          week: nextWeek,
          season: nextSeason,
          createdAt: new Date().toISOString(),
          read: false,
          action: 'none',
        });
      }
    }

    let matchFixturesForWeek = [...matchFixtures];
    if (isLeagueMatchWeek(nextWeek)) {
      for (const client of myPlayers) {
        if (!client.contract.clubId) continue;
        const fixture = createMatchInvite(client, state.clubs, worldPlayers, nextWeek, nextSeason);
        if (!fixture || matchFixturesForWeek.some((m) => m.id === fixture.id)) continue;
        const home = state.clubs.find((c) => c.id === fixture.homeClubId);
        const away = state.clubs.find((c) => c.id === fixture.awayClubId);
        if (!home || !away) continue;
        matchFixturesForWeek.push(fixture);
        newMessages.push(createMatchInviteMessage(fixture, home, away, client));
      }
    }
    matchFixtures = matchFixturesForWeek;

    const isSeasonEnd = nextWeek > WEEKS_PER_SEASON;
    if (isSeasonEnd) {
      myPlayers = ageAllPlayers(myPlayers);
      scoutedPlayers = ageAllPlayers(scoutedPlayers);
      worldPlayers = ageAllPlayers(worldPlayers);
      nextWeek = 1;
      nextSeason += 1;

      const academy = runAcademyIntake(
        state.clubs,
        state.leagues,
        worldPlayers,
        state.unlockedCountryCodes,
        nextSeason,
      );
      worldPlayers = academy.players;
      for (const msg of academy.messages) {
        newMessages.push({
          id: `msg-academy-${nextSeason}-${Date.now()}`,
          type: 'info',
          title: 'Académies',
          body: msg,
          week: nextWeek,
          season: nextSeason,
          createdAt: new Date().toISOString(),
          read: false,
          action: 'none',
        });
      }

      const compInit = initializeCompetitions(
        nextSeason,
        state.leagues,
        state.clubs,
        state.agencyCountryCode,
        state.unlockedCountryCodes,
      );
      competitions = compInit.competitions;
      standings = compInit.standings;
      cupFixtures = compInit.cupFixtures;
      competitionResults = [];

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
      competitions,
      standings,
      competitionResults,
      cupFixtures,
      trophies,
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
  tabName: 'index' | 'players' | 'scouting' | 'finance' | 'competitions',
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

/** Joueurs du marché pour un pays débloqué (hors clients et tournois locaux). */
export function getWorldMarketPlayers(countryCode?: string): Player[] {
  const state = useGameStore.getState();
  const code = countryCode ?? state.agencyCountryCode;
  if (!state.unlockedCountryCodes.includes(code)) return [];

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

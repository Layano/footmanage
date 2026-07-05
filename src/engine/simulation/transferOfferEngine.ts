import { GAME_CONFIG } from '@/constants/gameConfig';
import {
  formatOfferWindowKey,
  getTransferWindowKey,
  minutesPercentToRole,
  pickRandomPlayingTimeRole,
  PLAYING_TIME_ROLE_LABELS,
} from '@/constants/playingTime';
import type { Club } from '@/types/club';
import type { GameMessage } from '@/types/game';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';
import type { ClubContractOffer, PerformanceBonusType } from '@/types/transfer';
import { estimateMonthlyWage } from './salaryEngine';
import { isCountryInTransferWindow } from './transferWindow';
import { isGoalkeeper } from '@/types/player';
import { overallToDisplay } from './salaryEngine';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Choisit un club adapté au niveau du joueur :
 * - Jeunes faibles → clubs juniors
 * - Faibles adultes → petits clubs pros
 * - Sinon → club dont la réputation correspond au niveau (±15)
 */
function pickClubForPlayer(
  client: Player,
  countryClubs: Club[],
  leagues: League[],
): Club | null {
  if (countryClubs.length === 0) return null;

  const display = overallToDisplay(client.overallRating);
  const potentialDisplay = overallToDisplay(client.potentialRating);
  const juniorLeagueIds = new Set(
    leagues.filter((l) => l.tier === 'junior').map((l) => l.id),
  );
  const juniorClubs = countryClubs.filter((c) => juniorLeagueIds.has(c.leagueId));
  const proClubs = countryClubs.filter((c) => !juniorLeagueIds.has(c.leagueId));

  // Avant 18 ans, seuls les vrais talents passent pro.
  if (client.age < 18) {
    const isTrueTalent = display >= 10 || potentialDisplay >= 14;
    if (!isTrueTalent && juniorClubs.length > 0) {
      return juniorClubs[randomInt(0, juniorClubs.length - 1)]!;
    }
  }

  if (display <= 6 && client.age <= 19 && juniorClubs.length > 0) {
    return juniorClubs[randomInt(0, juniorClubs.length - 1)]!;
  }

  if (display <= 7) {
    const weak = proClubs.filter((c) => c.reputation <= 45);
    const pool = weak.length > 0 ? weak : juniorClubs.length > 0 ? juniorClubs : proClubs;
    return pool[randomInt(0, pool.length - 1)] ?? null;
  }

  const targetRep = Math.min(95, display * 5 + 5);
  const suitable = proClubs.filter(
    (c) => Math.abs(c.reputation - targetRep) <= 15,
  );
  const pool = suitable.length > 0 ? suitable : proClubs;
  return pool[randomInt(0, pool.length - 1)] ?? null;
}

function pickBonusType(player: Player): PerformanceBonusType {
  if (isGoalkeeper(player)) return 'clean_sheet';
  if (player.position === 'CB' || player.position === 'DM') return 'clean_sheet';
  if (player.position === 'ST' || player.position === 'WING') return 'goal';
  return 'appearance';
}

/**
 * Indemnité de transfert réaliste : valeur marchande modulée par l'âge,
 * la marge de progression et le budget du club acheteur.
 */
function estimateTransferFee(player: Player, club: Club): number {
  if (!player.contract.clubId) return 0;

  const ageFactor =
    player.age < 21 ? 1.3 : player.age < 25 ? 1.15 : player.age < 29 ? 1 : player.age < 32 ? 0.65 : 0.35;
  const growthMargin = player.potentialRating - player.overallRating;
  const potentialFactor = growthMargin > 20 ? 1.25 : growthMargin > 10 ? 1.1 : 1;
  const negotiationNoise = 0.85 + Math.random() * 0.3;

  const raw = player.marketValue * ageFactor * potentialFactor * negotiationNoise;
  const budgetCap = club.budget * 0.35;
  return Math.max(1_000, Math.round(Math.min(raw, budgetCap)));
}

function createOfferMessage(offer: ClubContractOffer, player: Player, club: Club): GameMessage {
  const isLoan = offer.type === 'loan';
  const roleLabel = PLAYING_TIME_ROLE_LABELS[offer.playingTimeRole];
  const bonusLabel =
    offer.bonusType === 'goal'
      ? `${offer.performanceBonus} €/but`
      : offer.bonusType === 'clean_sheet'
        ? `${offer.performanceBonus} €/clean sheet`
        : `${offer.performanceBonus} €/match`;

  return {
    id: `msg-offer-${offer.id}`,
    type: isLoan ? 'loan' : 'transfer',
    title: isLoan ? `Offre de prêt — ${club.shortName}` : `Offre de transfert — ${club.shortName}`,
    body: `${club.name} propose ${player.displayName} : ${roleLabel}, ${offer.monthlyWage.toLocaleString('fr-FR')} €/mois, prime ${bonusLabel}${isLoan ? ', prêt sans indemnité' : offer.fee > 0 ? `, prix ${offer.fee.toLocaleString('fr-FR')} €` : ''}.`,
    week: offer.week,
    season: offer.season,
    createdAt: new Date().toISOString(),
    read: false,
    playerId: player.id,
    action: isLoan ? 'loan_offer' : 'transfer_offer',
    offerId: offer.id,
  };
}

function canReceiveOfferInWindow(client: Player, week: number, season: number): boolean {
  const window = getTransferWindowKey(week);
  if (!window) return false;

  const windowKey = formatOfferWindowKey(season, window);
  if (client.lastOfferWindowKey === windowKey) return false;

  if (client.lastTransferredSeason === season && client.lastTransferredWeek != null) {
    const tw = getTransferWindowKey(client.lastTransferredWeek);
    if (tw === 'summer' && window === 'summer') return false;
    if (tw === 'winter' && window === 'winter') return false;
    if (tw === 'summer' && window === 'winter' && client.lastTransferredWeek <= 4) return false;
  }

  if (
    client.lastTransferredSeason === season &&
    client.lastTransferredWeek != null &&
    week - client.lastTransferredWeek < GAME_CONFIG.TRANSFER_COOLDOWN_WEEKS
  ) {
    return false;
  }

  return true;
}

/** Génère au plus une offre par joueur et par fenêtre mercato (été/hiver). */
export function generateWeeklyTransferOffers(
  week: number,
  season: number,
  clients: Player[],
  clubs: Club[],
  leagues: League[],
  countryCode: string,
  existingOffers: ClubContractOffer[],
): { offers: ClubContractOffer[]; messages: GameMessage[]; updatedClients: Player[] } {
  if (!isCountryInTransferWindow(week, leagues, countryCode)) {
    return { offers: [], messages: [], updatedClients: clients };
  }

  const countryClubs = clubs.filter((c) => c.countryCode === countryCode);
  if (countryClubs.length === 0 || clients.length === 0) {
    return { offers: [], messages: [], updatedClients: clients };
  }

  const window = getTransferWindowKey(week)!;
  const windowKey = formatOfferWindowKey(season, window);

  const offers: ClubContractOffer[] = [];
  const messages: GameMessage[] = [];
  const updatedClients = clients.map((client) => {
    const hasPendingForPlayer = existingOffers.some(
      (o) => o.playerId === client.id && o.status === 'pending',
    );
    if (hasPendingForPlayer || !canReceiveOfferInWindow(client, week, season)) {
      return client;
    }

    const club = pickClubForPlayer(client, countryClubs, leagues);
    if (!club) return client;
    const league = leagues.find((l) => l.id === club.leagueId);
    const isLoan = Math.random() < 0.3;
    const bonusType = pickBonusType(client);
    const playingTimeRole = pickRandomPlayingTimeRole();
    const monthlyWage = estimateMonthlyWage(client, club, league);
    // Les prêts sont sans indemnité ; un agent libre ne coûte rien.
    const fee = isLoan ? 0 : estimateTransferFee(client, club);

    const bonusBase = Math.max(20, Math.round(monthlyWage * 0.05));
    const bonusMax = Math.max(bonusBase + 10, Math.round(monthlyWage * 0.25));

    const terms = {
      monthlyWage,
      fee,
      playingTimeRole,
      performanceBonus: randomInt(bonusBase, bonusMax),
      contractYears: isLoan ? 1 : randomInt(2, 4),
    };

    const offer: ClubContractOffer = {
      id: `offer-${season}-${week}-${client.id}-${Date.now()}`,
      type: isLoan ? 'loan' : 'transfer',
      playerId: client.id,
      clubId: club.id,
      bonusType,
      week,
      season,
      expiresWeek:
        window === 'summer' ? GAME_CONFIG.TRANSFER_SUMMER_END : GAME_CONFIG.TRANSFER_WINTER_END,
      status: 'pending',
      originalTerms: { ...terms },
      ...terms,
    };

    offers.push(offer);
    messages.push(createOfferMessage(offer, client, club));

    return { ...client, lastOfferWindowKey: windowKey };
  });

  return { offers, messages, updatedClients };
}

/** Expire les offres dépassées. */
export function expireOldOffers(
  offers: ClubContractOffer[],
  currentWeek: number,
): { offers: ClubContractOffer[]; expiredIds: string[] } {
  const expiredIds: string[] = [];
  const updated = offers.map((o) => {
    if (o.status === 'pending' && currentWeek > o.expiresWeek) {
      expiredIds.push(o.id);
      return { ...o, status: 'expired' as const };
    }
    return o;
  });
  return { offers: updated, expiredIds };
}

/** Normalise une offre chargée (migration attributs / salaires). */
export function normalizeClubOffer(
  offer: ClubContractOffer & { expectedMinutesPercent?: number; weeklyWage?: number },
): ClubContractOffer {
  const playingTimeRole =
    offer.playingTimeRole ??
    (offer.expectedMinutesPercent != null
      ? minutesPercentToRole(offer.expectedMinutesPercent)
      : pickRandomPlayingTimeRole());

  const legacyWage = offer.weeklyWage ?? offer.originalTerms?.weeklyWage;
  const monthlyWage =
    offer.monthlyWage ??
    offer.originalTerms?.monthlyWage ??
    (legacyWage != null
      ? legacyWage > 5_000
        ? Math.round(legacyWage / 4)
        : legacyWage * 4
      : 1_000);

  const terms = {
    monthlyWage,
    fee: offer.fee,
    playingTimeRole,
    performanceBonus: offer.performanceBonus,
    contractYears: offer.contractYears,
  };

  return {
    ...offer,
    originalTerms: offer.originalTerms
      ? { ...offer.originalTerms, monthlyWage: offer.originalTerms.monthlyWage ?? monthlyWage }
      : terms,
    ...terms,
  };
}

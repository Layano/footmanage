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
import { isCountryInTransferWindow, isOfferGenerationWeek } from './transferWindow';
import { isGoalkeeper } from '@/types/player';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickBonusType(player: Player): PerformanceBonusType {
  if (isGoalkeeper(player)) return 'clean_sheet';
  if (player.position === 'CB' || player.position === 'DM') return 'clean_sheet';
  if (player.position === 'ST' || player.position === 'WING') return 'goal';
  return 'appearance';
}

function estimateWeeklyWage(player: Player, club: Club): number {
  const base = Math.round((player.overallRating / 99) * club.wageBudget * 0.08);
  return Math.max(500, Math.min(base, club.wageBudget * 0.15));
}

function estimateTransferFee(player: Player, club: Club): number {
  const talent = player.overallRating / 99;
  const budgetFactor = club.budget / 1_000_000;
  return Math.round(player.marketValue * (0.5 + talent) * Math.min(budgetFactor, 3));
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
    body: `${club.name} propose ${player.displayName} : ${roleLabel}, ${offer.weeklyWage.toLocaleString('fr-FR')} €/sem., prime ${bonusLabel}${offer.fee > 0 ? `, ${isLoan ? 'indemnité prêt' : 'prix'} ${offer.fee.toLocaleString('fr-FR')} €` : ''}.`,
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

/** Génère au plus une offre par joueur au début de chaque mercato. */
export function generateWeeklyTransferOffers(
  week: number,
  season: number,
  clients: Player[],
  clubs: Club[],
  leagues: League[],
  countryCode: string,
  existingOffers: ClubContractOffer[],
): { offers: ClubContractOffer[]; messages: GameMessage[]; updatedClients: Player[] } {
  if (!isCountryInTransferWindow(week, leagues, countryCode) || !isOfferGenerationWeek(week)) {
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

    const club = countryClubs[randomInt(0, countryClubs.length - 1)]!;
    const isLoan = Math.random() < 0.3;
    const bonusType = pickBonusType(client);
    const playingTimeRole = pickRandomPlayingTimeRole();
    const weeklyWage = estimateWeeklyWage(client, club);
    const fee = isLoan
      ? randomInt(5_000, 50_000)
      : client.contract.clubId
        ? estimateTransferFee(client, club)
        : randomInt(0, Math.round(estimateTransferFee(client, club) * 0.3));

    const terms = {
      weeklyWage,
      fee,
      playingTimeRole,
      performanceBonus: randomInt(200, bonusType === 'appearance' ? 800 : 3_000),
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

/** Normalise une offre chargée (migration v6). */
export function normalizeClubOffer(
  offer: ClubContractOffer & { expectedMinutesPercent?: number },
): ClubContractOffer {
  const playingTimeRole =
    offer.playingTimeRole ??
    (offer.expectedMinutesPercent != null
      ? minutesPercentToRole(offer.expectedMinutesPercent)
      : pickRandomPlayingTimeRole());

  const terms = {
    weeklyWage: offer.weeklyWage,
    fee: offer.fee,
    playingTimeRole,
    performanceBonus: offer.performanceBonus,
    contractYears: offer.contractYears,
  };

  return {
    ...offer,
    originalTerms: offer.originalTerms ?? terms,
    ...terms,
  };
}

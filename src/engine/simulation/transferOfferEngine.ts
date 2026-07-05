import { GAME_CONFIG } from '@/constants/gameConfig';
import type { Club } from '@/types/club';
import type { GameMessage } from '@/types/game';
import type { League } from '@/types/league';
import type { Player } from '@/types/player';
import type { ClubContractOffer, PerformanceBonusType } from '@/types/transfer';
import { isCountryInTransferWindow } from './transferWindow';
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
    body: `${club.name} propose ${player.displayName} : ${offer.expectedMinutesPercent}% temps de jeu, ${offer.weeklyWage.toLocaleString('fr-FR')} €/sem., prime ${bonusLabel}${offer.fee > 0 ? `, ${isLoan ? 'indemnité prêt' : 'prix'} ${offer.fee.toLocaleString('fr-FR')} €` : ''}.`,
    week: offer.week,
    season: offer.season,
    createdAt: new Date().toISOString(),
    read: false,
    playerId: player.id,
    action: isLoan ? 'loan_offer' : 'transfer_offer',
    offerId: offer.id,
  };
}

/** Génère des offres mercato pour les clients de l'agence. */
export function generateWeeklyTransferOffers(
  week: number,
  season: number,
  clients: Player[],
  clubs: Club[],
  leagues: League[],
  countryCode: string,
): { offers: ClubContractOffer[]; messages: GameMessage[] } {
  if (!isCountryInTransferWindow(week, leagues, countryCode)) {
    return { offers: [], messages: [] };
  }

  const countryClubs = clubs.filter((c) => c.countryCode === countryCode);
  if (countryClubs.length === 0 || clients.length === 0) {
    return { offers: [], messages: [] };
  }

  const offers: ClubContractOffer[] = [];
  const messages: GameMessage[] = [];

  for (const client of clients) {
    if (Math.random() > GAME_CONFIG.TRANSFER_OFFER_CHANCE_PER_CLIENT) continue;

    const club = countryClubs[randomInt(0, countryClubs.length - 1)]!;
    const isLoan = Math.random() < 0.35;
    const bonusType = pickBonusType(client);
    const minutesPercent = randomInt(25, 85);
    const weeklyWage = estimateWeeklyWage(client, club);
    const fee = isLoan
      ? randomInt(5_000, 50_000)
      : client.contract.clubId
        ? estimateTransferFee(client, club)
        : randomInt(0, Math.round(estimateTransferFee(client, club) * 0.3));

    const offer: ClubContractOffer = {
      id: `offer-${season}-${week}-${client.id}-${Date.now()}`,
      type: isLoan ? 'loan' : 'transfer',
      playerId: client.id,
      clubId: club.id,
      weeklyWage,
      fee,
      expectedMinutesPercent: minutesPercent,
      performanceBonus: randomInt(200, bonusType === 'appearance' ? 800 : 3_000),
      bonusType,
      contractYears: isLoan ? 1 : randomInt(2, 4),
      week,
      season,
      expiresWeek: week + GAME_CONFIG.OFFER_EXPIRY_WEEKS,
      status: 'pending',
    };

    offers.push(offer);
    messages.push(createOfferMessage(offer, client, club));
  }

  return { offers, messages };
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

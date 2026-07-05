import type { Club } from '../../types/club';
import type { GameMessage } from '../../types/game';
import type { Player } from '../../types/player';
import { GAME_CONFIG } from '../../constants/gameConfig';

const TRANSFER_MESSAGES = [
  (player: Player, club: Club) => ({
    title: 'Offre de transfert',
    body: `${club.name} souhaite recruter ${player.displayName} pour la fin de saison.`,
  }),
  (player: Player, club: Club) => ({
    title: 'Intérêt confirmé',
    body: `${club.name} a pris des renseignements sur ${player.displayName}.`,
  }),
];

const CONTRACT_MESSAGES = [
  (player: Player, club: Club) => ({
    title: 'Renouvellement de contrat',
    body: `${club.name} propose une extension à ${player.displayName}.`,
  }),
];

const SCOUT_MESSAGES = [
  () => ({
    title: 'Pépite repérée',
    body: 'Votre recruteur a identifié un jeune talent prometteur en championnat étranger.',
  }),
  () => ({
    title: 'Rapport de scouting',
    body: "Un nouveau rapport de scouting est disponible dans l'onglet Mercato.",
  }),
];

const INFO_MESSAGES = [
  () => ({
    title: 'Actualité mercato',
    body: "Le mercato estival s'annonce animé selon les dirigeants des grands clubs.",
  }),
  () => ({
    title: "Réunion d'agence",
    body: 'Votre équipe se réunit pour planifier les prochaines négociations.',
  }),
];

function createMessage(
  type: GameMessage['type'],
  title: string,
  body: string,
  week: number,
  season: number,
  playerId?: string,
): GameMessage {
  return {
    id: `msg-${season}-${week}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    body,
    week,
    season,
    createdAt: new Date().toISOString(),
    read: false,
    playerId,
    action: 'none',
  };
}

/** Génère un événement aléatoire pour la semaine (10 % de chance). */
export function generateWeeklyEvent(
  week: number,
  season: number,
  myPlayers: Player[],
  clubs: Club[],
): GameMessage | null {
  if (Math.random() > GAME_CONFIG.WEEKLY_EVENT_CHANCE) {
    return null;
  }

  if (myPlayers.length === 0 || clubs.length === 0) {
    const info = INFO_MESSAGES[Math.floor(Math.random() * INFO_MESSAGES.length)]();
    return createMessage('info', info.title, info.body, week, season);
  }

  const roll = Math.random();
  const randomPlayer = myPlayers[Math.floor(Math.random() * myPlayers.length)];
  const randomClub = clubs[Math.floor(Math.random() * clubs.length)];

  if (roll < 0.4) {
    const template = TRANSFER_MESSAGES[Math.floor(Math.random() * TRANSFER_MESSAGES.length)];
    const { title, body } = template(randomPlayer, randomClub);
    return createMessage('transfer', title, body, week, season, randomPlayer.id);
  }

  if (roll < 0.65) {
    const template = CONTRACT_MESSAGES[Math.floor(Math.random() * CONTRACT_MESSAGES.length)];
    const { title, body } = template(randomPlayer, randomClub);
    return createMessage('contract', title, body, week, season, randomPlayer.id);
  }

  if (roll < 0.85) {
    const template = SCOUT_MESSAGES[Math.floor(Math.random() * SCOUT_MESSAGES.length)];
    const { title, body } = template();
    return createMessage('scout', title, body, week, season);
  }

  const template = INFO_MESSAGES[Math.floor(Math.random() * INFO_MESSAGES.length)];
  const { title, body } = template();
  return createMessage('info', title, body, week, season);
}

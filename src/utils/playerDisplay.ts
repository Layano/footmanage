import type { Club } from '@/types/club';
import type { Player } from '@/types/player';

const JUNIOR_LEAGUE_LABEL = 'Ligue Junior';

/** Libellé d'équipe pour l'affichage (club pro, junior ou sans club). */
export function getPlayerTeamLabel(player: Player, club?: Club): string {
  if (player.currentTeam) {
    return player.currentTeam;
  }

  if (player.contract.clubId && club) {
    return club.name;
  }

  if (player.age <= 17 && player.contract.clubId === null) {
    return `Sans club · ${JUNIOR_LEAGUE_LABEL}`;
  }

  if (player.status === 'free_agent') {
    return 'Agent libre';
  }

  return 'Sans club';
}

export function isJuniorPlayer(player: Player): boolean {
  return player.age <= 17 && (player.currentTeam?.includes(JUNIOR_LEAGUE_LABEL) ?? false);
}

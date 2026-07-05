import type { Player } from '@/types/player';
import type { Staff } from '@/types/staff';

export interface PotentialEstimate {
  /** Verdict qualitatif (jamais la note exacte). */
  label: string;
  /** Fourchette estimée — null sans recruteur. */
  rangeText: string | null;
  /** Étoiles approximatives (★/☆) ou "?" */
  stars: string;
  /** Confiance de l'estimation. */
  confidence: 'none' | 'low' | 'medium' | 'high';
  /** Message d'aide si pas de scout. */
  hint: string | null;
}

function getScoutRevealBonus(staff: Staff[]): number {
  return staff
    .filter((s) => s.role === 'scout')
    .reduce((max, scout) => {
      const bonus = scout.bonuses.potentialRevealBonus ?? 10;
      const levelBonus = scout.level * 5;
      return Math.max(max, bonus + levelBonus);
    }, 0);
}

function toDisplayRating(rating99: number): number {
  return Math.max(1, Math.min(20, Math.round(rating99 / 5)));
}

function buildStars(score: number): string {
  const filled = Math.max(1, Math.min(5, Math.round(score / 20)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function qualitativeLabel(potentialHigh: number): string {
  if (potentialHigh >= 15) return 'Talent exceptionnel';
  if (potentialHigh >= 12) return 'Belle marge de progression';
  if (potentialHigh >= 9) return 'Profil intéressant';
  if (potentialHigh >= 6) return 'Potentiel limité';
  return 'Peu de marge de progression';
}

/**
 * Estime le potentiel d'un joueur sans révéler la valeur exacte.
 * Sans recruteur : verdict vague uniquement.
 * Avec recruteur(s) : fourchette imprécise selon le niveau du staff.
 */
export function estimatePotential(player: Player, staff: Staff[]): PotentialEstimate {
  const scouts = staff.filter((s) => s.role === 'scout');

  if (scouts.length === 0) {
    const vague =
      player.potential.revealedPercent >= 30
        ? 'Joueur à surveiller'
        : 'Potentiel non évalué';

    return {
      label: vague,
      rangeText: null,
      stars: '?',
      confidence: 'none',
      hint: 'Recrutez un scout pour estimer le plafond de ce joueur.',
    };
  }

  const scoutBonus = getScoutRevealBonus(staff);
  const effectiveReveal = Math.min(100, player.potential.revealedPercent + scoutBonus);

  const current = toDisplayRating(player.overallRating);
  const ceiling = toDisplayRating(player.potentialRating);
  const gap = Math.max(0, ceiling - current);

  const estimatedHigh = current + Math.round(gap * (effectiveReveal / 100));
  const fuzz = effectiveReveal >= 60 ? 1 : 2;
  const low = Math.max(current, estimatedHigh - fuzz);
  const high = Math.min(20, estimatedHigh + 1);

  const confidence =
    effectiveReveal >= 70 ? 'high' : effectiveReveal >= 40 ? 'medium' : 'low';

  return {
    label: qualitativeLabel(estimatedHigh),
    rangeText:
      effectiveReveal >= 25
        ? `Estimation scout : ${low}–${high} /20`
        : 'Analyse scout en cours…',
    stars: buildStars(estimatedHigh * 5),
    confidence,
    hint: null,
  };
}

/** Convertit la note globale 1–99 en affichage /20. */
export function overallToDisplay(rating99: number): number {
  return toDisplayRating(rating99);
}

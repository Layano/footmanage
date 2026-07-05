import { useRouter, useSegments } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME_CONFIG } from '@/constants/gameConfig';
import { theme } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';

const TUTORIAL_STEPS: Record<number, { title: string; body: string; actionLabel?: string }> = {
  1: {
    title: 'Bienvenue dans votre nouvelle agence !',
    body: "Vous n'avez ni argent, ni client. Allez dans l'onglet Scouting pour commencer.",
    actionLabel: 'Aller au Scouting',
  },
  2: {
    title: 'Pas de recruteur professionnel',
    body: "Utilisez les tournois de quartier pour repérer des jeunes talents sans recruteur.",
    actionLabel: 'Aller aux tournois de quartier',
  },
  3: {
    title: 'Signez votre premier joueur !',
    body: "Super ! Regardez les stats et signez un joueur gratuitement (ils n'ont pas de club).",
  },
};

export function TutorialOverlay() {
  const router = useRouter();
  const segments = useSegments();
  const isTutorialActive = useGameStore((s) => s.isTutorialActive);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const scoutNeighborhoodTournament = useGameStore((s) => s.scoutNeighborhoodTournament);

  const isOnScouting = segments.includes('scouting');
  const content = TUTORIAL_STEPS[tutorialStep];

  if (!isTutorialActive || !content) {
    return null;
  }

  /** Étape 1 hors Scouting : overlay bloquant. Étapes 2–3 : bandeau non bloquant. */
  const isBlockingOverlay = tutorialStep === 1 && !isOnScouting;

  const handleGoToScouting = () => {
    router.push('/(tabs)/scouting');
  };

  const handleTournament = async () => {
    if (agencyBudget < GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_COST) {
      Alert.alert(
        'Fonds insuffisants',
        `Il vous faut au moins ${GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_COST} € pour vous déplacer.`,
      );
      return;
    }

    const success = await scoutNeighborhoodTournament();
    if (!success) {
      Alert.alert('Erreur', 'Impossible de participer au tournoi.');
    }
  };

  return (
    <View
      style={[styles.overlay, isBlockingOverlay ? styles.overlayBlocking : styles.overlayHint]}
      pointerEvents={isBlockingOverlay ? 'auto' : 'box-none'}>
      {isBlockingOverlay ? <View style={styles.backdrop} /> : null}

      <View style={styles.card} pointerEvents="auto">
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Tutoriel {tutorialStep}/3</Text>
        </View>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.body}>{content.body}</Text>

        {tutorialStep === 1 && !isOnScouting && content.actionLabel ? (
          <Pressable style={styles.button} onPress={handleGoToScouting}>
            <Text style={styles.buttonText}>{content.actionLabel}</Text>
          </Pressable>
        ) : null}

        {tutorialStep === 2 && content.actionLabel ? (
          <Pressable style={styles.button} onPress={() => void handleTournament()}>
            <Text style={styles.buttonText}>
              {content.actionLabel} ({GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_COST} €)
            </Text>
          </Pressable>
        ) : null}

        {tutorialStep === 3 ? (
          <Text style={styles.hint}>👆 Appuyez sur « Signer (gratuit) » sur un joueur ci-dessus.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  overlayBlocking: {
    paddingBottom: 100,
  },
  overlayHint: {
    paddingBottom: 90,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  stepBadgeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.warning,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

import { useRouter, useSegments } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { getCountryByCode } from '@/data/world/countries';
import { useGameStore } from '@/store/useGameStore';

const TUTORIAL_STEPS: Record<number, { title: string; body: string; actionLabel?: string }> = {
  1: {
    title: 'Bienvenue dans votre nouvelle agence !',
    body: "Vous n'avez ni argent, ni client. Allez dans l'onglet Scouting pour commencer.",
    actionLabel: 'Aller au Scouting',
  },
  2: {
    title: 'Tournoi de quartier',
    body: 'Un tournoi se tient dans votre ville. Déplacez-vous pour repérer des jeunes talents locaux.',
    actionLabel: 'Participer au tournoi',
  },
  3: {
    title: 'Négociez votre premier contrat !',
    body: "Ouvrez la négociation avec un joueur repéré : commissions, prime de signature et sponsoring.",
  },
};

export function TutorialOverlay() {
  const router = useRouter();
  const segments = useSegments();
  const isTutorialActive = useGameStore((s) => s.isTutorialActive);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const agencyCountryCode = useGameStore((s) => s.agencyCountryCode);
  const currentTournament = useGameStore((s) => s.currentTournament);
  const agencyCity = useGameStore((s) => s.agency.office.city);
  const scoutNeighborhoodTournament = useGameStore((s) => s.scoutNeighborhoodTournament);

  const isOnScouting = segments.includes('scouting');
  const content = TUTORIAL_STEPS[tutorialStep];
  const travelCost = currentTournament?.travelCost ?? 0;
  const tournamentCity = currentTournament?.city ?? agencyCity;
  const countryName = getCountryByCode(agencyCountryCode)?.name ?? '';

  if (!isTutorialActive || !content) {
    return null;
  }

  const isBlockingOverlay = tutorialStep === 1 && !isOnScouting;

  const handleGoToScouting = () => {
    router.push('/(tabs)/scouting');
  };

  const handleTournament = async () => {
    if (agencyBudget < travelCost) {
      Alert.alert(
        'Fonds insuffisants',
        `Il vous faut au moins ${travelCost} € pour vous rendre à ${tournamentCity}.`,
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

        {tutorialStep === 2 ? (
          <Text style={styles.tournamentInfo}>
            📍 {tournamentCity} ({countryName}) · Trajet : {travelCost} €
          </Text>
        ) : null}

        {tutorialStep === 1 && !isOnScouting && content.actionLabel ? (
          <Pressable style={styles.button} onPress={handleGoToScouting}>
            <Text style={styles.buttonText}>{content.actionLabel}</Text>
          </Pressable>
        ) : null}

        {tutorialStep === 2 && content.actionLabel ? (
          <Pressable style={styles.button} onPress={() => void handleTournament()}>
            <Text style={styles.buttonText}>
              {content.actionLabel} ({travelCost} €)
            </Text>
          </Pressable>
        ) : null}

        {tutorialStep === 3 ? (
          <Text style={styles.hint}>👆 Appuyez sur « Négocier le contrat » sur un joueur ci-dessus.</Text>
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
  tournamentInfo: {
    fontSize: 14,
    color: theme.colors.warning,
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

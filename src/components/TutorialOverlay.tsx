import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    body: "Vous ne pouvez pas vous payer de recruteur professionnel. Utilisez l'option « Aller aux tournois de quartier » pour repérer des jeunes.",
  },
  3: {
    title: 'Signez votre premier joueur !',
    body: "Super ! Voici quelques jeunes talents. Regardez leurs stats et signez votre premier joueur (c'est gratuit, ils n'ont pas de club !).",
  },
};

export function TutorialOverlay() {
  const router = useRouter();
  const segments = useSegments();
  const isTutorialActive = useGameStore((s) => s.isTutorialActive);
  const tutorialStep = useGameStore((s) => s.tutorialStep);

  const isOnScouting = segments.includes('scouting');
  const content = TUTORIAL_STEPS[tutorialStep];

  if (!isTutorialActive || !content) {
    return null;
  }

  const handleAction = () => {
    if (tutorialStep === 1) {
      router.push('/(tabs)/scouting');
    }
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} />
      <View style={styles.card}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Tutoriel {tutorialStep}/3</Text>
        </View>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.body}>{content.body}</Text>

        {tutorialStep === 1 && !isOnScouting && content.actionLabel ? (
          <Pressable style={styles.button} onPress={handleAction}>
            <Text style={styles.buttonText}>{content.actionLabel}</Text>
          </Pressable>
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
    paddingBottom: 100,
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
    zIndex: 1,
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

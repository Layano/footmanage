import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { theme } from '@/constants/theme';
import { isNeighborhoodAmateur } from '@/engine/players/amateurGenerator';
import { getClubFromStore, useGameStore } from '@/store/useGameStore';
import { PLAYER_POSITION_LABELS } from '@/types';

export default function ScoutingScreen() {
  const isHydrated = useGameStore((s) => s.isHydrated);
  const scoutedPlayers = useGameStore((s) => s.scoutedPlayers);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const isTutorialActive = useGameStore((s) => s.isTutorialActive);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const scoutNeighborhoodTournament = useGameStore((s) => s.scoutNeighborhoodTournament);
  const signAmateurPlayer = useGameStore((s) => s.signAmateurPlayer);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

  useEffect(() => {
    if (isTutorialActive && tutorialStep === 1) {
      setTutorialStep(2);
    }
  }, [isTutorialActive, tutorialStep, setTutorialStep]);

  const handleTournament = async () => {
    const success = await scoutNeighborhoodTournament();
    if (!success) {
      Alert.alert(
        'Fonds insuffisants',
        `Il vous faut au moins ${GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_COST} € pour vous déplacer.`,
      );
    }
  };

  const handleSign = async (playerId: string, playerName: string) => {
    const success = await signAmateurPlayer(playerId);
    if (success) {
      Alert.alert('Joueur signé !', `${playerName} rejoint votre agence.`);
    }
  };

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const canAffordTournament = agencyBudget >= GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_COST;
  const highlightTournament = isTutorialActive && tutorialStep === 2;

  return (
    <ScreenContainer
      title="Scouting / Mercato"
      subtitle={`${scoutedPlayers.length} joueur(s) à observer`}>
      <Pressable
        style={[
          styles.tournamentButton,
          highlightTournament && styles.tournamentButtonHighlight,
          !canAffordTournament && styles.tournamentButtonDisabled,
        ]}
        onPress={() => void handleTournament()}
        disabled={!canAffordTournament}>
        <Text style={styles.tournamentTitle}>🏘️ Aller aux tournois de quartier</Text>
        <Text style={styles.tournamentDetails}>
          Coût : {GAME_CONFIG.NEIGHBORHOOD_TOURNAMENT_COST} € + 1 semaine · 3 jeunes repérés
        </Text>
      </Pressable>

      {scoutedPlayers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aucun joueur repéré. Participez à un tournoi de quartier pour découvrir des talents
            locaux.
          </Text>
        </View>
      ) : (
        <FlatList
          data={scoutedPlayers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const club = getClubFromStore(item.contract.clubId);
            const signable = isNeighborhoodAmateur(item);
            const highlightSign = isTutorialActive && tutorialStep === 3 && signable;

            return (
              <View style={[styles.card, highlightSign && styles.cardHighlight]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.playerName}>{item.displayName}</Text>
                  <Text style={styles.rating}>{item.overallRating}</Text>
                </View>
                <Text style={styles.details}>
                  {PLAYER_POSITION_LABELS[item.position]} · {item.age} ans ·{' '}
                  {item.status === 'free_agent' ? 'Sans club' : (club?.name ?? '—')}
                </Text>
                <Text style={styles.potential}>
                  Potentiel estimé : {Math.round(item.potentialRating / 5)}/20 (
                  {item.potential.revealedPercent}% découvert)
                </Text>

                {signable ? (
                  <Pressable
                    style={[styles.signButton, highlightSign && styles.signButtonHighlight]}
                    onPress={() => void handleSign(item.id, item.displayName)}>
                    <Text style={styles.signButtonText}>✍️ Signer (gratuit)</Text>
                  </Pressable>
                ) : (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Prospect</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  tournamentButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tournamentButtonHighlight: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceLight,
  },
  tournamentButtonDisabled: {
    opacity: 0.5,
  },
  tournamentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  tournamentDetails: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHighlight: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  rating: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  details: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  potential: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  signButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  signButtonHighlight: {
    backgroundColor: theme.colors.primaryDark,
  },
  signButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

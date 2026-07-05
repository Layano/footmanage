import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PlayerAttributesPanel } from '@/components/players/PlayerAttributesPanel';
import { theme } from '@/constants/theme';
import { isNeighborhoodAmateur } from '@/engine/players/amateurGenerator';
import { estimatePotential, overallToDisplay } from '@/engine/players/potentialEstimate';
import {
  findPlayerById,
  getClubFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { getPlayerTeamLabel } from '@/utils/playerDisplay';
import { PLAYER_POSITION_LABELS } from '@/types';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const isHydrated = useGameStore((s) => s.isHydrated);
  const staff = useGameStore((s) => s.staff);
  const signAmateurPlayer = useGameStore((s) => s.signAmateurPlayer);
  const revealPlayerScouting = useGameStore((s) => s.revealPlayerScouting);

  const found = id ? findPlayerById(id) : null;
  const player = found?.player;
  const club = player ? getClubFromStore(player.contract.clubId) : undefined;

  useEffect(() => {
    if (id && isHydrated) {
      revealPlayerScouting(id);
    }
  }, [id, isHydrated, revealPlayerScouting]);

  if (!isHydrated || !player) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Joueur introuvable</Text>
      </View>
    );
  }

  const potential = estimatePotential(player, staff);
  const teamLabel = getPlayerTeamLabel(player, club);
  const signable = found?.source === 'scouted' && isNeighborhoodAmateur(player);

  const handleSign = async () => {
    const success = await signAmateurPlayer(player.id);
    if (success) {
      Alert.alert('Joueur signé !', `${player.displayName} rejoint votre agence.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: player.displayName }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.name}>{player.displayName}</Text>
          <Text style={styles.subtitle}>
            {PLAYER_POSITION_LABELS[player.position]} · {player.age} ans
          </Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Nationalité</Text>
              <Text style={styles.infoValue}>{player.nationality}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Équipe</Text>
              <Text style={styles.infoValue}>{teamLabel}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Note actuelle</Text>
              <Text style={styles.infoValue}>{overallToDisplay(player.overallRating)}/20</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Valeur</Text>
              <Text style={styles.infoValue}>
                {player.marketValue.toLocaleString('fr-FR')} €
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.potentialCard}>
          <Text style={styles.potentialTitle}>Potentiel (estimation)</Text>
          <Text style={styles.potentialStars}>{potential.stars}</Text>
          <Text style={styles.potentialLabel}>{potential.label}</Text>
          {potential.rangeText ? (
            <Text style={styles.potentialRange}>{potential.rangeText}</Text>
          ) : null}
          {potential.hint ? <Text style={styles.potentialHint}>{potential.hint}</Text> : null}
        </View>

        <PlayerAttributesPanel player={player} />

        {signable ? (
          <Pressable style={styles.signButton} onPress={() => void handleSign()}>
            <Text style={styles.signButtonText}>✍️ Signer ce joueur (gratuit)</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.textMuted,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  hero: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  infoCell: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  potentialCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  potentialTitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  potentialStars: {
    fontSize: 28,
    color: theme.colors.warning,
    marginBottom: theme.spacing.xs,
  },
  potentialLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  potentialRange: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  potentialHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  signButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  signButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

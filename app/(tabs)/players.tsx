import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { overallToDisplay } from '@/engine/players/potentialEstimate';
import { getClubFromStore, useGameStore } from '@/store/useGameStore';
import { getPlayerTeamLabel } from '@/utils/playerDisplay';
import { PLAYER_POSITION_LABELS } from '@/types';

export default function PlayersScreen() {
  const router = useRouter();
  const isHydrated = useGameStore((s) => s.isHydrated);
  const myPlayers = useGameStore((s) => s.myPlayers);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScreenContainer
      title="Mes Joueurs"
      subtitle={`${myPlayers.length} client(s) sous contrat`}>
      <FlatList
        data={myPlayers}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun client pour le moment. Recrutez via le Scouting.</Text>
        }
        renderItem={({ item }) => {
          const club = getClubFromStore(item.contract.clubId);
          const teamLabel = getPlayerTeamLabel(item, club);

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/player/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.playerName}>{item.displayName}</Text>
                <Text style={styles.rating}>{overallToDisplay(item.overallRating)}/20</Text>
              </View>
              <Text style={styles.details}>
                {PLAYER_POSITION_LABELS[item.position]} · {item.age} ans · {item.nationality}
              </Text>
              <Text style={styles.team}>🏟️ {teamLabel}</Text>
              <Text style={styles.value}>
                Valeur : {item.marketValue.toLocaleString('fr-FR')} €
              </Text>
              <Text style={styles.viewDetail}>Voir la fiche →</Text>
            </Pressable>
          );
        }}
      />
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
  list: {
    flex: 1,
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  empty: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    color: theme.colors.primary,
  },
  details: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  team: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  viewDetail: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});

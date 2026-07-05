import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { getClubFromStore, useGameStore } from '@/store/useGameStore';
import { PLAYER_POSITION_LABELS } from '@/types';

export default function PlayersScreen() {
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
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const club = getClubFromStore(item.contract.clubId);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.playerName}>{item.displayName}</Text>
                <Text style={styles.rating}>{item.overallRating}</Text>
              </View>
              <Text style={styles.details}>
                {PLAYER_POSITION_LABELS[item.position]} · {item.age} ans ·{' '}
                {club?.name ?? 'Sans club'}
              </Text>
              <Text style={styles.value}>
                Valeur : {item.marketValue.toLocaleString('fr-FR')} €
              </Text>
            </View>
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
    gap: theme.spacing.sm,
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
  value: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});

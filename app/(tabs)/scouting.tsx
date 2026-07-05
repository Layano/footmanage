import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { getClubById, getScoutingTargets } from '@/data/mockData';
import { PLAYER_POSITION_LABELS } from '@/types';

export default function ScoutingScreen() {
  const targets = getScoutingTargets();

  return (
    <ScreenContainer
      title="Scouting / Mercato"
      subtitle={`${targets.length} joueurs à observer`}>
      <FlatList
        data={targets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const club = getClubById(item.contract.clubId);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.playerName}>{item.displayName}</Text>
                <Text style={styles.rating}>{item.overallRating}</Text>
              </View>
              <Text style={styles.details}>
                {PLAYER_POSITION_LABELS[item.position]} · {item.age} ans ·{' '}
                {item.status === 'free_agent' ? 'Agent libre' : (club?.name ?? '—')}
              </Text>
              <Text style={styles.potential}>
                Potentiel estimé : {item.potentialRating} (
                {item.potential.revealedPercent}% découvert)
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Prospect</Text>
              </View>
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
});

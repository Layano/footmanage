import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { formatGameDate, useGameStore } from '@/store/useGameStore';

export default function DashboardScreen() {
  const isHydrated = useGameStore((s) => s.isHydrated);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const currentSeason = useGameStore((s) => s.currentSeason);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const agency = useGameStore((s) => s.agency);
  const myPlayers = useGameStore((s) => s.myPlayers);
  const messages = useGameStore((s) => s.messages);
  const advanceTime = useGameStore((s) => s.advanceTime);

  const handleAdvanceTime = useCallback(() => {
    void advanceTime();
  }, [advanceTime]);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement de la partie…</Text>
      </View>
    );
  }

  return (
    <ScreenContainer
      title="Tableau de bord"
      subtitle={`${agency.name} — ${formatGameDate(currentWeek, currentSeason)}`}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Trésorerie</Text>
        <Text style={styles.cardValue}>{agencyBudget.toLocaleString('fr-FR')} €</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Clients actifs</Text>
          <Text style={styles.cardValue}>{myPlayers.length}</Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Réputation</Text>
          <Text style={styles.cardValue}>{agency.reputation}/100</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Messages récents</Text>
        {messages.length === 0 ? (
          <Text style={styles.message}>Aucun message pour le moment.</Text>
        ) : (
          messages.slice(0, 5).map((msg) => (
            <Text key={msg.id} style={styles.message}>
              📩 {msg.title} — {msg.body}
            </Text>
          ))
        )}
      </View>

      <Pressable style={styles.button} onPress={handleAdvanceTime}>
        <Text style={styles.buttonText}>⏩ Avancer le temps (+1 semaine)</Text>
      </Pressable>
    </ScreenContainer>
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
    fontSize: 14,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  halfCard: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cardLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

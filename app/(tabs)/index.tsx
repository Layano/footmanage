import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { getAgencyClients, MOCK_AGENCY } from '@/data/mockData';

export default function DashboardScreen() {
  const clients = getAgencyClients();

  return (
    <ScreenContainer
      title="Tableau de bord"
      subtitle={`${MOCK_AGENCY.name} — Saison 2025/2026`}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Trésorerie</Text>
        <Text style={styles.cardValue}>
          {MOCK_AGENCY.finances.balance.toLocaleString('fr-FR')} €
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Clients actifs</Text>
          <Text style={styles.cardValue}>{clients.length}</Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Réputation</Text>
          <Text style={styles.cardValue}>{MOCK_AGENCY.reputation}/100</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Messages récents</Text>
        <Text style={styles.message}>
          📩 Liverpool Red s'intéresse à une prolongation pour V. De Ligt Jr.
        </Text>
        <Text style={styles.message}>
          📩 Paris SG a transmis une offre de sponsoring pour K. Dembélé Jr.
        </Text>
        <Text style={styles.message}>
          📩 Nouveau talent repéré par Marc Dubois en Ligue 1 France.
        </Text>
      </View>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>⏩ Avancer le temps (+1 semaine)</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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

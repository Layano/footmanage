import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';

export default function FinanceScreen() {
  const isHydrated = useGameStore((s) => s.isHydrated);
  const agency = useGameStore((s) => s.agency);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const staff = useGameStore((s) => s.staff);
  const totalRevenue = useGameStore((s) => s.totalRevenue);
  const totalExpenses = useGameStore((s) => s.totalExpenses);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const weeklyStaffCost = staff.reduce((sum, s) => sum + s.weeklySalary, 0);
  const monthlyStaffCost = weeklyStaffCost * 4;

  return (
    <ScreenContainer title="Agence & Finances" subtitle={agency.name}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bilan comptable</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Trésorerie</Text>
          <Text style={[styles.value, styles.positive]}>
            {agencyBudget.toLocaleString('fr-FR')} €
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Revenus (saison)</Text>
          <Text style={styles.value}>{totalRevenue.toLocaleString('fr-FR')} €</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dépenses (saison)</Text>
          <Text style={[styles.value, styles.negative]}>
            {totalExpenses.toLocaleString('fr-FR')} €
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Frais de fonctionnement</Text>
          <Text style={styles.value}>
            {agency.finances.operatingCosts.toLocaleString('fr-FR')} €/mois
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Taux de commission</Text>
          <Text style={styles.value}>{agency.finances.commissionRate}%</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Staff ({staff.length})</Text>
        {staff.map((member) => (
          <View key={member.id} style={styles.staffRow}>
            <View>
              <Text style={styles.staffName}>
                {member.firstName} {member.lastName}
              </Text>
              <Text style={styles.staffRole}>
                {member.role === 'scout' ? 'Recruteur' : member.role} · Niv. {member.level}
              </Text>
            </View>
            <Text style={styles.staffSalary}>
              {member.weeklySalary.toLocaleString('fr-FR')} €/sem
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Coût staff mensuel</Text>
          <Text style={[styles.value, styles.negative]}>
            {monthlyStaffCost.toLocaleString('fr-FR')} €
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bureau</Text>
        <Text style={styles.officeText}>
          {agency.office.city}, {agency.office.country} — Niveau {agency.office.level}
        </Text>
      </View>
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  positive: {
    color: theme.colors.primary,
    fontSize: 18,
  },
  negative: {
    color: theme.colors.danger,
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  staffRole: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  staffSalary: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  officeText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});

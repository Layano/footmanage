import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { MOCK_AGENCY } from '@/data/mockData';

export default function FinanceScreen() {
  const { finances, staff } = MOCK_AGENCY;
  const weeklyStaffCost = staff.reduce((sum, s) => sum + s.weeklySalary, 0);
  const monthlyStaffCost = weeklyStaffCost * 4;

  return (
    <ScreenContainer title="Agence & Finances" subtitle={MOCK_AGENCY.name}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bilan comptable</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Trésorerie</Text>
          <Text style={[styles.value, styles.positive]}>
            {finances.balance.toLocaleString('fr-FR')} €
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Revenus (saison)</Text>
          <Text style={styles.value}>
            {finances.totalRevenue.toLocaleString('fr-FR')} €
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dépenses (saison)</Text>
          <Text style={[styles.value, styles.negative]}>
            {finances.totalExpenses.toLocaleString('fr-FR')} €
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Frais de fonctionnement</Text>
          <Text style={styles.value}>
            {finances.operatingCosts.toLocaleString('fr-FR')} €/mois
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Taux de commission</Text>
          <Text style={styles.value}>{finances.commissionRate}%</Text>
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
                {member.role === 'scout' ? 'Recruteur' : member.role} · Niv.{' '}
                {member.level}
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
          {MOCK_AGENCY.office.city}, {MOCK_AGENCY.office.country} — Niveau{' '}
          {MOCK_AGENCY.office.level}
        </Text>
      </View>
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

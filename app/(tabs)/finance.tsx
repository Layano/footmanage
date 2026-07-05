import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import {
  getNextOfficeLevel,
  getOfficeLevelConfig,
  STAFF_CATALOG,
  STAFF_ROLE_LABELS,
} from '@/constants/officeConfig';
import { theme } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';

export default function FinanceScreen() {
  const isHydrated = useGameStore((s) => s.isHydrated);
  const agency = useGameStore((s) => s.agency);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const staff = useGameStore((s) => s.staff);
  const myPlayers = useGameStore((s) => s.myPlayers);
  const totalRevenue = useGameStore((s) => s.totalRevenue);
  const totalExpenses = useGameStore((s) => s.totalExpenses);
  const upgradeOffice = useGameStore((s) => s.upgradeOffice);
  const hireStaff = useGameStore((s) => s.hireStaff);
  const fireStaff = useGameStore((s) => s.fireStaff);

  const [showHiring, setShowHiring] = useState(false);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const weeklyStaffCost = staff.reduce((sum, s) => sum + s.weeklySalary, 0);
  const officeConfig = getOfficeLevelConfig(agency.office.level);
  const nextOffice = getNextOfficeLevel(agency.office.level);
  const canAffordUpgrade = nextOffice != null && agencyBudget >= nextOffice.upgradeCost;
  const staffFull = staff.length >= officeConfig.maxStaff;

  const handleUpgrade = async () => {
    const result = await upgradeOffice();
    if (!result.success) {
      Alert.alert('Agrandissement impossible', result.reason ?? 'Erreur.');
    }
  };

  const handleHire = async (template: (typeof STAFF_CATALOG)[number]) => {
    const result = await hireStaff(template);
    if (!result.success) {
      Alert.alert('Embauche impossible', result.reason ?? 'Erreur.');
    }
  };

  return (
    <ScreenContainer title="Agence & Finances" subtitle={agency.name} scrollable>
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
          <Text style={styles.label}>Coût staff</Text>
          <Text style={[styles.value, styles.negative]}>
            {(weeklyStaffCost * 4).toLocaleString('fr-FR')} €/mois
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🏢 Locaux — {officeConfig.name}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Niveau</Text>
          <Text style={styles.value}>
            {agency.office.level} · {agency.office.city}, {agency.office.country}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Clients</Text>
          <Text
            style={[
              styles.value,
              myPlayers.length >= agency.maxClients && styles.negative,
            ]}>
            {myPlayers.length} / {agency.maxClients}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Staff</Text>
          <Text style={[styles.value, staffFull && styles.negative]}>
            {staff.length} / {officeConfig.maxStaff}
          </Text>
        </View>

        {nextOffice ? (
          <Pressable
            style={[styles.upgradeBtn, !canAffordUpgrade && styles.btnDisabled]}
            onPress={() => void handleUpgrade()}
            disabled={!canAffordUpgrade}>
            <Text style={styles.upgradeBtnText}>
              Agrandir → {nextOffice.name}
            </Text>
            <Text style={styles.upgradeBtnMeta}>
              {nextOffice.upgradeCost.toLocaleString('fr-FR')} € ·{' '}
              {nextOffice.maxClients} clients · {nextOffice.maxStaff} staff ·{' '}
              {nextOffice.monthlyCost.toLocaleString('fr-FR')} €/mois
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.maxedOut}>Locaux au niveau maximum 🎉</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.staffHeader}>
          <Text style={styles.sectionTitle}>👥 Staff ({staff.length}/{officeConfig.maxStaff})</Text>
          <Pressable onPress={() => setShowHiring((v) => !v)}>
            <Text style={styles.hireLink}>{showHiring ? 'Fermer' : '+ Embaucher'}</Text>
          </Pressable>
        </View>

        {staff.length === 0 && !showHiring ? (
          <Text style={styles.emptyStaff}>
            Aucun membre du staff. Un recruteur révèle le potentiel des jeunes, un
            entraîneur accélère leur progression.
          </Text>
        ) : null}

        {staff.map((member) => (
          <View key={member.id} style={styles.staffRow}>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>
                {member.firstName} {member.lastName}
              </Text>
              <Text style={styles.staffRole}>
                {STAFF_ROLE_LABELS[member.role]} · Niv. {member.level} ·{' '}
                {member.weeklySalary.toLocaleString('fr-FR')} €/sem
              </Text>
            </View>
            <Pressable
              style={styles.fireBtn}
              onPress={() => void fireStaff(member.id)}>
              <Text style={styles.fireBtnText}>Licencier</Text>
            </Pressable>
          </View>
        ))}

        {showHiring ? (
          <View style={styles.hiringList}>
            <Text style={styles.hiringTitle}>Candidats disponibles</Text>
            {STAFF_CATALOG.map((template) => {
              const affordable = agencyBudget >= template.hiringFee;
              const disabled = !affordable || staffFull;
              return (
                <View key={`${template.role}-${template.level}`} style={styles.candidateRow}>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{template.roleLabel}</Text>
                    <Text style={styles.staffRole}>{template.description}</Text>
                    <Text style={styles.candidateCost}>
                      Prime {template.hiringFee.toLocaleString('fr-FR')} € ·{' '}
                      {template.weeklySalary.toLocaleString('fr-FR')} €/sem
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.hireBtn, disabled && styles.btnDisabled]}
                    onPress={() => void handleHire(template)}
                    disabled={disabled}>
                    <Text style={styles.hireBtnText}>Embaucher</Text>
                  </Pressable>
                </View>
              );
            })}
            {staffFull ? (
              <Text style={styles.staffFullHint}>
                Locaux pleins — agrandissez pour embaucher davantage.
              </Text>
            ) : null}
          </View>
        ) : null}
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
  upgradeBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  upgradeBtnMeta: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.85,
    marginTop: 2,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  maxedOut: {
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hireLink: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  emptyStaff: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 19,
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  staffInfo: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  staffRole: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  fireBtn: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  fireBtnText: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
  },
  hiringList: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  hiringTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.warning,
    marginBottom: theme.spacing.sm,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  candidateCost: {
    fontSize: 12,
    color: theme.colors.warning,
    marginTop: 2,
  },
  hireBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  hireBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  staffFullHint: {
    fontSize: 12,
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

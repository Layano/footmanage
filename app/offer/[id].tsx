import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import {
  findPlayerById,
  getClubFromStore,
  getOfferById,
  useGameStore,
} from '@/store/useGameStore';
import { PLAYER_POSITION_LABELS } from '@/types';

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const acceptOffer = useGameStore((s) => s.acceptTransferOffer);
  const rejectOffer = useGameStore((s) => s.rejectTransferOffer);

  const offer = useMemo(() => (id ? getOfferById(id) : undefined), [id]);
  const playerInfo = offer ? findPlayerById(offer.playerId) : null;
  const club = offer ? getClubFromStore(offer.clubId) : undefined;

  if (!offer || !playerInfo?.player || !club) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Offre introuvable ou expirée.</Text>
      </View>
    );
  }

  const player = playerInfo.player;
  const isPending = offer.status === 'pending';
  const bonusLabel =
    offer.bonusType === 'goal'
      ? `${offer.performanceBonus.toLocaleString('fr-FR')} € par but`
      : offer.bonusType === 'clean_sheet'
        ? `${offer.performanceBonus.toLocaleString('fr-FR')} € par clean sheet`
        : `${offer.performanceBonus.toLocaleString('fr-FR')} € par match`;

  const handleAccept = async () => {
    const ok = await acceptOffer(offer.id);
    if (ok) {
      Alert.alert('Offre acceptée', `${player.displayName} rejoint ${club.name}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleReject = async () => {
    await rejectOffer(offer.id);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: offer.type === 'loan' ? 'Offre de prêt' : 'Offre de transfert',
        }}
      />
      <ScreenContainer title={club.name} subtitle={player.displayName} scrollable>
        <View style={styles.card}>
          <Text style={styles.row}>
            <Text style={styles.label}>Joueur · </Text>
            {player.displayName} ({PLAYER_POSITION_LABELS[player.position]}, {player.age} ans)
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Type · </Text>
            {offer.type === 'loan' ? 'Prêt' : 'Transfert'}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Temps de jeu · </Text>
            {offer.expectedMinutesPercent}% des minutes
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Salaire · </Text>
            {offer.weeklyWage.toLocaleString('fr-FR')} € / semaine
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Prime performance · </Text>
            {bonusLabel}
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>
              {offer.type === 'loan' ? 'Indemnité de prêt' : 'Prix du transfert'} ·{' '}
            </Text>
            {offer.fee.toLocaleString('fr-FR')} €
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Durée · </Text>
            {offer.contractYears} an{offer.contractYears > 1 ? 's' : ''}
          </Text>
          <Text style={styles.expiry}>
            Expire semaine {offer.expiresWeek} (saison {offer.season})
          </Text>
        </View>

        {!isPending ? (
          <Text style={styles.status}>Statut : {offer.status}</Text>
        ) : (
          <View style={styles.actions}>
            <Pressable style={styles.rejectBtn} onPress={() => void handleReject()}>
              <Text style={styles.rejectText}>Refuser</Text>
            </Pressable>
            <Pressable style={styles.acceptBtn} onPress={() => void handleAccept()}>
              <Text style={styles.acceptText}>Accepter pour le joueur</Text>
            </Pressable>
          </View>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  error: {
    color: theme.colors.danger,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  row: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  label: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  expiry: {
    fontSize: 13,
    color: theme.colors.warning,
    marginTop: theme.spacing.sm,
  },
  status: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  rejectText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  acceptText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});

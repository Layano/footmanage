import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { getTransferWindowLabel } from '@/engine/simulation/transferWindow';
import {
  formatGameDate,
  getUnreadMessageCount,
  useGameStore,
} from '@/store/useGameStore';
import type { GameMessage } from '@/types/game';

const TYPE_ICONS: Record<GameMessage['type'], string> = {
  info: 'ℹ️',
  transfer: '🔄',
  loan: '📋',
  contract: '📝',
  scout: '🔍',
  finance: '💰',
  match: '⚽',
};

function MessageRow({
  message,
  onPress,
}: {
  message: GameMessage;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.messageRow, !message.read && styles.messageUnread]}
      onPress={onPress}>
      <Text style={styles.messageIcon}>{TYPE_ICONS[message.type]}</Text>
      <View style={styles.messageContent}>
        <Text style={[styles.messageTitle, !message.read && styles.messageTitleUnread]}>
          {message.title}
        </Text>
        <Text style={styles.messageBody} numberOfLines={2}>
          {message.body}
        </Text>
        <Text style={styles.messageMeta}>
          Sem. {message.week} · {new Date(message.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      {!message.read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function InboxScreen() {
  const router = useRouter();
  const [isAdvancing, setIsAdvancing] = useState(false);

  const isHydrated = useGameStore((s) => s.isHydrated);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const currentSeason = useGameStore((s) => s.currentSeason);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const agency = useGameStore((s) => s.agency);
  const messages = useGameStore((s) => s.messages);
  const agencyCountryCode = useGameStore((s) => s.agencyCountryCode);
  const allLeagues = useGameStore((s) => s.leagues);
  const isTutorialActive = useGameStore((s) => s.isTutorialActive);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const advanceTime = useGameStore((s) => s.advanceTime);
  const markMessageRead = useGameStore((s) => s.markMessageRead);
  const resetGame = useGameStore((s) => s.resetGame);

  const unreadCount = useMemo(() => getUnreadMessageCount(), [messages]);
  const mercatoLabel = getTransferWindowLabel(currentWeek, allLeagues, agencyCountryCode);

  const handleMessagePress = useCallback(
    (message: GameMessage) => {
      markMessageRead(message.id);
      if (message.action === 'transfer_offer' || message.action === 'loan_offer') {
        if (message.offerId) router.push(`/offer/${message.offerId}`);
        return;
      }
      if (message.action === 'match_invite' && message.matchId) {
        router.push(`/match/${message.matchId}`);
        return;
      }
      if (message.playerId) {
        router.push(`/player/${message.playerId}`);
      }
    },
    [markMessageRead, router],
  );

  const handleAdvanceTime = useCallback(async () => {
    if (isTutorialActive && tutorialStep < 3) {
      Alert.alert(
        'Tutoriel en cours',
        "Terminez d'abord le tutoriel dans l'onglet Scouting.",
        [{ text: 'Aller au Scouting', onPress: () => router.push('/(tabs)/scouting') }],
      );
      return;
    }

    setIsAdvancing(true);
    try {
      await advanceTime();
      const state = useGameStore.getState();
      Alert.alert('Semaine suivante', formatGameDate(state.currentWeek, state.currentSeason));
    } finally {
      setIsAdvancing(false);
    }
  }, [advanceTime, isTutorialActive, tutorialStep, router]);

  const handleResetGame = useCallback(() => {
    Alert.alert('Nouvelle partie', 'Effacer la progression actuelle ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Recommencer',
        style: 'destructive',
        onPress: () => void resetGame().then(() => router.replace('/new-game')),
      },
    ]);
  }, [resetGame, router]);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScreenContainer
      title="Boîte mail"
      subtitle={`${agency.name} · ${formatGameDate(currentWeek, currentSeason)}`}>
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Trésorerie</Text>
          <Text style={styles.statValue}>{agencyBudget.toLocaleString('fr-FR')} €</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Réputation</Text>
          <Text style={styles.statValue}>{agency.reputation}/100</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Non lus</Text>
          <Text style={styles.statValue}>{unreadCount}</Text>
        </View>
      </View>

      {mercatoLabel ? (
        <View style={styles.mercatoBanner}>
          <Text style={styles.mercatoText}>
            📅 {mercatoLabel} — max. 1 offre/joueur par période
          </Text>
        </View>
      ) : null}

      {messages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucun message</Text>
          <Text style={styles.emptyBody}>
            Avancez le temps pour recevoir des offres mercato, des invitations match et des notifications.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MessageRow message={item} onPress={() => handleMessagePress(item)} />
          )}
        />
      )}

      <Pressable
        style={[styles.advanceBtn, isAdvancing && styles.advanceBtnDisabled]}
        onPress={() => void handleAdvanceTime()}
        disabled={isAdvancing}>
        <Text style={styles.advanceBtnText}>
          {isAdvancing ? 'Simulation…' : '⏩ Avancer le temps (+1 semaine)'}
        </Text>
      </Pressable>

      <Pressable style={styles.resetBtn} onPress={handleResetGame}>
        <Text style={styles.resetBtnText}>🔄 Nouvelle partie</Text>
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
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statChip: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 2,
  },
  mercatoBanner: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  mercatoText: {
    fontSize: 13,
    color: theme.colors.warning,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    marginBottom: theme.spacing.sm,
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  messageUnread: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  messageIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  messageTitleUnread: {
    color: theme.colors.primary,
  },
  messageBody: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  messageMeta: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyBody: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  advanceBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  advanceBtnDisabled: {
    opacity: 0.6,
  },
  advanceBtnText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  resetBtn: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});

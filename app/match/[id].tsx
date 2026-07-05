import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SigningNegotiationPanel } from '@/components/negotiation/SigningNegotiationPanel';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { theme } from '@/constants/theme';
import { getRequiredAgencyReputation } from '@/engine/simulation/reputationEngine';
import {
  findPlayerById,
  getClubFromStore,
  getMatchFixtureById,
  useGameStore,
} from '@/store/useGameStore';
import type { MatchEvent } from '@/types/match';
import type { Player } from '@/types/player';

const MATCH_DURATION_MS = GAME_CONFIG.MATCH_DURATION_MS;

type MatchPhase = 'loading' | 'live' | 'finished' | 'locker_room';

function countGoalsFromEvents(events: MatchEvent[]): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const event of events) {
    if (event.type !== 'goal') continue;
    if (event.teamSide === 'home') home += 1;
    else away += 1;
  }
  return { home, away };
}

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const runMatchSimulation = useGameStore((s) => s.runMatchSimulation);
  const completeMatch = useGameStore((s) => s.completeMatch);
  const signProPlayer = useGameStore((s) => s.signProPlayer);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const agencyReputation = useGameStore((s) => s.agency.reputation);
  const myPlayers = useGameStore((s) => s.myPlayers);
  const matchFixtures = useGameStore((s) => s.matchFixtures);

  const [gameMinute, setGameMinute] = useState(0);
  const [phase, setPhase] = useState<MatchPhase>('loading');
  const [visibleEvents, setVisibleEvents] = useState<MatchEvent[]>([]);
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
  const completedRef = useRef(false);

  const fixture = useMemo(() => {
    if (!id) return null;
    return getMatchFixtureById(id) ?? matchFixtures.find((m) => m.id === id) ?? null;
  }, [id, matchFixtures]);

  const homeClub = getClubFromStore(fixture?.homeClubId ?? null);
  const awayClub = getClubFromStore(fixture?.awayClubId ?? null);
  const client = fixture ? findPlayerById(fixture.clientPlayerId)?.player : null;

  const liveScore = useMemo(
    () => countGoalsFromEvents(visibleEvents),
    [visibleEvents],
  );

  useEffect(() => {
    if (!id || fixture?.result) return;
    runMatchSimulation(id);
  }, [id, fixture?.result, runMatchSimulation]);

  useEffect(() => {
    if (!fixture?.result) return;

    setPhase('live');
    const events = fixture.result.events;
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / MATCH_DURATION_MS);
      const minute = Math.floor(progress * 90);
      setGameMinute(minute);
      setVisibleEvents(events.filter((e) => e.minute <= minute));

      if (progress >= 1) {
        clearInterval(interval);
        setGameMinute(90);
        setVisibleEvents(events);
        setPhase('finished');
      }
    }, 200);

    return () => clearInterval(interval);
  }, [fixture?.result]);

  useEffect(() => {
    if (phase !== 'finished' || !id || completedRef.current) return;
    completedRef.current = true;
    void completeMatch(id);
  }, [phase, id, completeMatch]);

  const postMatchPlayers = useMemo(() => {
    if (!fixture?.result) return [];
    const ids = new Set(myPlayers.map((p) => p.id));
    const allStats = [...fixture.result.homeStats, ...fixture.result.awayStats];
    return allStats
      .map((s) => findPlayerById(s.playerId)?.player)
      .filter((p): p is Player => !!p && !ids.has(p.id) && !p.isClient);
  }, [fixture?.result, myPlayers]);

  if (!fixture || !homeClub || !awayClub) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Match introuvable.</Text>
      </View>
    );
  }

  const scoreText = `${liveScore.home} - ${liveScore.away}`;

  return (
    <>
      <Stack.Screen options={{ title: `${homeClub.shortName} vs ${awayClub.shortName}` }} />
      <View style={styles.container}>
        <View style={styles.scoreboard}>
          <Text style={styles.clubName}>{homeClub.name}</Text>
          <Text style={styles.score}>{scoreText}</Text>
          <Text style={styles.clubName}>{awayClub.name}</Text>
        </View>

        <View style={styles.chrono}>
          {phase === 'loading' ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.chronoText}>
              {gameMinute}' {phase === 'finished' || phase === 'locker_room' ? '· Terminé' : ''}
            </Text>
          )}
        </View>

        {client ? (
          <Text style={styles.clientHint}>Votre client : {client.displayName}</Text>
        ) : null}

        {phase !== 'locker_room' ? (
          <FlatList
            data={visibleEvents}
            keyExtractor={(item, i) => `${item.minute}-${item.type}-${i}`}
            style={styles.feed}
            contentContainerStyle={styles.feedContent}
            renderItem={({ item }) => (
              <Text style={[styles.eventLine, item.type === 'goal' && styles.eventGoal]}>
                {item.text}
              </Text>
            )}
            ListEmptyComponent={
              phase === 'loading' ? (
                <Text style={styles.waiting}>Préparation du match…</Text>
              ) : (
                <Text style={styles.waiting}>Le match est en cours…</Text>
              )
            }
          />
        ) : null}

        {phase === 'finished' ? (
          <View style={styles.endChoices}>
            <Text style={styles.endTitle}>Coup de sifflet final</Text>
            <Text style={styles.endSubtitle}>Que souhaitez-vous faire ?</Text>
            <View style={styles.endActions}>
              <Pressable style={styles.leaveBtn} onPress={() => router.back()}>
                <Text style={styles.leaveBtnText}>Quitter</Text>
              </Pressable>
              <Pressable style={styles.lockerBtn} onPress={() => setPhase('locker_room')}>
                <Text style={styles.lockerBtnText}>Aller au vestiaire</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {phase === 'locker_room' && fixture.result ? (
          <View style={styles.postMatch}>
            <View style={styles.lockerHeader}>
              <Text style={styles.postTitle}>Vestiaire</Text>
              <Pressable onPress={() => router.back()}>
                <Text style={styles.leaveLink}>Quitter</Text>
              </Pressable>
            </View>
            <Text style={styles.postSubtitle}>
              Discutez avec les joueurs repérés (réputation requise selon le niveau)
            </Text>
            <FlatList
              data={postMatchPlayers.slice(0, 12)}
              keyExtractor={(p) => p.id}
              style={styles.lockerList}
              renderItem={({ item: player }) => {
                const stat = [...fixture.result!.homeStats, ...fixture.result!.awayStats].find(
                  (s) => s.playerId === player.id,
                );
                const requiredRep = getRequiredAgencyReputation(player);
                const canApproach = agencyReputation >= requiredRep - 5;

                return (
                  <View style={styles.playerRow}>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.displayName}</Text>
                      <Text style={styles.playerMeta}>
                        {stat ? `${stat.minutes}' · Note ${stat.rating}` : ''} · Réputation min.{' '}
                        {requiredRep}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.talkBtn, !canApproach && styles.talkBtnDisabled]}
                      onPress={() => canApproach && setNegotiatingPlayer(player)}
                      disabled={!canApproach}>
                      <Text style={styles.talkBtnText}>
                        {canApproach ? 'Discuter' : 'Refuse'}
                      </Text>
                    </Pressable>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.waiting}>Aucun joueur à approcher pour le moment.</Text>
              }
            />
          </View>
        ) : null}
      </View>

      <SigningNegotiationPanel
        visible={negotiatingPlayer !== null}
        player={negotiatingPlayer}
        agencyBudget={agencyBudget}
        agencyReputation={agencyReputation}
        onClose={() => setNegotiatingPlayer(null)}
        onSign={async (offer) => {
          if (!negotiatingPlayer) return { success: false };
          return signProPlayer(negotiatingPlayer.id, offer);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  error: {
    color: theme.colors.danger,
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clubName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
  },
  chrono: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  chronoText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  clientHint: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  feed: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  feedContent: {
    padding: theme.spacing.md,
    gap: 6,
  },
  eventLine: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  eventGoal: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  waiting: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  endChoices: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  endTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  endSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  endActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  leaveBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  leaveBtnText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  lockerBtn: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  lockerBtnText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  postMatch: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  lockerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lockerList: {
    flex: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  leaveLink: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  postSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  playerMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  talkBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  talkBtnDisabled: {
    opacity: 0.4,
  },
  talkBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

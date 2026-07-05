import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { SigningNegotiationPanel } from '@/components/negotiation/SigningNegotiationPanel';
import { theme } from '@/constants/theme';
import { formatEstimatedRange } from '@/engine/simulation/matchScouting';
import { getRequiredAgencyReputation } from '@/engine/simulation/reputationEngine';
import {
  findPlayerById,
  getClubFromStore,
  getMatchFixtureById,
  useGameStore,
} from '@/store/useGameStore';
import type { Player } from '@/types/player';
import { PLAYER_POSITION_LABELS } from '@/types';

export default function MatchScoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const signProPlayer = useGameStore((s) => s.signProPlayer);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const agencyReputation = useGameStore((s) => s.agency.reputation);
  const myPlayers = useGameStore((s) => s.myPlayers);
  const matchFixtures = useGameStore((s) => s.matchFixtures);

  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);

  const fixture = useMemo(() => {
    if (!id) return null;
    return getMatchFixtureById(id) ?? matchFixtures.find((m) => m.id === id) ?? null;
  }, [id, matchFixtures]);

  const homeClub = getClubFromStore(fixture?.homeClubId ?? null);
  const awayClub = getClubFromStore(fixture?.awayClubId ?? null);
  const client = fixture ? findPlayerById(fixture.clientPlayerId)?.player : null;

  const profiles = fixture?.scoutProfiles ?? [];
  const myIds = useMemo(() => new Set(myPlayers.map((p) => p.id)), [myPlayers]);

  if (!fixture || !homeClub || !awayClub || !fixture.result) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Rapport de match introuvable.</Text>
      </View>
    );
  }

  const score = `${fixture.result.homeScore} - ${fixture.result.awayScore}`;

  return (
    <>
      <Stack.Screen options={{ title: 'Joueurs repérés' }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.matchTitle}>
            {homeClub.shortName} {score} {awayClub.shortName}
          </Text>
          <Text style={styles.matchMeta}>
            Semaine {fixture.week} · {fixture.status === 'skipped' ? 'Match simulé' : 'Après match'}
            {client ? ` · Client : ${client.displayName}` : ''}
          </Text>
          <Text style={styles.hint}>
            Niveau estimé sur 20 — la vraie note se situe dans la fourchette affichée.
          </Text>
        </View>

        <FlatList
          data={profiles}
          keyExtractor={(item) => item.playerId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const playerInfo = findPlayerById(item.playerId);
            const player = playerInfo?.player;
            if (!player || myIds.has(player.id)) return null;

            const club = getClubFromStore(item.clubId);
            const requiredRep = getRequiredAgencyReputation(player);
            const canApproach = agencyReputation >= requiredRep - 5;

            return (
              <View style={styles.playerCard}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.displayName}</Text>
                  <Text style={styles.playerMeta}>
                    {PLAYER_POSITION_LABELS[player.position]} · {player.age} ans ·{' '}
                    {club?.shortName ?? '—'}
                  </Text>
                  <Text style={styles.estimate}>
                    Niveau estimé : {formatEstimatedRange(item.estimatedMin, item.estimatedMax)}
                  </Text>
                  <Text style={styles.performance}>
                    {item.minutes}' jouées
                    {item.goals > 0 ? ` · ${item.goals} but${item.goals > 1 ? 's' : ''}` : ''} · Note
                    match {item.matchRating}
                  </Text>
                  <Text style={styles.rep}>Réputation agence min. {requiredRep}</Text>
                </View>
                <Pressable
                  style={[styles.talkBtn, !canApproach && styles.talkBtnDisabled]}
                  onPress={() => canApproach && setNegotiatingPlayer(player)}
                  disabled={!canApproach}>
                  <Text style={styles.talkBtnText}>
                    {canApproach ? 'Proposer' : 'Refuse'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun joueur repérable sur ce match.</Text>
          }
        />

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>
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
  header: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  matchMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.warning,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },
  list: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  playerMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  estimate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warning,
    marginTop: 4,
  },
  performance: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rep: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  talkBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  talkBtnDisabled: {
    opacity: 0.4,
  },
  talkBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    padding: theme.spacing.lg,
  },
  backBtn: {
    padding: theme.spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  backBtnText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});

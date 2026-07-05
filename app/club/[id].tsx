import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { overallToDisplay } from '@/engine/players/potentialEstimate';
import { useGameStore } from '@/store/useGameStore';
import { PLAYER_POSITION_LABELS } from '@/types';

export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const clubs = useGameStore((s) => s.clubs);
  const leagues = useGameStore((s) => s.leagues);
  const worldPlayers = useGameStore((s) => s.worldPlayers);
  const myPlayers = useGameStore((s) => s.myPlayers);
  const standings = useGameStore((s) => s.standings);

  const club = useMemo(() => clubs.find((c) => c.id === id), [clubs, id]);
  const league = useMemo(
    () => (club ? leagues.find((l) => l.id === club.leagueId) : undefined),
    [leagues, club],
  );

  const squad = useMemo(() => {
    if (!club) return [];
    return [...worldPlayers, ...myPlayers]
      .filter((p) => p.contract.clubId === club.id)
      .sort((a, b) => b.overallRating - a.overallRating);
  }, [worldPlayers, myPlayers, club]);

  const standing = useMemo(() => {
    if (!club) return null;
    const row = standings.find((s) => s.clubId === club.id);
    if (!row) return null;
    const sameComp = standings
      .filter((s) => s.competitionId === row.competitionId)
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst),
      );
    const rank = sameComp.findIndex((s) => s.clubId === club.id) + 1;
    return { ...row, rank, total: sameComp.length };
  }, [standings, club]);

  if (!club) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Club introuvable.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: club.name }} />
      <View style={styles.container}>
        <View style={[styles.header, { borderLeftColor: club.colors.primary }]}>
          <Text style={styles.clubName}>{club.name}</Text>
          <Text style={styles.clubMeta}>
            {league?.name ?? 'Ligue inconnue'} · Réputation {club.reputation}/100
          </Text>
          {standing ? (
            <Text style={styles.clubStanding}>
              {standing.rank}ᵉ / {standing.total} · {standing.points} pts ({standing.won}V{' '}
              {standing.drawn}N {standing.lost}D)
            </Text>
          ) : null}
          <Text style={styles.hint}>
            Ces joueurs ne sont pas recrutables directement — croisez-les en match pour leur
            proposer vos services.
          </Text>
        </View>

        <FlatList
          data={squad}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.playerRow}
              onPress={() => router.push(`/player/${item.id}`)}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {item.displayName}
                  {item.isClient ? '  ⭐' : ''}
                </Text>
                <Text style={styles.playerMeta}>
                  {PLAYER_POSITION_LABELS[item.position]} · {item.age} ans ·{' '}
                  {item.nationality}
                </Text>
              </View>
              <Text style={styles.playerRating}>
                {overallToDisplay(item.overallRating)}/20
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Effectif indisponible pour ce club.</Text>
          }
        />
      </View>
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
    borderLeftWidth: 4,
  },
  clubName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  clubMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  clubStanding: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.warning,
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },
  list: {
    gap: 6,
    paddingBottom: theme.spacing.lg,
  },
  playerRow: {
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
    fontWeight: '600',
    color: theme.colors.text,
  },
  playerMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  playerRating: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    padding: theme.spacing.lg,
  },
});

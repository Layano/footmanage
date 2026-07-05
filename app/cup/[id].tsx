import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';

export default function CupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const competitions = useGameStore((s) => s.competitions);
  const cupFixtures = useGameStore((s) => s.cupFixtures);
  const clubs = useGameStore((s) => s.clubs);
  const trophies = useGameStore((s) => s.trophies);
  const currentWeek = useGameStore((s) => s.currentWeek);

  const competition = useMemo(
    () => competitions.find((c) => c.id === id),
    [competitions, id],
  );

  const clubMap = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  const rounds = useMemo(() => {
    if (!competition) return [];
    const fixtures = cupFixtures.filter((f) => f.competitionId === competition.id);
    const byRound = new Map<number, typeof fixtures>();
    for (const f of fixtures) {
      const list = byRound.get(f.round) ?? [];
      list.push(f);
      byRound.set(f.round, list);
    }
    return [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, list]) => ({
        round,
        label: list[0]?.roundLabel ?? `Tour ${round}`,
        week: list[0]?.week ?? 0,
        fixtures: list,
      }));
  }, [competition, cupFixtures]);

  const winner = useMemo(() => {
    if (!competition) return null;
    return trophies.find((t) => t.competitionId === competition.id) ?? null;
  }, [trophies, competition]);

  if (!competition) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Compétition introuvable.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: competition.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.cupIcon}>🏆</Text>
          <Text style={styles.cupName}>{competition.name}</Text>
          <Text style={styles.cupMeta}>
            Saison {competition.season}/{competition.season + 1}
            {competition.type === 'continental' ? ' · Continental' : ' · Coupe nationale'}
          </Text>
          {winner ? (
            <View style={styles.winnerBanner}>
              <Text style={styles.winnerText}>Vainqueur : {winner.clubName}</Text>
            </View>
          ) : null}
        </View>

        {rounds.map(({ round, label, week, fixtures }) => (
          <View key={round} style={styles.roundBlock}>
            <View style={styles.roundHeader}>
              <Text style={styles.roundLabel}>{label}</Text>
              <Text style={styles.roundWeek}>
                {fixtures.every((f) => f.status === 'played')
                  ? 'Joué'
                  : week === currentWeek
                    ? 'Cette semaine'
                    : `Semaine ${week}`}
              </Text>
            </View>
            {fixtures.map((fixture) => {
              const home = clubMap.get(fixture.homeClubId);
              const away = clubMap.get(fixture.awayClubId);
              const played = fixture.status === 'played';
              const homeWins =
                played && (fixture.homeScore ?? 0) >= (fixture.awayScore ?? 0);

              return (
                <View key={fixture.id} style={styles.tie}>
                  <Pressable
                    style={styles.tieTeam}
                    onPress={() => router.push(`/club/${fixture.homeClubId}`)}>
                    <Text
                      style={[
                        styles.teamName,
                        played && homeWins && styles.teamWinner,
                        played && !homeWins && styles.teamLoser,
                      ]}
                      numberOfLines={1}>
                      {home?.name ?? '—'}
                    </Text>
                  </Pressable>
                  <Text style={styles.tieScore}>
                    {played ? `${fixture.homeScore} - ${fixture.awayScore}` : 'vs'}
                  </Text>
                  <Pressable
                    style={[styles.tieTeam, styles.tieTeamRight]}
                    onPress={() => router.push(`/club/${fixture.awayClubId}`)}>
                    <Text
                      style={[
                        styles.teamName,
                        styles.teamNameRight,
                        played && !homeWins && styles.teamWinner,
                        played && homeWins && styles.teamLoser,
                      ]}
                      numberOfLines={1}>
                      {away?.name ?? '—'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}

        {rounds.length === 0 ? (
          <Text style={styles.empty}>Le tirage n'a pas encore eu lieu.</Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
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
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cupIcon: {
    fontSize: 40,
  },
  cupName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  cupMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  winnerBanner: {
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  winnerText: {
    color: theme.colors.warning,
    fontWeight: '700',
  },
  roundBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  roundLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  roundWeek: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  tie: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tieTeam: {
    flex: 1,
  },
  tieTeamRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  teamWinner: {
    color: theme.colors.primary,
  },
  teamLoser: {
    color: theme.colors.textMuted,
  },
  tieScore: {
    minWidth: 60,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.warning,
    paddingHorizontal: theme.spacing.sm,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    padding: theme.spacing.lg,
  },
});

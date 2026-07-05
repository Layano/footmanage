import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { LEAGUE_TIER_LABELS } from '@/data/world/countries';
import { theme } from '@/constants/theme';
import {
  getRecentResults,
  getSortedStandings,
} from '@/engine/simulation/competitionEngine';
import { formatGameDate, getClubFromStore, useGameStore } from '@/store/useGameStore';
import type { Competition } from '@/types/competition';

export default function CompetitionsScreen() {
  const currentWeek = useGameStore((s) => s.currentWeek);
  const currentSeason = useGameStore((s) => s.currentSeason);
  const competitions = useGameStore((s) => s.competitions);
  const standings = useGameStore((s) => s.standings);
  const competitionResults = useGameStore((s) => s.competitionResults);
  const cupFixtures = useGameStore((s) => s.cupFixtures);
  const trophies = useGameStore((s) => s.trophies);
  const clubs = useGameStore((s) => s.clubs);
  const myPlayers = useGameStore((s) => s.myPlayers);
  const agencyCountryCode = useGameStore((s) => s.agencyCountryCode);

  const leagueComps = useMemo(
    () => competitions.filter((c) => c.type === 'league'),
    [competitions],
  );
  const cupComps = useMemo(
    () => competitions.filter((c) => c.type === 'domestic_cup'),
    [competitions],
  );
  const continentalComps = useMemo(
    () => competitions.filter((c) => c.type === 'continental'),
    [competitions],
  );

  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const activeLeagueId = selectedLeagueId ?? leagueComps[0]?.id ?? null;

  const leagueTable = useMemo(() => {
    if (!activeLeagueId) return [];
    return getSortedStandings(activeLeagueId, standings, clubs).slice(0, 12);
  }, [activeLeagueId, standings, clubs]);

  const recentLeagueResults = useMemo(() => {
    if (!activeLeagueId) return [];
    return getRecentResults(competitionResults, activeLeagueId, 6);
  }, [activeLeagueId, competitionResults]);

  const clientClubIds = useMemo(
    () =>
      myPlayers
        .map((p) => p.contract.clubId)
        .filter((id): id is string => id != null),
    [myPlayers],
  );

  const showcaseTrophies = useMemo(() => {
    const clientClubSet = new Set(clientClubIds);
    return trophies.filter(
      (t) =>
        t.countryCode === agencyCountryCode ||
        clientClubSet.has(t.clubId),
    );
  }, [trophies, agencyCountryCode, clientClubIds]);

  return (
    <ScreenContainer
      title="Compétitions"
      subtitle={formatGameDate(currentWeek, currentSeason)}
      scrollable>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Vitrine des trophées</Text>
        {showcaseTrophies.length === 0 ? (
          <Text style={styles.empty}>
            Aucun trophée pour l'instant. Vos clients et les clubs du pays peuvent briller en
            coupe ou en continental.
          </Text>
        ) : (
          showcaseTrophies
            .slice()
            .reverse()
            .slice(0, 8)
            .map((trophy) => (
              <View key={trophy.id} style={styles.trophyCard}>
                <Text style={styles.trophyIcon}>🏆</Text>
                <View style={styles.trophyInfo}>
                  <Text style={styles.trophyName}>{trophy.competitionName}</Text>
                  <Text style={styles.trophyMeta}>
                    {trophy.clubName} · Saison {trophy.season}/{trophy.season + 1}
                  </Text>
                </View>
              </View>
            ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Championnats en cours</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {leagueComps.map((comp) => (
            <Pressable
              key={comp.id}
              style={[styles.chip, activeLeagueId === comp.id && styles.chipActive]}
              onPress={() => setSelectedLeagueId(comp.id)}>
              <Text
                style={[styles.chipText, activeLeagueId === comp.id && styles.chipTextActive]}>
                {comp.leagueTier ? LEAGUE_TIER_LABELS[comp.leagueTier as keyof typeof LEAGUE_TIER_LABELS] ?? comp.shortName : comp.shortName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {leagueTable.length === 0 ? (
          <Text style={styles.empty}>Classement indisponible.</Text>
        ) : (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.rankCell]}>#</Text>
              <Text style={[styles.cell, styles.nameCell]}>Club</Text>
              <Text style={styles.cell}>J</Text>
              <Text style={styles.cell}>Pts</Text>
              <Text style={styles.cell}>Diff</Text>
            </View>
            {leagueTable.map((row, index) => (
              <View key={row.clubId} style={styles.tableRow}>
                <Text style={[styles.cell, styles.rankCell]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>
                  {row.clubName}
                </Text>
                <Text style={styles.cell}>{row.played}</Text>
                <Text style={[styles.cell, styles.pointsCell]}>{row.points}</Text>
                <Text style={styles.cell}>
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </Text>
              </View>
            ))}
          </View>
        )}

        {recentLeagueResults.length > 0 ? (
          <>
            <Text style={styles.subheading}>Derniers résultats</Text>
            {recentLeagueResults.map((result) => {
              const home = getClubFromStore(result.homeClubId);
              const away = getClubFromStore(result.awayClubId);
              return (
                <Text key={result.id} style={styles.resultLine}>
                  S{result.week} · {home?.shortName ?? '?'} {result.homeScore}-{result.awayScore}{' '}
                  {away?.shortName ?? '?'}
                </Text>
              );
            })}
          </>
        ) : null}
      </View>

      <CupSection title="Coupes nationales" competitions={cupComps} cupFixtures={cupFixtures} />
      <CupSection
        title="Compétitions continentales"
        competitions={continentalComps}
        cupFixtures={cupFixtures}
      />
    </ScreenContainer>
  );
}

function CupSection({
  title,
  competitions,
  cupFixtures,
}: {
  title: string;
  competitions: Competition[];
  cupFixtures: ReturnType<typeof useGameStore.getState>['cupFixtures'];
}) {
  if (competitions.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {competitions.map((comp) => {
        const fixtures = cupFixtures.filter((f) => f.competitionId === comp.id);
        const pending = fixtures.filter((f) => f.status === 'pending');
        const played = fixtures.filter((f) => f.status === 'played').slice(-4);

        return (
          <View key={comp.id} style={styles.cupBlock}>
            <Text style={styles.cupName}>{comp.name}</Text>
            {pending.length > 0 ? (
              <Text style={styles.cupMeta}>
                Prochain tour : {pending[0]!.roundLabel} (S{pending[0]!.week})
              </Text>
            ) : (
              <Text style={styles.cupMeta}>Saison en cours</Text>
            )}
            {played.map((f) => {
              const home = getClubFromStore(f.homeClubId);
              const away = getClubFromStore(f.awayClubId);
              return (
                <Text key={f.id} style={styles.resultLine}>
                  {f.roundLabel} · {home?.shortName} {f.homeScore}-{f.awayScore}{' '}
                  {away?.shortName}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  empty: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  trophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  trophyIcon: {
    fontSize: 28,
  },
  trophyInfo: {
    flex: 1,
  },
  trophyName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  trophyMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  chipRow: {
    marginBottom: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  chipText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
  table: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tableHeader: {
    borderTopWidth: 0,
    backgroundColor: theme.colors.background,
  },
  cell: {
    width: 36,
    fontSize: 13,
    color: theme.colors.text,
    textAlign: 'center',
  },
  rankCell: {
    width: 28,
    color: theme.colors.textMuted,
  },
  nameCell: {
    flex: 1,
    textAlign: 'left',
    fontWeight: '600',
  },
  pointsCell: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  resultLine: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  cupBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cupName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cupMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    marginBottom: theme.spacing.sm,
  },
});

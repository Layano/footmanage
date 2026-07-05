import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SigningNegotiationPanel } from '@/components/negotiation/SigningNegotiationPanel';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { getCountryByCode } from '@/data/world/countries';
import { isNeighborhoodAmateur } from '@/engine/players/amateurGenerator';
import { estimatePotential, overallToDisplay } from '@/engine/players/potentialEstimate';
import { getClubFromStore, getWorldMarketPlayers, useGameStore } from '@/store/useGameStore';
import { getPlayerTeamLabel } from '@/utils/playerDisplay';
import { PLAYER_POSITION_LABELS } from '@/types';
import type { Player } from '@/types/player';

export default function ScoutingScreen() {
  const router = useRouter();

  const isHydrated = useGameStore((s) => s.isHydrated);
  const scoutedPlayers = useGameStore((s) => s.scoutedPlayers);
  const agencyBudget = useGameStore((s) => s.agencyBudget);
  const staff = useGameStore((s) => s.staff);
  const isTutorialActive = useGameStore((s) => s.isTutorialActive);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const scoutNeighborhoodTournament = useGameStore((s) => s.scoutNeighborhoodTournament);
  const signAmateurPlayer = useGameStore((s) => s.signAmateurPlayer);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const agencyCountryCode = useGameStore((s) => s.agencyCountryCode);
  const agencyReputation = useGameStore((s) => s.agency.reputation);
  const currentTournament = useGameStore((s) => s.currentTournament);
  const agencyCity = useGameStore((s) => s.agency.office.city);

  const [view, setView] = useState<'local' | 'market'>('local');
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);

  const countryName = getCountryByCode(agencyCountryCode)?.name ?? agencyCountryCode;
  const travelCost = currentTournament?.travelCost ?? 0;
  const tournamentCity = currentTournament?.city ?? '—';

  const marketPlayers = useMemo(
    () => getWorldMarketPlayers(agencyCountryCode).slice(0, 40),
    [agencyCountryCode, scoutedPlayers.length],
  );

  const displayPlayers = view === 'local' ? scoutedPlayers : marketPlayers;

  useEffect(() => {
    if (isTutorialActive && tutorialStep === 1) {
      setTutorialStep(2);
    }
  }, [isTutorialActive, tutorialStep, setTutorialStep]);

  const handleTournament = async () => {
    const success = await scoutNeighborhoodTournament();
    if (!success) {
      Alert.alert(
        'Fonds insuffisants',
        `Il vous faut au moins ${travelCost} € pour vous rendre à ${tournamentCity}.`,
      );
    }
  };

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const canAffordTournament = agencyBudget >= travelCost;
  const highlightTournament = isTutorialActive && tutorialStep === 2;
  const isLocalTrip = tournamentCity === agencyCity;

  return (
    <ScreenContainer
      title="Scouting / Mercato"
      subtitle={`${scoutedPlayers.length} joueur(s) à observer`}>
      <Pressable
        style={[
          styles.tournamentButton,
          highlightTournament && styles.tournamentButtonHighlight,
          !canAffordTournament && styles.tournamentButtonDisabled,
        ]}
        onPress={() => void handleTournament()}
        disabled={!canAffordTournament}>
        <Text style={styles.tournamentTitle}>🏘️ Tournoi de quartier — {tournamentCity}</Text>
        <Text style={styles.tournamentDetails}>
          {isLocalTrip ? 'Tournoi local' : `Déplacement depuis ${agencyCity}`} · Trajet : {travelCost} €
          {' · '}+1 semaine · 3 jeunes {countryName}
        </Text>
      </Pressable>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, view === 'local' && styles.tabActive]}
          onPress={() => setView('local')}>
          <Text style={[styles.tabText, view === 'local' && styles.tabTextActive]}>
            Prospects locaux
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, view === 'market' && styles.tabActive]}
          onPress={() => setView('market')}>
          <Text style={[styles.tabText, view === 'market' && styles.tabTextActive]}>
            Marché national
          </Text>
        </Pressable>
      </View>

      {displayPlayers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {view === 'local'
              ? `Aucun prospect local. Rendez-vous au tournoi de ${tournamentCity}.`
              : 'Aucun joueur disponible sur le marché national pour le moment.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayPlayers}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const club = getClubFromStore(item.contract.clubId);
            const signable = isNeighborhoodAmateur(item);
            const highlightSign = isTutorialActive && tutorialStep === 3 && signable;
            const potential = estimatePotential(item, staff);
            const teamLabel = getPlayerTeamLabel(item, club);

            return (
              <View style={[styles.card, highlightSign && styles.cardHighlight]}>
                <Pressable onPress={() => router.push(`/player/${item.id}`)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.playerName}>{item.displayName}</Text>
                    <Text style={styles.rating}>{overallToDisplay(item.overallRating)}/20</Text>
                  </View>
                  <Text style={styles.details}>
                    {PLAYER_POSITION_LABELS[item.position]} · {item.age} ans · {item.nationality}
                  </Text>
                  <Text style={styles.team}>🏟️ {teamLabel}</Text>
                  {item.scoutedFromCity ? (
                    <Text style={styles.scoutedCity}>📍 Repéré à {item.scoutedFromCity}</Text>
                  ) : null}
                  <Text style={styles.potential}>
                    {potential.stars} {potential.label}
                  </Text>
                  {potential.rangeText ? (
                    <Text style={styles.potentialRange}>{potential.rangeText}</Text>
                  ) : (
                    <Text style={styles.potentialHint}>
                      {potential.hint ?? 'Tapez pour voir la fiche complète'}
                    </Text>
                  )}
                  <Text style={styles.viewDetail}>Voir la fiche →</Text>
                </Pressable>

                {signable ? (
                  <Pressable
                    style={[styles.signButton, highlightSign && styles.signButtonHighlight]}
                    onPress={() => setNegotiatingPlayer(item)}>
                    <Text style={styles.signButtonText}>✍️ Négocier le contrat</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />
      )}

      <SigningNegotiationPanel
        visible={negotiatingPlayer !== null}
        player={negotiatingPlayer}
        agencyBudget={agencyBudget}
        onClose={() => setNegotiatingPlayer(null)}
        onSign={async (offer) => {
          if (!negotiatingPlayer) return { success: false };
          const result = await signAmateurPlayer(negotiatingPlayer.id, offer);
          if (result.success) {
            Alert.alert('Joueur signé !', `${negotiatingPlayer.displayName} rejoint votre agence.`);
            setNegotiatingPlayer(null);
          }
          return result;
        }}
      />
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
  tournamentButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tournamentButtonHighlight: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceLight,
  },
  tournamentButtonDisabled: {
    opacity: 0.5,
  },
  tournamentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  tournamentDetails: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  tabRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  tabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  tabText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHighlight: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  rating: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  details: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  team: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  scoutedCity: {
    fontSize: 13,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  potential: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  potentialRange: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  potentialHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  viewDetail: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  signButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  signButtonHighlight: {
    backgroundColor: theme.colors.primaryDark,
  },
  signButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

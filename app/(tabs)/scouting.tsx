import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SigningNegotiationPanel } from '@/components/negotiation/SigningNegotiationPanel';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { theme } from '@/constants/theme';
import { FOOTBALL_COUNTRIES, getCountryByCode } from '@/data/world/countries';
import { getUnlockCost, getUnlockReputationRequired } from '@/engine/world/countryUnlock';
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
  const unlockCountry = useGameStore((s) => s.unlockCountry);
  const unlockedCountryCodes = useGameStore((s) => s.unlockedCountryCodes);
  const agencyCountryCode = useGameStore((s) => s.agencyCountryCode);
  const agencyReputation = useGameStore((s) => s.agency.reputation);
  const currentTournament = useGameStore((s) => s.currentTournament);
  const agencyCity = useGameStore((s) => s.agency.office.city);

  const [view, setView] = useState<'local' | 'market' | 'unlock'>('local');
  const [marketCountry, setMarketCountry] = useState(agencyCountryCode);
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);

  const countryName = getCountryByCode(agencyCountryCode)?.name ?? agencyCountryCode;
  const travelCost = currentTournament?.travelCost ?? 0;
  const tournamentCity = currentTournament?.city ?? '—';

  const marketPlayers = useMemo(
    () => getWorldMarketPlayers(marketCountry).slice(0, 40),
    [marketCountry, scoutedPlayers.length, unlockedCountryCodes.length],
  );

  const lockedCountries = useMemo(
    () =>
      FOOTBALL_COUNTRIES.filter(
        (c) => c.code !== agencyCountryCode && !unlockedCountryCodes.includes(c.code),
      ),
    [agencyCountryCode, unlockedCountryCodes],
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
            Marché
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, view === 'unlock' && styles.tabActive]}
          onPress={() => setView('unlock')}>
          <Text style={[styles.tabText, view === 'unlock' && styles.tabTextActive]}>
            Pays
          </Text>
        </Pressable>
      </View>

      {view === 'market' && unlockedCountryCodes.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryRow}>
          {unlockedCountryCodes.map((code) => {
            const c = getCountryByCode(code);
            if (!c) return null;
            return (
              <Pressable
                key={code}
                style={[styles.countryChip, marketCountry === code && styles.countryChipActive]}
                onPress={() => setMarketCountry(code)}>
                <Text
                  style={[
                    styles.countryChipText,
                    marketCountry === code && styles.countryChipTextActive,
                  ]}>
                  {c.flag} {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {view === 'unlock' ? (
        <View style={styles.unlockList}>
          <Text style={styles.unlockHint}>
            Seul votre pays d'origine est actif au départ. Débloquez de nouveaux marchés pour
            générer championnats, clubs et effectifs équilibrés.
          </Text>
          {lockedCountries.map((country) => {
            const cost = getUnlockCost(country, unlockedCountryCodes.length);
            const repReq = getUnlockReputationRequired(country);
            const canAfford = agencyBudget >= cost;
            const hasRep = agencyReputation >= repReq;

            return (
              <View key={country.code} style={styles.unlockCard}>
                <Text style={styles.unlockName}>
                  {country.flag} {country.name}
                </Text>
                <Text style={styles.unlockMeta}>
                  {cost.toLocaleString('fr-FR')} € · Réputation {repReq}+
                </Text>
                <Pressable
                  style={[
                    styles.unlockBtn,
                    (!canAfford || !hasRep) && styles.unlockBtnDisabled,
                  ]}
                  onPress={() => {
                    void unlockCountry(country.code).then((result) => {
                      if (result.success) {
                        Alert.alert('Marché débloqué', `${country.name} est maintenant accessible.`);
                      } else {
                        Alert.alert('Déblocage impossible', result.reason ?? 'Erreur.');
                      }
                    });
                  }}
                  disabled={!canAfford || !hasRep}>
                  <Text style={styles.unlockBtnText}>Débloquer</Text>
                </Pressable>
              </View>
            );
          })}
          {lockedCountries.length === 0 ? (
            <Text style={styles.emptyText}>Tous les pays sont débloqués !</Text>
          ) : null}
        </View>
      ) : displayPlayers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {view === 'local'
              ? `Aucun prospect local. Rendez-vous au tournoi de ${tournamentCity}.`
              : view === 'market'
                ? `Aucun joueur disponible sur le marché ${getCountryByCode(marketCountry)?.name ?? ''}.`
                : 'Aucun joueur disponible.'}
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
            const signable = isNeighborhoodAmateur(item) && item.status !== 'injured';
            const isInjured = item.status === 'injured';
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
                  {isInjured ? (
                    <Text style={styles.injured}>🤕 Blessé — revenez dans quelques semaines</Text>
                  ) : null}
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
        agencyReputation={agencyReputation}
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
  injured: {
    fontSize: 13,
    color: theme.colors.danger,
    fontWeight: '600',
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
  countryRow: {
    marginBottom: theme.spacing.md,
  },
  countryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  countryChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  countryChipText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  countryChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  unlockList: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  unlockHint: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  unlockCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  unlockName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    minWidth: '50%',
  },
  unlockMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
    width: '100%',
  },
  unlockBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginLeft: 'auto',
  },
  unlockBtnDisabled: {
    opacity: 0.45,
  },
  unlockBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
});

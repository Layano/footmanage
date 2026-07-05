import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FOOTBALL_COUNTRIES } from '@/data/world/countries';
import { theme } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';
import {
  GAME_MODE_DESCRIPTIONS,
  GAME_MODE_LABELS,
  type GameMode,
} from '@/types/world';

const GAME_MODES: GameMode[] = ['career', 'challenge', 'sandbox'];

export default function NewGameScreen() {
  const router = useRouter();
  const startNewGame = useGameStore((s) => s.startNewGame);
  const isHydrated = useGameStore((s) => s.isHydrated);

  const [agencyName, setAgencyName] = useState('');
  const [countryCode, setCountryCode] = useState('FRA');
  const [gameMode, setGameMode] = useState<GameMode>('career');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FOOTBALL_COUNTRIES;
    return FOOTBALL_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [search]);

  const selectedCountry = FOOTBALL_COUNTRIES.find((c) => c.code === countryCode);

  const handleStart = async () => {
    const name = agencyName.trim() || 'Mon Agence';
    if (gameMode !== 'career') return;

    setLoading(true);
    try {
      await startNewGame({ agencyName: name, countryCode, gameMode });
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FootManage</Text>
      <Text style={styles.subtitle}>Créez votre agence de joueurs</Text>

      <Text style={styles.label}>Nom de l'agence</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Elite Sport Management"
        placeholderTextColor={theme.colors.textMuted}
        value={agencyName}
        onChangeText={setAgencyName}
      />

      <Text style={styles.label}>Pays d'origine</Text>
      <TextInput
        style={styles.input}
        placeholder="Rechercher un pays…"
        placeholderTextColor={theme.colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredCountries}
        keyExtractor={(item) => item.code}
        style={styles.countryList}
        renderItem={({ item }) => {
          const selected = item.code === countryCode;
          const leagueCount = item.tier === 'elite' ? 5 : item.tier === 'major' ? 3 : 2;
          return (
            <Pressable
              style={[styles.countryRow, selected && styles.countryRowSelected]}
              onPress={() => setCountryCode(item.code)}>
              <Text style={styles.countryFlag}>{item.flag}</Text>
              <View style={styles.countryInfo}>
                <Text style={[styles.countryName, selected && styles.countryNameSelected]}>
                  {item.name}
                </Text>
                <Text style={styles.countryMeta}>
                  {leagueCount} championnats · {item.defaultCity}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Text style={styles.label}>Mode de jeu</Text>
      <View style={styles.modeRow}>
        {GAME_MODES.map((mode) => {
          const disabled = mode !== 'career';
          const selected = gameMode === mode;
          return (
            <Pressable
              key={mode}
              style={[
                styles.modeChip,
                selected && styles.modeChipSelected,
                disabled && styles.modeChipDisabled,
              ]}
              onPress={() => !disabled && setGameMode(mode)}
              disabled={disabled}>
              <Text style={[styles.modeChipText, selected && styles.modeChipTextSelected]}>
                {GAME_MODE_LABELS[mode]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.modeDesc}>{GAME_MODE_DESCRIPTIONS[gameMode]}</Text>

      {selectedCountry ? (
        <Text style={styles.summary}>
          Votre agence démarre à {selectedCountry.defaultCity} ({selectedCountry.name}) avec{' '}
          {selectedCountry.tier === 'elite' ? 5 : selectedCountry.tier === 'major' ? 3 : 2}{' '}
          championnats générés.
        </Text>
      ) : null}

      <Pressable
        style={[styles.startButton, loading && styles.startButtonDisabled]}
        onPress={() => void handleStart()}
        disabled={loading || gameMode !== 'career'}>
        <Text style={styles.startButtonText}>
          {loading ? 'Génération du monde…' : 'Démarrer la carrière'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
  },
  countryList: {
    maxHeight: 200,
    marginVertical: theme.spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  countryRowSelected: {
    backgroundColor: theme.colors.surfaceLight,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  countryNameSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  countryMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  modeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modeChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  modeChipDisabled: {
    opacity: 0.45,
  },
  modeChipText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  modeChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modeDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  summary: {
    fontSize: 13,
    color: theme.colors.warning,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
});

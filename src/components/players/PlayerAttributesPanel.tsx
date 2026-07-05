import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { Player } from '@/types/player';
import { isGoalkeeper } from '@/types/player';
import { PLAYER_POSITION_LABELS } from '@/types/positions';

const PHYSICAL_LABELS: Record<string, string> = {
  speed: 'Vitesse',
  acceleration: 'Accélération',
  endurance: 'Endurance',
  strength: 'Force',
  agility: 'Agilité',
};

const OUTFIELD_TECH_LABELS: Record<string, string> = {
  shooting: 'Tir',
  passing: 'Passe',
  dribbling: 'Dribble',
  control: 'Contrôle',
  crossing: 'Centres',
  tackling: 'Tacle',
  marking: 'Marquage',
};

const GK_TECH_LABELS: Record<string, string> = {
  reflexes: 'Réflexes',
  diving: 'Plongeon',
  passing: 'Passe',
  control: 'Contrôle',
};

const MENTAL_LABELS: Record<string, string> = {
  determination: 'Détermination',
  vision: 'Vision',
  composure: 'Sang-froid',
  positioning: 'Placement',
  workRate: 'Volume de jeu',
};

interface StatGroupProps {
  title: string;
  stats: object;
  labels: Record<string, string>;
}

function StatGroup({ title, stats, labels }: StatGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {Object.entries(stats as Record<string, number>).map(([key, value]) => (
        <View key={key} style={styles.statRow}>
          <Text style={styles.statLabel}>{labels[key] ?? key}</Text>
          <View style={styles.statBarBg}>
            <View style={[styles.statBarFill, { width: `${(value / 20) * 100}%` }]} />
          </View>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

interface PlayerAttributesPanelProps {
  player: Player;
}

export function PlayerAttributesPanel({ player }: PlayerAttributesPanelProps) {
  const { attributes } = player;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.position}>{PLAYER_POSITION_LABELS[player.position]}</Text>
        <Text style={styles.overall}>{Math.round(player.overallRating / 5)}/20</Text>
      </View>

      <StatGroup title="Physique" stats={attributes.physical} labels={PHYSICAL_LABELS} />

      <StatGroup
        title="Technique"
        stats={attributes.technical}
        labels={isGoalkeeper(player) ? GK_TECH_LABELS : OUTFIELD_TECH_LABELS}
      />

      <StatGroup title="Mental" stats={attributes.mental} labels={MENTAL_LABELS} />

      <View style={styles.metaRow}>
        <Text style={styles.meta}>Pied : {player.preferredFoot === 'both' ? 'Ambidextre' : player.preferredFoot === 'left' ? 'Gauche' : 'Droit'}</Text>
        <Text style={styles.meta}>Forme : {player.form}%</Text>
        <Text style={styles.meta}>Moral : {player.morale}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  position: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  overall: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  group: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  statLabel: {
    width: 100,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  statBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  statValue: {
    width: 24,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});

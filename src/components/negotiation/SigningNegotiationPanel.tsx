import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GAME_CONFIG } from '@/constants/gameConfig';
import { theme } from '@/constants/theme';
import {
  evaluateNegotiation,
  getDefaultOffer,
  getPlayerDemands,
} from '@/engine/negotiation/amateurNegotiation';
import type { NegotiationOffer } from '@/types/agentContract';
import type { Player } from '@/types/player';

interface SigningNegotiationPanelProps {
  visible: boolean;
  player: Player | null;
  agencyBudget: number;
  onClose: () => void;
  onSign: (offer: NegotiationOffer) => Promise<{ success: boolean; reason?: string }>;
}

function SliderRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>
          {value}
          {unit}
        </Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SigningNegotiationPanel({
  visible,
  player,
  agencyBudget,
  onClose,
  onSign,
}: SigningNegotiationPanelProps) {
  const [offer, setOffer] = useState<NegotiationOffer | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (player && visible) {
      setOffer(getDefaultOffer(player));
      setFeedback(null);
    }
  }, [player, visible]);

  const preview = useMemo(() => {
    if (!player || !offer) return null;
    return evaluateNegotiation(player, offer);
  }, [player, offer]);

  const demands = player ? getPlayerDemands(player) : null;

  if (!player || !offer || !demands) {
    return null;
  }

  const handleSign = async () => {
    setLoading(true);
    try {
      const result = await onSign(offer);
      if (result.success) {
        onClose();
      } else {
        setFeedback(result.reason ?? 'Le joueur a refusé votre offre.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Négociation — {player.displayName}</Text>
            <Text style={styles.subtitle}>
              {player.nationality} · {player.age} ans
              {player.scoutedFromCity ? ` · Repéré à ${player.scoutedFromCity}` : ''}
            </Text>

            <View style={styles.demandsCard}>
              <Text style={styles.sectionTitle}>Exigences du joueur</Text>
              <Text style={styles.demandLine}>
                Commission salaire max : {demands.maxSalaryCommissionPercent}%
              </Text>
              <Text style={styles.demandLine}>
                Commission transfert max : {demands.maxTransferCommissionPercent}%
              </Text>
              <Text style={styles.demandLine}>
                Prime de signature min : {demands.minSigningBonus} €
              </Text>
              <Text style={styles.demandLine}>
                Part sponsoring max : {demands.maxSponsoringSharePercent}%
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Votre offre</Text>

            <SliderRow
              label="Commission sur salaire"
              value={offer.salaryCommissionPercent}
              min={GAME_CONFIG.NEGOTIATION_MIN_SALARY_COMMISSION}
              max={GAME_CONFIG.NEGOTIATION_MAX_SALARY_COMMISSION}
              unit="%"
              onChange={(v) => setOffer({ ...offer, salaryCommissionPercent: v })}
            />
            <SliderRow
              label="Commission sur transfert"
              value={offer.transferCommissionPercent}
              min={3}
              max={GAME_CONFIG.NEGOTIATION_MAX_TRANSFER_COMMISSION}
              unit="%"
              onChange={(v) => setOffer({ ...offer, transferCommissionPercent: v })}
            />
            <SliderRow
              label="Part sponsoring"
              value={offer.sponsoringSharePercent}
              min={0}
              max={GAME_CONFIG.NEGOTIATION_MAX_SPONSORING_SHARE}
              unit="%"
              onChange={(v) => setOffer({ ...offer, sponsoringSharePercent: v })}
            />

            <View style={styles.bonusRow}>
              <Text style={styles.sliderLabel}>Prime de signature (€)</Text>
              <TextInput
                style={styles.bonusInput}
                keyboardType="numeric"
                value={String(offer.signingBonus)}
                onChangeText={(text) => {
                  const n = Number.parseInt(text.replace(/\D/g, ''), 10);
                  setOffer({
                    ...offer,
                    signingBonus: Number.isFinite(n)
                      ? Math.min(GAME_CONFIG.NEGOTIATION_MAX_SIGNING_BONUS, n)
                      : 0,
                  });
                }}
              />
            </View>

            {preview ? (
              <View
                style={[
                  styles.previewCard,
                  preview.accepted ? styles.previewAccepted : styles.previewRejected,
                ]}>
                <Text style={styles.previewScore}>Satisfaction : {preview.satisfactionScore}/100</Text>
                <Text style={styles.previewText}>{preview.feedback}</Text>
              </View>
            ) : null}

            {feedback ? <Text style={styles.errorText}>{feedback}</Text> : null}

            <Text style={styles.budgetHint}>
              Trésorerie après prime : {(agencyBudget + offer.signingBonus).toLocaleString('fr-FR')} €
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.signBtn, loading && styles.signBtnDisabled]}
              onPress={() => void handleSign()}
              disabled={loading}>
              <Text style={styles.signBtnText}>
                {loading ? 'Négociation…' : 'Proposer le contrat'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  demandsCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 10,
    padding: theme.spacing.md,
    gap: 4,
  },
  demandLine: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  sliderHeader: {
    flex: 1,
  },
  sliderLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.warning,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: '600',
  },
  bonusRow: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  bonusInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
  },
  previewCard: {
    borderRadius: 10,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  previewAccepted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  previewRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  previewScore: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  budgetHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  signBtn: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  signBtnDisabled: {
    opacity: 0.6,
  },
  signBtnText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});

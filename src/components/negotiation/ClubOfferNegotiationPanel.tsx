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

import {
  PLAYING_TIME_ROLE_LABELS,
  PLAYING_TIME_ROLES,
  type PlayingTimeRole,
} from '@/constants/playingTime';
import { theme } from '@/constants/theme';
import {
  evaluateClubNegotiation,
  getDefaultCounterTerms,
} from '@/engine/negotiation/clubOfferNegotiation';
import type { Club } from '@/types/club';
import type { Player } from '@/types/player';
import type { ClubContractOffer, NegotiableClubOfferTerms } from '@/types/transfer';

interface ClubOfferNegotiationPanelProps {
  visible: boolean;
  offer: ClubContractOffer | null;
  club: Club | null;
  player: Player | null;
  onClose: () => void;
  onSubmit: (terms: NegotiableClubOfferTerms) => Promise<{ success: boolean; reason?: string }>;
}

export function ClubOfferNegotiationPanel({
  visible,
  offer,
  club,
  player,
  onClose,
  onSubmit,
}: ClubOfferNegotiationPanelProps) {
  const [terms, setTerms] = useState<NegotiableClubOfferTerms | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (offer && visible) {
      setTerms(getDefaultCounterTerms(offer));
      setFeedback(null);
    }
  }, [offer, visible]);

  const preview = useMemo(() => {
    if (!offer || !terms || !club || !player) return null;
    return evaluateClubNegotiation(offer, terms, club, player);
  }, [offer, terms, club, player]);

  if (!offer || !terms || !club || !player) return null;

  const cycleRole = (direction: 1 | -1) => {
    const idx = PLAYING_TIME_ROLES.indexOf(terms.playingTimeRole);
    const next = PLAYING_TIME_ROLES[idx + direction];
    if (next) setTerms({ ...terms, playingTimeRole: next });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await onSubmit(terms);
      if (result.success) {
        onClose();
      } else {
        setFeedback(result.reason ?? 'Le club a refusé.');
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
            <Text style={styles.title}>Négocier avec {club.name}</Text>
            <Text style={styles.subtitle}>Pour {player.displayName}</Text>

            <Text style={styles.section}>Offre initiale du club</Text>
            <Text style={styles.originalLine}>
              {PLAYING_TIME_ROLE_LABELS[offer.originalTerms.playingTimeRole]} ·{' '}
              {offer.originalTerms.monthlyWage.toLocaleString('fr-FR')} €/mois ·{' '}
              {offer.originalTerms.fee.toLocaleString('fr-FR')} €
            </Text>

            <Text style={styles.section}>Votre contre-proposition</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Rôle promis</Text>
              <View style={styles.roleRow}>
                <Pressable style={styles.stepBtn} onPress={() => cycleRole(-1)}>
                  <Text style={styles.stepBtnText}>−</Text>
                </Pressable>
                <Text style={styles.roleValue}>{PLAYING_TIME_ROLE_LABELS[terms.playingTimeRole]}</Text>
                <Pressable style={styles.stepBtn} onPress={() => cycleRole(1)}>
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Salaire mensuel (€)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(terms.monthlyWage)}
                onChangeText={(t) => {
                  const n = Number.parseInt(t.replace(/\D/g, ''), 10);
                  setTerms({ ...terms, monthlyWage: Number.isFinite(n) ? n : 0 });
                }}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>
                {offer.type === 'loan' ? 'Indemnité prêt (€)' : 'Prix transfert (€)'}
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(terms.fee)}
                onChangeText={(t) => {
                  const n = Number.parseInt(t.replace(/\D/g, ''), 10);
                  setTerms({ ...terms, fee: Number.isFinite(n) ? n : 0 });
                }}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Prime performance (€)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(terms.performanceBonus)}
                onChangeText={(t) => {
                  const n = Number.parseInt(t.replace(/\D/g, ''), 10);
                  if (Number.isFinite(n)) setTerms({ ...terms, performanceBonus: n });
                }}
              />
            </View>

            {preview ? (
              <View
                style={[
                  styles.preview,
                  preview.accepted ? styles.previewOk : styles.previewKo,
                ]}>
                <Text style={styles.previewScore}>Probabilité club : {preview.satisfactionScore}/100</Text>
                <Text style={styles.previewText}>{preview.feedback}</Text>
              </View>
            ) : null}

            {feedback ? <Text style={styles.error}>{feedback}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, loading && styles.submitDisabled]}
              onPress={() => void handleSubmit()}
              disabled={loading}>
              <Text style={styles.submitText}>
                {loading ? 'Négociation…' : 'Envoyer au club'}
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
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  originalLine: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  row: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  roleValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  preview: {
    borderRadius: 10,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  previewOk: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  previewKo: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  previewScore: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
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
  cancelText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});

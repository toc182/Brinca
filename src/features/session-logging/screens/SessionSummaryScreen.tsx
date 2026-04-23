import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { getAccoladeById } from '@/shared/gamification/accolade-catalog';
import { getLevelProgress } from '@/shared/gamification/level-thresholds';
import { useActiveChildStore } from '@/stores/active-child.store';
import { RewardBreakdown } from '../components/summary/RewardBreakdown';
import { AccoladeUnlockDisplay } from '../components/summary/AccoladeUnlock';
import { getDrillResultsWithDrillNames } from '../repositories/drill-result.repository';
import { getSessionById } from '../repositories/session.repository';
import { getCompletedSessionCount } from '../repositories/session.repository';
import { getBonusPresets } from '@/features/activity-builder/repositories/bonus-preset.repository';
import { useAddBonusMutation } from '../mutations/useAddBonusMutation';

export function SessionSummaryScreen() {
  const router = useRouter();
  const childId = useActiveChildStore((s) => s.childId);
  const { sessionId, durationSeconds, tierResults, newAccolades } = useLocalSearchParams<{
    sessionId: string;
    durationSeconds: string;
    tierResults: string;
    newAccolades: string;
  }>();

  const duration = parseInt(durationSeconds ?? '0', 10);
  const tiers = JSON.parse(tierResults ?? '[]') as { tierName: string; currencyAmount: number; source: string }[];
  const accoladeIds = JSON.parse(newAccolades ?? '[]') as string[];

  const totalEarned = tiers.reduce((sum, t) => sum + t.currencyAmount, 0);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  // Bonus state
  const [showBonusSheet, setShowBonusSheet] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const addBonus = useAddBonusMutation();

  // Drills logged
  const { data: drillResults } = useQuery({
    queryKey: ['drill-results-with-names', sessionId],
    queryFn: () => getDrillResultsWithDrillNames(sessionId!),
    enabled: !!sessionId,
  });

  // Session -> activityId for bonus presets
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSessionById(sessionId!),
    enabled: !!sessionId,
  });

  const { data: bonusPresets } = useQuery({
    queryKey: ['bonus-presets', 'activity', session?.activity_id],
    queryFn: () => getBonusPresets('activity', session!.activity_id),
    enabled: !!session?.activity_id,
  });

  // Level progress
  const { data: sessionCount } = useQuery({
    queryKey: ['session-count', childId],
    queryFn: () => getCompletedSessionCount(childId!),
    enabled: !!childId,
  });

  const levelInfo = sessionCount != null ? getLevelProgress(sessionCount) : null;

  const handleAddBonus = () => {
    const amount = parseInt(bonusAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number.');
      return;
    }
    if (!childId || !sessionId) return;

    addBonus.mutate(
      { childId, amount, reason: bonusReason.trim() || 'Bonus', sessionId },
      {
        onSuccess: () => {
          setBonusAmount('');
          setBonusReason('');
          setShowBonusSheet(false);
        },
      }
    );
  };

  return (
    <Screen>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Session complete!</Text>
        <Text style={styles.duration}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>

        {/* Drills logged */}
        {drillResults && drillResults.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Drills logged</Text>
            {drillResults.map((dr) => (
              <View key={dr.id} style={styles.drillRow}>
                <View style={[styles.drillIndicator, !!dr.is_complete && styles.drillIndicatorComplete]} />
                <Text style={styles.drillName}>{dr.drill_name}</Text>
                <Text style={styles.drillStatus}>
                  {dr.is_complete ? 'Complete' : 'Incomplete'}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Rewards */}
        {totalEarned > 0 && (
          <Card style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Earned</Text>
            <Text style={styles.earningsAmount}>+{totalEarned}</Text>
            <RewardBreakdown tiers={tiers} />
          </Card>
        )}

        {/* Add bonus button */}
        <Button
          title="+ Add bonus"
          onPress={() => setShowBonusSheet(true)}
          style={styles.bonusButton}
        />

        {/* Level progress */}
        {levelInfo && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Level {levelInfo.level}</Text>
            <ProgressBar progress={levelInfo.progress} style={styles.progressBar} />
            <Text style={styles.levelHint}>
              {levelInfo.sessionsToNext} session{levelInfo.sessionsToNext === 1 ? '' : 's'} to next level
            </Text>
          </Card>
        )}

        {/* Accolades */}
        {accoladeIds.length > 0 && (
          <View style={styles.accoladesSection}>
            <Text style={styles.sectionTitle}>New accolades!</Text>
            {accoladeIds.map((id) => {
              const accolade = getAccoladeById(id);
              if (!accolade) return null;
              return <AccoladeUnlockDisplay key={id} accolade={accolade} />;
            })}
          </View>
        )}

        <Button
          title="Done"
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.doneButton}
        />
      </ScrollView>

      {/* Bonus bottom sheet */}
      {showBonusSheet && (
        <BottomSheet snapPoints={['50%']} onDismiss={() => setShowBonusSheet(false)}>
          <View style={styles.bonusSheet}>
            <Text style={styles.bonusSheetTitle}>Add bonus</Text>

            {/* Preset amounts */}
            {bonusPresets && bonusPresets.length > 0 && (
              <View style={styles.presetsRow}>
                {bonusPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    title={`+${preset.amount}`}
                    onPress={() => setBonusAmount(String(preset.amount))}
                    style={styles.presetButton}
                  />
                ))}
              </View>
            )}

            <TextInput
              style={styles.bonusInput}
              value={bonusAmount}
              onChangeText={setBonusAmount}
              placeholder="Amount"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.bonusInput}
              value={bonusReason}
              onChangeText={setBonusReason}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.textPlaceholder}
            />
            <Button
              title="Add bonus"
              onPress={handleAddBonus}
              disabled={addBonus.isPending}
            />
          </View>
        </BottomSheet>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: { padding: spacing.lg, alignItems: 'center', paddingBottom: spacing.xxxl },
  title: { ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.sm },
  duration: { ...typography.timer, color: colors.textSecondary, marginBottom: spacing.lg },
  section: { width: '100%', marginBottom: spacing.md },
  sectionTitle: { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  drillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  drillIndicator: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
  },
  drillIndicatorComplete: {
    backgroundColor: colors.success500,
    borderColor: colors.success500,
  },
  drillName: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
  drillStatus: { ...typography.caption, color: colors.textSecondary },
  earningsCard: { width: '100%', alignItems: 'center', marginBottom: spacing.md },
  earningsLabel: { ...typography.caption, color: colors.textSecondary },
  earningsAmount: { ...typography.counter, color: colors.primary500, marginVertical: spacing.xs },
  bonusButton: { marginBottom: spacing.md },
  progressBar: { marginVertical: spacing.sm },
  levelHint: { ...typography.caption, color: colors.textSecondary },
  accoladesSection: { width: '100%', marginBottom: spacing.lg },
  doneButton: { minWidth: 200, marginTop: spacing.lg },
  bonusSheet: { padding: spacing.md, gap: spacing.md },
  bonusSheetTitle: { ...typography.titleMedium, color: colors.textPrimary },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetButton: { flex: 1 },
  bonusInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});

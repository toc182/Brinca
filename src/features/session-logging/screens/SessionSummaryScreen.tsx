import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { colors, typography, spacing } from '@/shared/theme';
import { getAccoladeById } from '@/shared/gamification/accolade-catalog';
import { RewardBreakdown } from '../components/summary/RewardBreakdown';
import { AccoladeUnlockDisplay } from '../components/summary/AccoladeUnlock';

export function SessionSummaryScreen() {
  const router = useRouter();
  const { durationSeconds, tierResults, newAccolades } = useLocalSearchParams<{
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Session complete!</Text>
      <Text style={styles.duration}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </Text>

      {totalEarned > 0 && (
        <Card style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Earned</Text>
          <Text style={styles.earningsAmount}>+{totalEarned}</Text>
          <RewardBreakdown tiers={tiers} />
        </Card>
      )}

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, alignItems: 'center', paddingBottom: spacing.xxxl },
  title: { ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.sm },
  duration: { ...typography.timer, color: colors.textSecondary, marginBottom: spacing.lg },
  earningsCard: { width: '100%', alignItems: 'center', marginBottom: spacing.lg },
  earningsLabel: { ...typography.caption, color: colors.textSecondary },
  earningsAmount: { ...typography.counter, color: colors.primary500, marginVertical: spacing.xs },
  accoladesSection: { width: '100%', marginBottom: spacing.lg },
  sectionTitle: { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  doneButton: { minWidth: 200, marginTop: spacing.lg },
});

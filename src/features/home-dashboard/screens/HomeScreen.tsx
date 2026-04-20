import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { colors, typography, spacing } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { calculateStreak } from '@/shared/gamification/streak-calculator';
import { useDashboardQuery } from '../queries/useDashboardQuery';
import { LevelBadge } from '../components/LevelBadge';
import { RewardProgress } from '../components/RewardProgress';
import { CurrencyBalance } from '../components/CurrencyBalance';
import { ConsistencyMetrics } from '../components/ConsistencyMetrics';
import { RecentSessions } from '../components/RecentSessions';
import { AccoladeRow } from '../components/AccoladeRow';

export function HomeScreen() {
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const { data, isLoading } = useDashboardQuery(childId);

  if (isLoading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const streak = calculateStreak(data.sessionDates);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.childName}>{childName}</Text>

      <Card style={styles.section}>
        <LevelBadge sessionCount={data.totalSessions} />
      </Card>

      <Card style={styles.section}>
        <CurrencyBalance balance={data.balance} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Reward goal</Text>
        <RewardProgress reward={data.closestReward} balance={data.balance} />
      </Card>

      <ConsistencyMetrics
        sessionsThisWeek={data.sessionsThisWeek}
        totalSessions={data.totalSessions}
        streak={streak}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent sessions</Text>
        <RecentSessions sessions={data.recentSessions} />
      </View>

      {data.accolades.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accolades</Text>
          <AccoladeRow accoladeIds={data.accolades.map((a) => a.accolade_id)} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  childName: { ...typography.titleLarge, color: colors.textPrimary },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.xxs },
});

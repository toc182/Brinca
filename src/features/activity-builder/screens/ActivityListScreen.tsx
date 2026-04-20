import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { colors, typography, spacing, shadows, radii } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActivitiesQuery } from '../queries/useActivitiesQuery';

export function ActivityListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const childId = useActiveChildStore((s) => s.childId);
  const { data: activities, isLoading } = useActivitiesQuery(childId);

  if (!activities?.length && !isLoading) {
    return (
      <EmptyState
        title="No activities yet"
        body={t('empty.noActivities')}
        ctaLabel="Add activity"
        onCtaPress={() => router.push('/(settings)/activities/create' as never)}
        style={styles.empty}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(settings)/activities/${item.id}` as never)}
            style={styles.row}
          >
            <View style={styles.rowContent}>
              <Text style={styles.activityName}>{item.name}</Text>
              <Text style={styles.activityCategory}>
                {item.category ?? 'Uncategorized'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <Button
          title="Add activity"
          onPress={() => router.push('/(settings)/activities/create' as never)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1 },
  list: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  rowContent: { flex: 1 },
  activityName: { ...typography.titleSmall, color: colors.textPrimary },
  activityCategory: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  chevron: { ...typography.titleMedium, color: colors.textSecondary },
  footer: { padding: spacing.md },
});

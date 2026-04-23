import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { colors, typography, spacing, shadows, radii } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { updateActivity } from '../repositories/activity.repository';
import { activityBuilderKeys } from '../queries/keys';
import { useActivitiesQuery } from '../queries/useActivitiesQuery';

export function ActivityListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const childId = useActiveChildStore((s) => s.childId);
  const { data: activities, isLoading, isError, refetch } = useActivitiesQuery(childId);

  const handleReactivate = async (id: string) => {
    await updateActivity(id, { is_active: true });
    queryClient.invalidateQueries({ queryKey: activityBuilderKeys.activities(childId ?? '') });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <OfflineBanner />
        <View style={styles.list}>
          <SkeletonPlaceholder>
            <View style={styles.skeletonRow} />
            <View style={styles.skeletonRow} />
            <View style={styles.skeletonRow} />
          </SkeletonPlaceholder>
        </View>
      </View>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (!activities?.length) {
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
      <OfflineBanner />
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(settings)/activities/${item.id}` as never)}
            style={[styles.row, item.is_active === 0 && styles.rowDimmed]}
          >
            <Text style={styles.activityIcon}>{item.icon ?? '📋'}</Text>
            <View style={styles.rowContent}>
              <View style={styles.nameRow}>
                <Text style={styles.activityName}>{item.name}</Text>
                {item.is_active === 0 && (
                  <View style={styles.deactivatedBadge}>
                    <Text style={styles.deactivatedBadgeText}>Deactivated</Text>
                  </View>
                )}
              </View>
              <Text style={styles.activityCategory}>
                {item.category ?? 'Uncategorized'}
              </Text>
            </View>
            {item.is_active === 0 ? (
              <Pressable
                onPress={() => handleReactivate(item.id)}
                style={styles.reactivateButton}
              >
                <Text style={styles.reactivateText}>Reactivate</Text>
              </Pressable>
            ) : (
              <Text style={styles.chevron}>›</Text>
            )}
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
  skeletonRow: {
    height: 64,
    width: '100%',
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  rowDimmed: { opacity: 0.5 },
  activityIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  rowContent: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activityName: { ...typography.titleSmall, color: colors.textPrimary },
  deactivatedBadge: {
    backgroundColor: colors.error500,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  deactivatedBadgeText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontSize: 10,
  },
  activityCategory: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  chevron: { ...typography.titleMedium, color: colors.textSecondary },
  reactivateButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary500,
  },
  reactivateText: {
    ...typography.caption,
    color: colors.primary500,
  },
  footer: { padding: spacing.md },
});

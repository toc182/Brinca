import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { EmptyState } from '@/shared/components/EmptyState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { ParentAvatar } from '@/shared/components/ParentAvatar';
import { CollapsibleHeader, useCollapsibleHeaderHeight } from '@/shared/components/CollapsibleHeader';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { colors, spacing, typography } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';

import { useActiveSession } from '../hooks/useActiveSession';
import { useActivitiesQuery } from '../queries/useActivitiesQuery';
import { useStartSessionMutation } from '../mutations/useStartSessionMutation';
import { ActivityPickerSheet } from '../components/ActivityPickerSheet';

export function ActivityScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const { isActive } = useActiveSession();
  const { data: activities, isPending, refetch } = useActivitiesQuery(childId);
  const startSession = useStartSessionMutation();
  const [showSheet, setShowSheet] = useState(true);
  const [sheetKey, setSheetKey] = useState(0);

  // When the tab gains focus: navigate straight to session if one is active,
  // otherwise ensure the sheet is visible and data is fresh.
  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        router.push('/(modals)/session' as never);
      } else {
        setShowSheet(true);
        setSheetKey((k) => k + 1);
      }
      refetch();
    }, [isActive, router, refetch])
  );

  const handleSelectActivity = useCallback(
    (activity: { id: string; name: string; icon: string | null }) => {
      if (!childId) return;
      startSession.mutate(
        { childId, activityId: activity.id, activityName: activity.name },
        {
          onSuccess: () => {
            setShowSheet(false);
            router.push('/(modals)/session' as never);
          },
        }
      );
    },
    [childId, startSession, router]
  );

  const handleDismiss = useCallback(() => {
    setShowSheet(false);
  }, []);

  return (
    <View style={styles.container}>
      <CollapsibleHeader title={childName ?? 'Activity'} scrollY={scrollY} rightContent={<ParentAvatar />} />
      {showSheet && !isActive && (
        <BottomSheet key={sheetKey} snapPoints={['50%']} onDismiss={handleDismiss}>
          {isPending ? (
            <ActivityListSkeleton />
          ) : !activities?.length ? (
            <EmptyState
              title="No activities yet"
              body="Add your first activity in Settings."
              ctaLabel="Go to Settings"
              onCtaPress={() => {
                setShowSheet(false);
                router.push('/(settings)' as never);
              }}
            />
          ) : (
            <View style={styles.sheetContent}>
              <Text style={styles.sheetTitle}>Select an activity</Text>
              <ActivityPickerSheet
                activities={activities}
                onSelect={handleSelectActivity}
              />
            </View>
          )}
        </BottomSheet>
      )}
    </View>
  );
}

function ActivityListSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonPlaceholder>
        <View style={styles.skeletonTitle} />
      </SkeletonPlaceholder>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonPlaceholder key={i} style={styles.skeletonRow}>
          <View style={styles.skeletonRowInner} />
        </SkeletonPlaceholder>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sheetContent: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonTitle: {
    height: 24,
    width: '50%',
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  skeletonRow: {
    borderRadius: 8,
  },
  skeletonRowInner: {
    height: 48,
    borderRadius: 8,
  },
});

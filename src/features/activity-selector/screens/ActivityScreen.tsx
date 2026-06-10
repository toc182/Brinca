// No <Screen> wrapper: CollapsibleHeader handles top inset, NativeTabs handles bottom.
import { useCallback, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSharedValue } from 'react-native-reanimated';

import { EmptyState } from '@/shared/components/EmptyState';
import { ParentAvatar } from '@/shared/components/ParentAvatar';
import { CollapsibleHeader, useCollapsibleHeaderHeight } from '@/shared/components/CollapsibleHeader';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { colors, radii, spacing } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSessionStore } from '@/stores/active-session.store';

import { ActivityGrid } from '../components/ActivityGrid';
import { useActivitiesQuery, type ActivityWithRecency } from '../queries/useActivitiesQuery';
import { useStartSessionMutation } from '../mutations/useStartSessionMutation';

export function ActivityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scrollY = useSharedValue(0);
  const headerHeight = useCollapsibleHeaderHeight();
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const { data: activities, isPending, refetch } = useActivitiesQuery(childId);
  const startSession = useStartSessionMutation();
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  // Auto-resume only when the session is in foreground state. If the user
  // explicitly minimized (status === 'minimized'), respect that — the mini
  // player bar is the resume affordance from this point on.
  // Read status at the moment of focus, not from a captured closure — the
  // closure value would be stale right after minimize, causing a focus loop.
  useFocusEffect(
    useCallback(() => {
      const currentStatus = useActiveSessionStore.getState().status;
      if (currentStatus === 'active') {
        router.push('/(modals)/session' as never);
      }
      refetchRef.current();
    }, [router])
  );

  const handleSelectActivity = useCallback(
    (activity: ActivityWithRecency) => {
      if (!childId) return;

      // Active session guard — mirrors useChildSwitchGuard, but offers a
      // Resume path back into the running session instead of just blocking.
      // Auto-focus already routes when status === 'active', so this fires
      // in practice when the user minimized and is now on the activity grid.
      const { status } = useActiveSessionStore.getState();
      if (status !== 'idle' && status !== 'complete') {
        Alert.alert(
          t('alert.sessionInProgressTitle'),
          t('alert.sessionInProgressStartNewMessage'),
          [
            { text: t('cta.cancel'), style: 'cancel' },
            {
              text: t('cta.resume'),
              onPress: () => {
                useActiveSessionStore.getState().setStatus('active');
                router.push('/(modals)/session' as never);
              },
            },
          ],
        );
        return;
      }

      startSession.mutate(
        { childId, activityId: activity.id, activityName: activity.name },
        {
          onSuccess: () => {
            router.push('/(modals)/session' as never);
          },
        },
      );
    },
    [childId, startSession, router, t],
  );

  return (
    <View style={styles.container}>
      <CollapsibleHeader title={childName ?? 'Activity'} scrollY={scrollY} rightContent={<ParentAvatar />} />
      {isPending ? (
        <ActivityGridSkeleton topInset={headerHeight} />
      ) : !activities?.length ? (
        <View style={[styles.centered, { paddingTop: headerHeight }]}>
          <EmptyState
            title="Let's set up your first activity"
            body="Add activities in Settings to start tracking sessions."
          />
        </View>
      ) : (
        <ActivityGrid
          activities={activities}
          onSelectActivity={handleSelectActivity}
          contentTopInset={headerHeight}
        />
      )}
    </View>
  );
}

function ActivityGridSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={[styles.skeletonContainer, { paddingTop: topInset + spacing.md }]}>
      {Array.from({ length: 2 }).map((_, row) => (
        <View key={row} style={styles.skeletonRow}>
          {Array.from({ length: 2 }).map((_, col) => (
            <SkeletonPlaceholder key={col} style={styles.skeletonTile}>
              <View style={styles.skeletonTileInner} />
            </SkeletonPlaceholder>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skeletonTile: {
    flex: 1,
    borderRadius: radii.md,
  },
  skeletonTileInner: {
    height: 96,
    borderRadius: radii.md,
  },
});

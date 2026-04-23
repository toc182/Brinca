import { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useQuery } from '@tanstack/react-query';
import { GlobeSimple } from 'phosphor-react-native';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { useChildSwitchGuard } from '@/shared/hooks/useChildSwitchGuard';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { ParentAvatar } from '@/shared/components/ParentAvatar';
import { CollapsibleHeader, useCollapsibleHeaderHeight } from '@/shared/components/CollapsibleHeader';
import { colors, typography, spacing, radii } from '@/shared/theme';

import { ChildHeader } from '../components/ChildHeader';
import { ChildSwitcherSheet } from '../components/ChildSwitcherSheet';
import { BasicInfo } from '../components/BasicInfo';
import { MeasurementsSummary } from '../components/MeasurementsSummary';
import { PhotosSection } from '../components/PhotosSection';
import { useProfileQuery, type ActivityItem } from '../queries/useProfileQuery';
import { profileKeys } from '../queries/keys';
import { getChildrenByFamily } from '../repositories/profile.repository';

function ProfileSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonPlaceholder>
        <View style={styles.skeletonAvatar} />
      </SkeletonPlaceholder>
      <SkeletonPlaceholder>
        <View style={styles.skeletonName} />
      </SkeletonPlaceholder>
      <SkeletonPlaceholder style={styles.skeletonCard}>
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLineShort} />
      </SkeletonPlaceholder>
      <SkeletonPlaceholder style={styles.skeletonCard}>
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLineShort} />
      </SkeletonPlaceholder>
      <SkeletonPlaceholder style={styles.skeletonCard}>
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLine} />
      </SkeletonPlaceholder>
    </View>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  if (activity.type === 'app') {
    return (
      <View style={styles.activityRow}>
        {activity.icon ? (
          <Text style={styles.activityIcon}>{activity.icon}</Text>
        ) : null}
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text style={styles.activityContext}>
            {activity.sessionCount
              ? `${activity.sessionCount} session${activity.sessionCount !== 1 ? 's' : ''}`
              : 'No sessions yet'}
            {activity.lastSessionDate
              ? ` · Last: ${activity.lastSessionDate}`
              : ''}
          </Text>
        </View>
        {activity.category ? (
          <Text style={styles.activityCategory}>{activity.category}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.activityRow}>
      <GlobeSimple size={20} color={colors.textSecondary} />
      <View style={styles.activityInfo}>
        <Text style={styles.activityName}>{activity.name}</Text>
        <Text style={styles.activityContext}>
          {[activity.schedule, activity.location].filter(Boolean).join(' · ') || 'External activity'}
        </Text>
      </View>
      <Text style={styles.externalBadge}>External</Text>
    </View>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const scrollY = useSharedValue(0);
  const headerHeight = useCollapsibleHeaderHeight();
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const familyId = useActiveChildStore((s) => s.familyId);
  const { trySetActiveChild } = useChildSwitchGuard();
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);

  const { data: profile, isLoading, isError, refetch } = useProfileQuery(childId);

  const { data: childrenList = [] } = useQuery({
    queryKey: profileKeys.children(familyId ?? ''),
    queryFn: () => getChildrenByFamily(familyId!),
    enabled: !!familyId,
  });

  const handleOpenSwitcher = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  const handleSelectChild = useCallback(
    (child: { id: string; name: string; dateOfBirth: string | null; avatarUrl: string | null }) => {
      if (child.id === childId) {
        sheetRef.current?.close();
        return;
      }
      if (familyId) {
        trySetActiveChild(child.id, child.name, familyId);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    },
    [familyId, childId, trySetActiveChild]
  );

  const handleAddChild = useCallback(() => {
    router.push('/(settings)');
  }, [router]);

  const handleGoToAccountsCenter = useCallback(() => {
    sheetRef.current?.close();
    router.push('/(settings)/accounts-center');
  }, [router]);

  const handleMeasurementPress = useCallback(() => {
    router.push('/(settings)/child/measurements');
  }, [router]);

  if (!childId || !childName) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No child selected</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.wrapper}>
        <CollapsibleHeader title={childName ?? 'Profile'} scrollY={scrollY} rightContent={<ParentAvatar />} />
        <Animated.ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
          <ErrorState onRetry={() => refetch()} />
        </Animated.ScrollView>
      </View>
    );
  }

  if (isLoading || !profile) {
    return (
      <View style={styles.wrapper}>
        <CollapsibleHeader title={childName ?? 'Profile'} scrollY={scrollY} rightContent={<ParentAvatar />} />
        <Animated.ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
          <ProfileSkeleton />
        </Animated.ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <CollapsibleHeader title={childName ?? 'Profile'} scrollY={scrollY} rightContent={<ParentAvatar />} />
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <OfflineBanner />
        <ChildHeader
          name={profile.child?.name ?? childName}
          avatarUrl={profile.child?.avatarUrl ?? null}
          onPress={handleOpenSwitcher}
        />

        <BasicInfo
          dateOfBirth={profile.child?.dateOfBirth ?? null}
          gender={profile.child?.gender ?? null}
          country={profile.child?.country ?? null}
          gradeLevel={profile.child?.gradeLevel ?? null}
        />

        <MeasurementsSummary
          latestWeight={profile.latestWeight}
          latestHeight={profile.latestHeight}
          measurementUnit={measurementUnit}
          onPress={handleMeasurementPress}
        />

        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Activities</Text>
          {profile.activities.length > 0 ? (
            profile.activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))
          ) : (
            <Text style={styles.activitiesEmpty}>No activities yet.</Text>
          )}
        </View>

        <PhotosSection />
      </Animated.ScrollView>

      <ChildSwitcherSheet
        sheetRef={sheetRef}
        children={childrenList.map((c) => ({
          id: c.id,
          name: c.name,
          avatarUrl: c.avatar_url,
          dateOfBirth: c.date_of_birth,
        }))}
        activeChildId={childId}
        onSelectChild={handleSelectChild}
        onAddChild={handleAddChild}
        onGoToAccountsCenter={handleGoToAccountsCenter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  // Skeleton styles
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
  },
  skeletonName: {
    height: 24,
    width: 140,
    borderRadius: radii.sm,
  },
  skeletonCard: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radii.md,
  },
  skeletonLine: {
    height: 16,
    width: '100%',
    borderRadius: radii.sm,
  },
  skeletonLineShort: {
    height: 16,
    width: '60%',
    borderRadius: radii.sm,
  },
  // Activities section
  activitiesSection: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
    gap: spacing.xxxs,
  },
  activityName: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
  },
  activityContext: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  activityCategory: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  externalBadge: {
    ...typography.captionSmall,
    color: colors.secondary500,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxxs,
    borderRadius: radii.xs,
    backgroundColor: colors.secondary50,
    overflow: 'hidden',
  },
  activitiesEmpty: {
    ...typography.bodySmall,
    color: colors.textPlaceholder,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
});

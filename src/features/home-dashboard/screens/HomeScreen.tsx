import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

import { Card } from '@/shared/components/Card';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { ParentAvatar } from '@/shared/components/ParentAvatar';
import { CollapsibleHeader, useCollapsibleHeaderHeight } from '@/shared/components/CollapsibleHeader';
import { Button } from '@/shared/components/Button';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useDashboardQuery } from '../queries/useDashboardQuery';
import { LevelBadge } from '../components/LevelBadge';
import { RewardProgress } from '../components/RewardProgress';
import { CurrencyBalance } from '../components/CurrencyBalance';
import { ConsistencyMetrics } from '../components/ConsistencyMetrics';
import { RecentSessions } from '../components/RecentSessions';
import { AccoladeRow } from '../components/AccoladeRow';

export function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<Animated.ScrollView>(null);
  useScrollToTop(scrollRef);
  const scrollY = useSharedValue(0);
  const headerHeight = useCollapsibleHeaderHeight();
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const { data, isLoading, isError, refetch } = useDashboardQuery(childId);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <CollapsibleHeader title={childName ?? 'Home'} scrollY={scrollY} rightContent={<ParentAvatar />} />
        <HomeSkeleton headerHeight={headerHeight} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.container}>
        <CollapsibleHeader title={childName ?? 'Home'} scrollY={scrollY} rightContent={<ParentAvatar />} />
        <Animated.ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        >
          <ErrorState onRetry={() => { void refetch(); }} />
        </Animated.ScrollView>
      </View>
    );
  }

  const showAccolades = data.hasAnySession && data.accolades.length > 0;
  const noAccoladesYet = data.hasAnySession && data.accolades.length === 0;

  return (
    <View style={styles.container}>
      <CollapsibleHeader title={childName ?? 'Home'} scrollY={scrollY} rightContent={<ParentAvatar />} />
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <OfflineBanner />

        <Card style={styles.section}>
          <LevelBadge sessionCount={data.totalSessions} />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Reward goal</Text>
          <RewardProgress
            reward={data.closestReward}
            balance={data.balance}
            onAddReward={undefined}
          />
        </Card>

        <Card style={styles.section}>
          <CurrencyBalance balance={data.balance} />
        </Card>

        <ConsistencyMetrics
          sessionsThisWeek={data.sessionsThisWeek}
          totalSessions={data.totalSessions}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent sessions</Text>
          <RecentSessions sessions={data.recentSessions} />
        </View>

        {showAccolades && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accolades</Text>
            <AccoladeRow accoladeIds={data.accolades.map((a) => a.accolade_id)} />
          </View>
        )}

        {noAccoladesYet && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accolades</Text>
            <Text style={styles.emptyText}>
              Keep practicing — accolades appear as you hit milestones!
            </Text>
          </View>
        )}

        {!data.hasAnySession && (
          <Card style={styles.section}>
            <Text style={styles.emptyText}>
              No drills yet. Add your first drill to start practicing.
            </Text>
            <Button
              title="Add drill"
              onPress={() => router.push('/(settings)/activities' as never)}
              variant="primary"
              size="small"
              style={styles.ctaButton}
            />
          </Card>
        )}
      </Animated.ScrollView>
    </View>
  );
}

function HomeSkeleton({ headerHeight }: { headerHeight: number }) {
  return (
    <Animated.ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
      <SkeletonPlaceholder>
        <View style={{ height: 72, borderRadius: radii.md, marginBottom: spacing.md }} />
        <View style={{ height: 72, borderRadius: radii.md, marginBottom: spacing.md }} />
        <View style={{ height: 56, borderRadius: radii.md, marginBottom: spacing.md }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <View style={{ flex: 1, height: 64, borderRadius: radii.md }} />
          <View style={{ flex: 1, height: 64, borderRadius: radii.md }} />
        </View>
        <View style={{ height: 56, borderRadius: radii.md, marginBottom: spacing.xs }} />
        <View style={{ height: 56, borderRadius: radii.md }} />
      </SkeletonPlaceholder>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.xxs },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  ctaButton: { alignSelf: 'flex-start', marginTop: spacing.xs },
});

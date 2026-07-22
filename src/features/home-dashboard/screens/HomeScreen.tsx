// No <Screen> wrapper: CollapsibleHeader handles top inset, NativeTabs handles bottom.
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

import { Card } from '@/shared/components/Card';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { ParentAvatar } from '@/shared/components/ParentAvatar';
import { APP_VERSION_LABEL } from '@/shared/appVersion';
import { CollapsibleHeader, useCollapsibleHeaderHeight } from '@/shared/components/CollapsibleHeader';
import { Button } from '@/shared/components/Button';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { useDashboardQuery } from '../queries/useDashboardQuery';
import { ActivityCalendar } from '../components/ActivityCalendar';
import { RecentSessions } from '../components/RecentSessions';

// Small version label + parent avatar for the header right slot. The version lets
// the user confirm which OTA bundle is live (see src/shared/appVersion.ts).
function HeaderRight() {
  return (
    <View style={styles.headerRight}>
      <Text style={styles.versionLabel}>{APP_VERSION_LABEL}</Text>
      <ParentAvatar />
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<Animated.ScrollView>(null);
  useScrollToTop(scrollRef);
  const scrollY = useSharedValue(0);
  const headerHeight = useCollapsibleHeaderHeight();
  const insets = useSafeAreaInsets();
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const currencyName = useUIPreferencesStore((s) => s.currencyName);
  const { data, isLoading, isError, refetch } = useDashboardQuery(childId);

  // NativeTabs (UITabBarController) inflates the bottom safe area to include
  // the tab bar height, so this clears the bar even when minimizeBehavior
  // collapses it on scroll down.
  const scrollPaddingBottom = insets.bottom + spacing.md;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <CollapsibleHeader title={childName ?? 'Home'} scrollY={scrollY} rightContent={<HeaderRight />} />
        <HomeSkeleton headerHeight={headerHeight} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.container}>
        <CollapsibleHeader title={childName ?? 'Home'} scrollY={scrollY} rightContent={<HeaderRight />} />
        <Animated.ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.md, paddingBottom: scrollPaddingBottom }]}
        >
          <ErrorState onRetry={() => { void refetch(); }} />
        </Animated.ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CollapsibleHeader title={childName ?? 'Home'} scrollY={scrollY} rightContent={<HeaderRight />} />
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.md, paddingBottom: scrollPaddingBottom }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <OfflineBanner />

        <View style={styles.coinsRow}>
          <View style={styles.coin} />
          <Text style={styles.coinsAmount}>{data.balance}</Text>
          <Text style={styles.coinsLabel}>{currencyName} earned</Text>
        </View>

        <ActivityCalendar sessions={data.calendarSessions} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent sessions</Text>
          <RecentSessions sessions={data.recentSessions} />
        </View>

        {!data.hasAnySession && (
          <Card style={styles.section}>
            {data.hasDrills ? (
              <>
                <Text style={styles.emptyText}>
                  No sessions yet. Start practicing and the days will fill in above.
                </Text>
                <Button
                  title="Start a session"
                  onPress={() => router.push('/(tabs)/activity' as never)}
                  variant="primary"
                  size="small"
                  style={styles.ctaButton}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </Card>
        )}
      </Animated.ScrollView>
    </View>
  );
}

function HomeSkeleton({ headerHeight }: { headerHeight: number }) {
  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.md }]}
    >
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
  coinsRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, paddingHorizontal: spacing.xxs },
  coin: {
    width: 18,
    height: 18,
    borderRadius: radii.full,
    backgroundColor: '#FFD23F',
    borderWidth: 2,
    borderColor: '#E6B800',
    alignSelf: 'center',
  },
  coinsAmount: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: colors.textPrimary },
  coinsLabel: { ...typography.bodySmall, color: colors.textSecondary },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.xxs },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  ctaButton: { alignSelf: 'flex-start', marginTop: spacing.xs },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  versionLabel: { ...typography.captionSmall, color: colors.textPlaceholder },
});

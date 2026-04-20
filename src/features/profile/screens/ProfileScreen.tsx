import { useCallback, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useQuery } from '@tanstack/react-query';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { colors, typography, spacing } from '@/shared/theme';

import { ChildHeader } from '../components/ChildHeader';
import { ChildSwitcherSheet } from '../components/ChildSwitcherSheet';
import { BasicInfo } from '../components/BasicInfo';
import { MeasurementsSummary } from '../components/MeasurementsSummary';
import { useProfileQuery } from '../queries/useProfileQuery';
import { profileKeys } from '../queries/keys';
import { getChildrenByFamily } from '../repositories/profile.repository';

export function ProfileScreen() {
  const router = useRouter();
  const sheetRef = useRef<BottomSheetMethods>(null);

  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const familyId = useActiveChildStore((s) => s.familyId);
  const setActiveChild = useActiveChildStore((s) => s.setActiveChild);
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);

  const { data: profile, isLoading } = useProfileQuery(childId);

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
      if (familyId) {
        setActiveChild(child.id, child.name, familyId);
      }
    },
    [familyId, setActiveChild]
  );

  const handleAddChild = useCallback(() => {
    // Navigate to onboarding child creation flow
  }, []);

  if (!childId || !childName) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No child selected</Text>
      </View>
    );
  }

  if (isLoading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
        />

        {profile.activities.length > 0 ? (
          <View style={styles.activitiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Activities</Text>
              <Pressable
                onPress={() => router.push('/(settings)/activities')}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {profile.activities.map((activity) => (
              <View key={activity.id} style={styles.activityRow}>
                {activity.icon ? (
                  <Text style={styles.activityIcon}>{activity.icon}</Text>
                ) : null}
                <Text style={styles.activityName}>{activity.name}</Text>
                {activity.category ? (
                  <Text style={styles.activityCategory}>{activity.category}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  activitiesSection: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary500,
  },
  pressed: {
    opacity: 0.7,
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
  activityName: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
    flex: 1,
  },
  activityCategory: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
});

import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'phosphor-react-native';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { signOut } from '@/lib/supabase/auth';
import { Avatar } from '@/shared/components/Avatar';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { MODAL_HEADER_CONTENT_BOTTOM, ModalHeader } from '@/shared/components/ModalHeader';
import { colors, typography, spacing, radii } from '@/shared/theme';

import { useProfileQuery as useChildProfileQuery } from '../queries/useProfileQuery';
import { useProfileQuery as useUserProfileQuery } from '@/features/accounts-center/hooks/useAccountsCenter';

function SettingsRow({
  label,
  onPress,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Text style={[styles.rowLabel, variant === 'destructive' && styles.rowLabelDestructive]}>
        {label}
      </Text>
      <Text style={styles.rowChevron}>{'>'}</Text>
    </Pressable>
  );
}

function RowSeparator() {
  return <View style={styles.separator} />;
}

const BUBBLE_TINTS = [colors.secondary50, colors.accent50, colors.primary50] as const;
// Row holds at most 5 squares including the New tile: show all activities
// when there are ≤4 (+ New); past that, show 3 + a "+N more" + New.
const FULL_LIMIT = 4;
const TRUNCATED_COUNT = 3;

export function SettingsScreen() {
  const router = useRouter();
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);
  const setMeasurementUnit = useUIPreferencesStore((s) => s.setMeasurementUnit);
  const { showDestructiveAlert } = useDestructiveAlert();

  const childProfileQuery = useChildProfileQuery(childId);
  const userProfileQuery = useUserProfileQuery();

  const childAvatar = childProfileQuery.data?.child?.avatarUrl ?? null;
  const childDisplayName = childName ?? childProfileQuery.data?.child?.name ?? 'Child';
  const userAvatar = userProfileQuery.data?.avatarUrl ?? null;
  const userName = userProfileQuery.data?.displayName ?? 'You';

  const appActivities = (childProfileQuery.data?.activities ?? []).filter((a) => a.type === 'app');
  const visibleActivities =
    appActivities.length > FULL_LIMIT ? appActivities.slice(0, TRUNCATED_COUNT) : appActivities;
  const overflowCount = appActivities.length - visibleActivities.length;

  const handleLogout = useCallback(() => {
    showDestructiveAlert({
      title: 'Log out',
      message:
        'Are you sure you want to log out? Any unsynced data will remain on your device.',
      destructiveLabel: 'Log out',
      onConfirm: async () => {
        await signOut();
        router.replace('/(auth)/login');
      },
    });
  }, [showDestructiveAlert, router]);

  const goAccountsCenter = useCallback(
    () => router.push('/(settings)/accounts-center'),
    [router],
  );
  const goEditChild = useCallback(
    () => router.push('/(settings)/child/edit-profile'),
    [router],
  );
  const goActivities = useCallback(
    () => router.push('/(settings)/activities'),
    [router],
  );
  const goMeasurements = useCallback(
    () => router.push('/(settings)/child/measurements'),
    [router],
  );
  const goExternalActivities = useCallback(
    () => router.push('/(settings)/child/external-activities'),
    [router],
  );

  return (
    <>
      <ModalHeader
        title="Settings"
        leftAction={{
          icon: 'close',
          onPress: () => router.back(),
          accessibilityLabel: 'Close',
        }}
      />
      <Screen edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.hubCard}>
            <View style={styles.hubHeader}>
              <View style={styles.hubHeaderInfo}>
                <Text style={styles.hubHeaderName}>{childDisplayName}</Text>
                <Text style={styles.hubHeaderSub}>Child</Text>
              </View>
              <Avatar imageUrl={childAvatar} name={childDisplayName} size="medium" />
            </View>
            <View style={styles.cardSeparator} />

            {/* Activities launchpad — the child's activities as tappable
                bubbles. At most 5 squares including New: show all activities
                when ≤4 (+ New), otherwise show 3 + a "+N more" + New. */}
            <View style={styles.lp}>
              <View style={styles.lpHeader}>
                <Text style={styles.lpLabel}>Activities</Text>
                <Pressable onPress={goActivities} hitSlop={spacing.sm}>
                  <Text style={styles.lpManage}>Manage all ›</Text>
                </Pressable>
              </View>
              <View style={styles.bubRow}>
                {visibleActivities.map((a, i) => (
                  <Pressable
                    key={a.id}
                    onPress={() => router.push(`/(settings)/activities/${a.id}` as never)}
                    style={styles.bub}
                  >
                    <View style={[styles.bubCircle, { backgroundColor: BUBBLE_TINTS[i % BUBBLE_TINTS.length] }]}>
                      <Text style={styles.bubEmoji}>{a.icon ?? '•'}</Text>
                    </View>
                    <Text style={styles.bubLabel} numberOfLines={1}>{a.name}</Text>
                  </Pressable>
                ))}
                {overflowCount > 0 && (
                  <Pressable onPress={goActivities} style={styles.bub}>
                    <View style={[styles.bubCircle, styles.bubMore]}>
                      <Text style={styles.bubMoreText}>+{overflowCount}</Text>
                    </View>
                    <Text style={styles.bubLabel}>More</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => router.push('/(settings)/activities/create' as never)}
                  style={styles.bub}
                >
                  <View style={styles.bubAdd}>
                    <Plus size={20} color={colors.primary500} weight="bold" />
                  </View>
                  <Text style={styles.bubLabel}>New</Text>
                </Pressable>
              </View>
            </View>

            <RowSeparator />
            <SettingsRow label="Edit Profile" onPress={goEditChild} />
            <RowSeparator />
            <SettingsRow label="Measurements" onPress={goMeasurements} />
            <RowSeparator />
            <SettingsRow label="External Activities" onPress={goExternalActivities} />
          </Card>

          <Card style={styles.hubCard}>
            <View style={styles.hubHeader}>
              <View style={styles.hubHeaderInfo}>
                <Text style={styles.hubHeaderName}>{userName}</Text>
                <Text style={styles.hubHeaderSub}>You</Text>
              </View>
              <Avatar imageUrl={userAvatar} name={userName} size="medium" />
            </View>
            <View style={styles.cardSeparator} />
            <SettingsRow label="Accounts Center" onPress={goAccountsCenter} />
          </Card>

          <Text style={styles.sectionHeader}>App</Text>
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.rowLabel}>Use imperial units</Text>
                <Text style={styles.toggleDescription}>
                  {measurementUnit === 'imperial' ? 'lbs, ft/in' : 'kg, cm'}
                </Text>
              </View>
              <Switch
                value={measurementUnit === 'imperial'}
                onValueChange={(useImperial) =>
                  setMeasurementUnit(useImperial ? 'imperial' : 'metric')
                }
                trackColor={{ false: colors.borderDefault, true: colors.primary100 }}
                thumbColor={
                  measurementUnit === 'imperial' ? colors.primary500 : colors.surface
                }
              />
            </View>
            <RowSeparator />
            <SettingsRow label="Help" onPress={() => {}} />
            <RowSeparator />
            <SettingsRow label="Privacy Policy" onPress={() => {}} />
            <RowSeparator />
            <SettingsRow label="About" onPress={() => {}} />
            <RowSeparator />
            <SettingsRow label="Log out" onPress={handleLogout} variant="destructive" />
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Match the Add drill canvas tint
    backgroundColor: colors.primary50,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xxxl,
  },

  // Activities launchpad
  lp: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  lpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  lpLabel: { ...typography.bodySmall, fontFamily: 'Lexend_500Medium', color: colors.primary700 },
  lpManage: { ...typography.caption, color: colors.primary500 },
  // Fixed row that divides the width evenly — up to 5 squares always fit, no scroll
  bubRow: { flexDirection: 'row', gap: spacing.xs },
  bub: { flex: 1, alignItems: 'center' },
  bubCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubEmoji: { fontSize: 22 },
  bubMore: { backgroundColor: colors.primary100 },
  bubMoreText: { ...typography.titleSmall, color: colors.primary700 },
  bubAdd: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary100,
    borderStyle: 'dashed',
  },
  bubLabel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },

  // Hub card (child + user)
  hubCard: {
    gap: 0,
    padding: 0,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  hubHeaderInfo: {
    flex: 1,
    gap: spacing.xxxs,
  },
  hubHeaderName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
  },
  hubHeaderSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
  },

  // App section
  sectionHeader: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.xxs,
    paddingHorizontal: spacing.xxs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  rowPressed: {
    backgroundColor: colors.primary50,
  },
  rowLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  rowLabelDestructive: {
    color: colors.error500,
  },
  rowChevron: {
    ...typography.bodySmall,
    color: colors.textPlaceholder,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.md,
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    gap: spacing.md,
  },
  toggleInfo: {
    flex: 1,
    gap: spacing.xxxs,
  },
  toggleDescription: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
});

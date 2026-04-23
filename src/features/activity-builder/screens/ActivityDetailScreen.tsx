import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { colors, radii, shadows, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { TierRewardSection } from '../components/TierRewardSection';
import { BonusPresetSection } from '../components/BonusPresetSection';
import { activityBuilderKeys } from '../queries/keys';
import { useDrillsQuery } from '../queries/useDrillsQuery';
import { getActivityById, updateActivity, deleteActivity } from '../repositories/activity.repository';
import { deleteDrill, reorderDrills, updateDrill } from '../repositories/drill.repository';
import { getElementsByDrill } from '../repositories/tracking-element.repository';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIVITY_ICONS = [
  '⚽', '🏀', '🎾', '⚾', '🏈', '🏊', '🤸', '🎯',
  '📚', '🎵', '🎨', '🏃', '🧘', '🏋️', '🤼', '🥊',
  '🎸', '🧩',
];

// ---------------------------------------------------------------------------
// DrillElementCount — isolated per-drill element count query
// ---------------------------------------------------------------------------

interface DrillElementCountProps {
  drillId: string;
}

function DrillElementCount({ drillId }: DrillElementCountProps) {
  const { data } = useQuery({
    queryKey: activityBuilderKeys.elements(drillId),
    queryFn: () => getElementsByDrill(drillId),
  });

  if (data === undefined) return null;

  const count = data.length;
  const label = count === 0 ? 'No tracking elements' : `${count} element${count !== 1 ? 's' : ''}`;

  return <Text style={styles.elementCount}>{label}</Text>;
}

// ---------------------------------------------------------------------------
// ReorderHandle — shows ▲ / ▼ move buttons when tapped
// ---------------------------------------------------------------------------

interface ReorderHandleProps {
  drillId: string;
  index: number;
  total: number;
  allIds: string[];
  onReordered: () => void;
}

function ReorderHandle({ drillId, index, total, allIds, onReordered }: ReorderHandleProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();

  const move = async (direction: 'up' | 'down') => {
    const newIds = [...allIds];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newIds[index];
    newIds[index] = newIds[swapIndex];
    newIds[swapIndex] = temp;
    try {
      await reorderDrills(newIds);
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.drills(activityId ?? '') });
    } catch {
      showToast('error', 'Could not reorder drills.');
    }
    setOpen(false);
    onReordered();
  };

  if (open) {
    return (
      <View style={styles.reorderButtons}>
        <Pressable
          onPress={() => move('up')}
          disabled={index === 0}
          style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
          accessibilityLabel="Move drill up"
        >
          <Text style={styles.reorderBtnText}>▲</Text>
        </Pressable>
        <Pressable
          onPress={() => move('down')}
          disabled={index === total - 1}
          style={[styles.reorderBtn, index === total - 1 && styles.reorderBtnDisabled]}
          accessibilityLabel="Move drill down"
        >
          <Text style={styles.reorderBtnText}>▼</Text>
        </Pressable>
        <Pressable onPress={() => setOpen(false)} style={styles.reorderBtn} accessibilityLabel="Close reorder">
          <Text style={styles.reorderBtnText}>✕</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={() => setOpen(true)} style={styles.dragHandle} accessibilityLabel="Reorder drill">
      <Text style={styles.dragHandleText}>≡</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// IconPickerModal
// ---------------------------------------------------------------------------

interface IconPickerModalProps {
  visible: boolean;
  onSelect: (icon: string) => void;
  onDismiss: () => void;
}

function IconPickerModal({ visible, onSelect, onDismiss }: IconPickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.iconPickerScrim} onPress={onDismiss}>
        <View style={styles.iconPickerContainer}>
          <Text style={styles.iconPickerTitle}>Pick an icon</Text>
          <View style={styles.iconGrid}>
            {ACTIVITY_ICONS.map((icon) => (
              <Pressable
                key={icon}
                onPress={() => onSelect(icon)}
                style={({ pressed }) => [styles.iconCell, pressed && styles.iconCellPressed]}
                accessibilityLabel={`Select icon ${icon}`}
              >
                <Text style={styles.iconCellText}>{icon}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <SkeletonPlaceholder style={styles.skeleton}>
      {/* Header */}
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonName} />
      </View>
      {/* 3 drill rows */}
      <View style={styles.skeletonRow} />
      <View style={styles.skeletonRow} />
      <View style={styles.skeletonRow} />
      {/* 2 action buttons */}
      <View style={styles.skeletonAction} />
      <View style={styles.skeletonAction} />
    </SkeletonPlaceholder>
  );
}

// ---------------------------------------------------------------------------
// ActivityDetailScreen
// ---------------------------------------------------------------------------

export function ActivityDetailScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const queryClient = useQueryClient();
  const { showDestructiveAlert } = useDestructiveAlert();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [iconPickerVisible, setIconPickerVisible] = useState(false);

  const nameInputRef = useRef<TextInput>(null);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: activityBuilderKeys.activity(activityId ?? ''),
    queryFn: () => getActivityById(activityId!),
    enabled: !!activityId,
  });

  const {
    data: drills,
    isLoading: drillsLoading,
    isError: drillsError,
    refetch: refetchDrills,
  } = useDrillsQuery(activityId ?? '');

  const isLoading = activityLoading || drillsLoading;
  const isError = activityError || drillsError;

  // -------------------------------------------------------------------------
  // Handlers — activity
  // -------------------------------------------------------------------------

  const handleNamePress = () => {
    setNameValue(activity?.name ?? '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleNameBlur = async () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === activity?.name) return;
    try {
      await updateActivity(activityId!, { name: trimmed });
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.activity(activityId!) });
    } catch {
      showToast('error', 'Could not update activity name.');
    }
  };

  const handleIconSelect = async (icon: string) => {
    setIconPickerVisible(false);
    if (icon === activity?.icon) return;
    try {
      await updateActivity(activityId!, { icon });
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.activity(activityId!) });
    } catch {
      showToast('error', 'Could not update activity icon.');
    }
  };

  const handleToggleActive = async () => {
    if (!activity) return;
    const next = activity.is_active === 0;
    try {
      await updateActivity(activityId!, { is_active: next });
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.activity(activityId!) });
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.activities('') });
    } catch {
      showToast('error', 'Could not update activity.');
    }
  };

  const handleDeleteActivity = () => {
    showDestructiveAlert({
      title: 'Delete this activity?',
      message: 'All drills and configuration will be removed. Past sessions will not be deleted.',
      onConfirm: async () => {
        try {
          await deleteActivity(activityId!);
          queryClient.invalidateQueries({ queryKey: activityBuilderKeys.activities('') });
          router.back();
        } catch {
          showToast('error', 'Could not delete activity.');
        }
      },
    });
  };

  // -------------------------------------------------------------------------
  // Handlers — drills
  // -------------------------------------------------------------------------

  const handleDeleteDrill = async (drillId: string) => {
    try {
      await deleteDrill(drillId);
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.drills(activityId ?? '') });
    } catch {
      showToast('error', 'Could not delete drill.');
    }
  };

  const handleToggleDrillActive = async (drillId: string, currentActive: number) => {
    try {
      await updateDrill(drillId, { is_active: currentActive === 0 });
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.drills(activityId ?? '') });
    } catch {
      showToast('error', 'Could not update drill.');
    }
  };

  const handleAddDrill = () => {
    if (!activityId) return;
    router.push(`/(settings)/activities/${activityId}/create-drill` as never);
  };

  const handleDrillPress = (drillId: string) => {
    if (!activityId) return;
    router.push(`/(settings)/activities/${activityId}/${drillId}` as never);
  };

  const handleRetry = () => {
    void refetchActivity();
    void refetchDrills();
  };

  // -------------------------------------------------------------------------
  // Render — screen states
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <View style={styles.container}>
        <OfflineBanner />
        <LoadingSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <OfflineBanner />
        <ErrorState onRetry={handleRetry} />
      </View>
    );
  }

  const drillIds = (drills ?? []).map((d) => d.id);
  const conditionItems = (drills ?? []).map((d) => ({ id: d.id, label: d.name }));
  const isActive = activity?.is_active !== 0;

  // -------------------------------------------------------------------------
  // Render — full screen
  // -------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---------------------------------------------------------------- */}
        {/* Activity header                                                  */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.headerSection}>
          <Pressable
            onPress={() => setIconPickerVisible(true)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            accessibilityLabel="Change activity icon"
          >
            <Text style={styles.iconText}>{activity?.icon ?? '🎯'}</Text>
          </Pressable>

          <View style={styles.headerNameContainer}>
            {editingName ? (
              <TextInput
                ref={nameInputRef}
                value={nameValue}
                onChangeText={setNameValue}
                onBlur={handleNameBlur}
                onSubmitEditing={handleNameBlur}
                style={styles.nameInput}
                returnKeyType="done"
                autoCapitalize="words"
                maxLength={60}
              />
            ) : (
              <Pressable onPress={handleNamePress} accessibilityLabel="Edit activity name">
                <Text style={styles.activityName}>{activity?.name ?? ''}</Text>
                {!isActive && (
                  <Text style={styles.inactiveLabel}>Deactivated</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Session rewards                                                  */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Session Rewards</Text>

        <TierRewardSection
          parentType="activity"
          parentId={activityId ?? ''}
          conditionItems={conditionItems}
        />

        <View style={styles.sectionGap} />

        <BonusPresetSection
          parentType="activity"
          parentId={activityId ?? ''}
        />

        <View style={styles.divider} />

        {/* ---------------------------------------------------------------- */}
        {/* Drills                                                           */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Drills</Text>

        {!drills?.length ? (
          <EmptyState
            title="No drills yet"
            body="Add your first drill to start tracking."
            ctaLabel="Add drill"
            onCtaPress={handleAddDrill}
            style={styles.emptyDrills}
          />
        ) : (
          drills.map((drill, index) => (
            <SwipeToDeleteRow
              key={drill.id}
              onDelete={() => handleDeleteDrill(drill.id)}
              confirmTitle="Delete drill"
              confirmMessage="Delete this drill? This cannot be undone."
            >
              <Pressable
                onPress={() => handleDrillPress(drill.id)}
                style={styles.drillRow}
                accessibilityLabel={`Open drill ${drill.name}`}
              >
                <View style={styles.drillRowContent}>
                  <Text style={styles.drillName}>{drill.name}</Text>
                  <DrillElementCount drillId={drill.id} />
                  {drill.is_active === 0 && (
                    <View style={styles.drillRowMeta}>
                      <Text style={styles.deactivatedLabel}>Deactivated</Text>
                      <Pressable
                        onPress={() => handleToggleDrillActive(drill.id, drill.is_active)}
                        style={styles.reactivateButton}
                        accessibilityLabel="Reactivate drill"
                      >
                        <Text style={styles.reactivateText}>Reactivate</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
                <ReorderHandle
                  drillId={drill.id}
                  index={index}
                  total={drills.length}
                  allIds={drillIds}
                  onReordered={() => {}}
                />
              </Pressable>
            </SwipeToDeleteRow>
          ))
        )}

        <Button
          title="Add drill"
          onPress={handleAddDrill}
          style={styles.addDrillButton}
        />

        <View style={styles.divider} />

        {/* ---------------------------------------------------------------- */}
        {/* Activity actions                                                 */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.actionsSection}>
          <Button
            title={isActive ? 'Deactivate activity' : 'Reactivate activity'}
            onPress={handleToggleActive}
            variant="secondary"
          />
          <Button
            title="Delete activity"
            onPress={handleDeleteActivity}
            variant="destructive"
          />
        </View>
      </ScrollView>

      <IconPickerModal
        visible={iconPickerVisible}
        onSelect={handleIconSelect}
        onDismiss={() => setIconPickerVisible(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.primary100,
  },
  iconText: {
    fontSize: 28,
    lineHeight: 34,
  },
  headerNameContainer: {
    flex: 1,
  },
  activityName: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  inactiveLabel: {
    ...typography.caption,
    color: colors.warning700,
    marginTop: spacing.xxs,
  },
  nameInput: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary500,
    paddingVertical: spacing.xxs,
  },

  // Section headers
  sectionHeader: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  sectionGap: {
    height: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },

  // Drill rows
  drillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  drillRowContent: {
    flex: 1,
  },
  drillName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  elementCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  drillRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  deactivatedLabel: {
    ...typography.caption,
    color: colors.warning700,
  },
  reactivateButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxxs,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.primary500,
  },
  reactivateText: {
    ...typography.captionSmall,
    color: colors.primary500,
  },
  chevron: {
    ...typography.titleMedium,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },

  // Reorder handle
  dragHandle: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleText: {
    fontSize: 20,
    color: colors.textPlaceholder,
  },
  reorderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  reorderBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xs,
    backgroundColor: colors.primary50,
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  reorderBtnText: {
    fontSize: 14,
    color: colors.primary500,
  },

  // Add drill
  emptyDrills: {
    minHeight: 140,
  },
  addDrillButton: {
    alignSelf: 'stretch',
  },

  // Activity actions
  actionsSection: {
    gap: spacing.sm,
  },

  // Icon picker
  iconPickerScrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '85%',
    gap: spacing.md,
  },
  iconPickerTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  iconCell: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.primary50,
  },
  iconCellPressed: {
    backgroundColor: colors.primary100,
  },
  iconCellText: {
    fontSize: 26,
    lineHeight: 32,
  },

  // Skeleton
  skeleton: {
    margin: spacing.md,
    gap: spacing.sm,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 68,
    borderRadius: radii.md,
  },
  skeletonIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
  },
  skeletonName: {
    flex: 1,
    height: 20,
    borderRadius: radii.sm,
  },
  skeletonRow: {
    height: 56,
    borderRadius: radii.md,
  },
  skeletonAction: {
    height: 48,
    borderRadius: radii.md,
  },
});

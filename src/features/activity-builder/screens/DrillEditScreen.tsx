import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { BottomSheet } from '@/shared/components/BottomSheet';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ErrorState } from '@/shared/components/ErrorState';
import { Input } from '@/shared/components/Input';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import { colors, radii, shadows, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import {
  ELEMENT_CATEGORIES,
  ELEMENT_LABELS,
  type ElementCategory,
  type ElementType,
} from '@/shared/tracking-elements/types/element-types';
import { getDefaultConfig } from '@/shared/tracking-elements/validation';
import { getDrillById, updateDrill, deleteDrill } from '../repositories/drill.repository';
import {
  getElementsByDrill,
  insertElement,
  deleteElement,
  reorderElements,
} from '../repositories/tracking-element.repository';
import { activityBuilderKeys } from '../queries/keys';
import { ElementConfigRouter } from '../components/elements/ElementConfigRouter';
import { TierRewardSection } from '../components/TierRewardSection';
import { BonusPresetSection } from '../components/BonusPresetSection';
import type { ConditionItem } from '../components/TierRewardBottomSheet';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<ElementCategory, string> = {
  counters: 'Counters',
  timers: 'Timers',
  selection: 'Selection',
  input: 'Input',
};

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <SkeletonPlaceholder style={styles.skeleton}>
      <View style={styles.skeletonName} />
      <View style={styles.skeletonElement} />
      <View style={styles.skeletonElement} />
    </SkeletonPlaceholder>
  );
}

// ---------------------------------------------------------------------------
// DrillEditScreen
// ---------------------------------------------------------------------------

export function DrillEditScreen() {
  const router = useRouter();
  const { activityId, drillId } = useLocalSearchParams<{
    activityId: string;
    drillId: string;
  }>();
  const queryClient = useQueryClient();
  const { showDestructiveAlert } = useDestructiveAlert();

  const [name, setName] = useState('');
  const [showElementPicker, setShowElementPicker] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const {
    data: drill,
    isLoading: drillLoading,
    isError: drillError,
    refetch: refetchDrill,
  } = useQuery({
    queryKey: activityBuilderKeys.drill(drillId ?? ''),
    queryFn: () => getDrillById(drillId!),
    enabled: !!drillId,
  });

  const {
    data: elements,
    isLoading: elementsLoading,
    isError: elementsError,
    refetch: refetchElements,
  } = useQuery({
    queryKey: activityBuilderKeys.elements(drillId ?? ''),
    queryFn: () => getElementsByDrill(drillId!),
    enabled: !!drillId,
  });

  const isLoading = drillLoading || elementsLoading;
  const isError = drillError || elementsError;

  useEffect(() => {
    if (drill) setName(drill.name);
  }, [drill]);

  // -------------------------------------------------------------------------
  // Handlers — drill
  // -------------------------------------------------------------------------

  const handleSave = async () => {
    if (!drillId || !name.trim() || name.trim().length > 50) return;
    try {
      await updateDrill(drillId, { name: name.trim() });
      showToast('success', 'Drill saved.');
    } catch {
      showToast('error', 'Could not save drill.');
    }
  };

  const handleToggleActive = async () => {
    if (!drill || !drillId) return;
    try {
      await updateDrill(drillId, { is_active: drill.is_active === 0 });
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.drill(drillId) });
      queryClient.invalidateQueries({
        queryKey: activityBuilderKeys.drills(activityId ?? ''),
      });
    } catch {
      showToast('error', 'Could not update drill.');
    }
  };

  const handleDeleteDrill = () => {
    showDestructiveAlert({
      title: 'Delete this drill?',
      message: 'This cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDrill(drillId!);
          queryClient.invalidateQueries({
            queryKey: activityBuilderKeys.drills(activityId ?? ''),
          });
          router.back();
        } catch {
          showToast('error', 'Could not delete drill.');
        }
      },
    });
  };

  // -------------------------------------------------------------------------
  // Handlers — elements
  // -------------------------------------------------------------------------

  const handleAddElement = async (type: ElementType) => {
    if (!drillId) return;
    setShowElementPicker(false);
    try {
      const id = randomUUID();
      const config = getDefaultConfig(type);
      await insertElement(id, drillId, type, ELEMENT_LABELS[type], config);
      refetchElements();
    } catch {
      showToast('error', 'Could not add element.');
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    try {
      await deleteElement(elementId);
      refetchElements();
    } catch {
      showToast('error', 'Could not remove element.');
    }
  };

  const handleMoveElement = async (elementId: string, direction: 'up' | 'down') => {
    if (!elements) return;
    const idx = elements.findIndex((e) => e.id === elementId);
    if (idx < 0) return;
    const newElements = [...elements];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newElements.length) return;
    [newElements[idx], newElements[swapIdx]] = [newElements[swapIdx], newElements[idx]];
    try {
      await reorderElements(newElements.map((e) => e.id));
      refetchElements();
    } catch {
      showToast('error', 'Could not reorder elements.');
    }
  };

  const handleRetry = () => {
    void refetchDrill();
    void refetchElements();
  };

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const editingElement = elements?.find((e) => e.id === editingElementId);
  const conditionItems: ConditionItem[] = (elements ?? []).map((e) => ({
    id: e.id,
    label: e.label,
    isDeactivated: false,
  }));

  const nameError =
    name.trim().length > 50 ? 'Name must be under 50 characters.' : undefined;
  const saveDisabled = !name.trim() || !!nameError;

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
        {/* Drill name                                                        */}
        {/* ---------------------------------------------------------------- */}
        <Input
          label="Drill name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Batting practice, Stretches"
          required
          error={nameError}
          maxLength={60}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Tracking elements                                                 */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Tracking Elements</Text>

        {!elements?.length && (
          <Text style={styles.emptyElements}>
            No elements yet. Add your first tracking element.
          </Text>
        )}

        {elements?.map((el, index) => (
          <SwipeToDeleteRow
            key={el.id}
            onDelete={() => handleDeleteElement(el.id)}
            confirmTitle="Remove element"
            confirmMessage="Remove this element? This cannot be undone."
          >
            <Pressable
              onPress={() => setEditingElementId(el.id)}
              style={styles.elementRow}
              accessibilityLabel={`Edit ${el.label}`}
            >
              <View style={styles.elementInfo}>
                <Text style={styles.elementLabel}>{el.label}</Text>
                <Text style={styles.elementType}>{ELEMENT_LABELS[el.type as ElementType]}</Text>
              </View>
              <View style={styles.elementActions}>
                <Pressable
                  onPress={() => handleMoveElement(el.id, 'up')}
                  disabled={index === 0}
                  style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
                  accessibilityLabel="Move element up"
                >
                  <Text style={styles.moveBtnText}>▲</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleMoveElement(el.id, 'down')}
                  disabled={index === (elements?.length ?? 0) - 1}
                  style={[
                    styles.moveBtn,
                    index === (elements?.length ?? 0) - 1 && styles.moveBtnDisabled,
                  ]}
                  accessibilityLabel="Move element down"
                >
                  <Text style={styles.moveBtnText}>▼</Text>
                </Pressable>
                <Text style={styles.elementChevron}>›</Text>
              </View>
            </Pressable>
          </SwipeToDeleteRow>
        ))}

        <Button
          title="Add element"
          onPress={() => setShowElementPicker(true)}
          variant="secondary"
          size="small"
          style={styles.addElementButton}
        />

        <View style={styles.divider} />

        {/* ---------------------------------------------------------------- */}
        {/* Drill-level rewards                                               */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Drill Rewards</Text>

        <TierRewardSection
          parentType="drill"
          parentId={drillId ?? ''}
          conditionItems={conditionItems}
        />

        <View style={styles.sectionGap} />

        <BonusPresetSection parentType="drill" parentId={drillId ?? ''} />

        <View style={styles.divider} />

        {/* ---------------------------------------------------------------- */}
        {/* Drill actions                                                     */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionHeader}>Drill Actions</Text>

        <Button
          title={drill?.is_active === 0 ? 'Reactivate drill' : 'Deactivate drill'}
          onPress={handleToggleActive}
          variant="secondary"
        />

        <Button
          title="Delete drill"
          onPress={handleDeleteDrill}
          variant="destructive"
        />

        {/* ---------------------------------------------------------------- */}
        {/* Save                                                              */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.divider} />

        <Button
          title="Save"
          onPress={handleSave}
          disabled={saveDisabled}
        />
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Element picker bottom sheet                                         */}
      {/* ------------------------------------------------------------------ */}
      {showElementPicker && (
        <BottomSheet snapPoints={['70%']} onDismiss={() => setShowElementPicker(false)}>
          <ScrollView
            contentContainerStyle={styles.pickerContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.pickerTitle}>Add tracking element</Text>
            {(Object.entries(ELEMENT_CATEGORIES) as [ElementCategory, readonly ElementType[]][]).map(
              ([category, types]) => (
                <View key={category} style={styles.pickerCategory}>
                  <Text style={styles.pickerCategoryLabel}>{CATEGORY_LABELS[category]}</Text>
                  <View style={styles.chipRow}>
                    {types.map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => handleAddElement(type)}
                        style={({ pressed }) => [styles.typeChip, pressed && styles.typeChipPressed]}
                        accessibilityLabel={`Add ${ELEMENT_LABELS[type]}`}
                      >
                        <Text style={styles.typeChipText}>+ {ELEMENT_LABELS[type]}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ),
            )}
          </ScrollView>
        </BottomSheet>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Element config bottom sheet                                         */}
      {/* ------------------------------------------------------------------ */}
      {editingElementId && editingElement && (
        <BottomSheet snapPoints={['60%']} onDismiss={() => setEditingElementId(null)}>
          <ScrollView
            contentContainerStyle={styles.configContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.configTitle}>{editingElement.label}</Text>
            <Text style={styles.configSubtitle}>
              {ELEMENT_LABELS[editingElement.type as ElementType]}
            </Text>
            <ElementConfigRouter
              elementId={editingElement.id}
              type={editingElement.type as ElementType}
              config={JSON.parse(editingElement.config)}
              onConfigChange={() => refetchElements()}
            />
          </ScrollView>
        </BottomSheet>
      )}
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
    paddingBottom: spacing.xxxl,
  },

  sectionHeader: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  sectionGap: { height: spacing.xs },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },

  emptyElements: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Element rows
  elementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    ...shadows.sm,
  },
  elementInfo: { flex: 1 },
  elementLabel: { ...typography.bodySmall, color: colors.textPrimary },
  elementType: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  elementChevron: { ...typography.titleMedium, color: colors.textSecondary, marginLeft: spacing.xs },
  elementActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  moveBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xs,
    backgroundColor: colors.primary50,
  },
  moveBtnDisabled: { opacity: 0.3 },
  moveBtnText: { fontSize: 12, color: colors.primary500 },

  addElementButton: { alignSelf: 'flex-start' },

  // Skeleton
  skeleton: { margin: spacing.md, gap: spacing.sm },
  skeletonName: { height: 72, borderRadius: radii.md },
  skeletonElement: { height: 56, borderRadius: radii.md },

  // Element picker sheet content
  pickerContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  pickerTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  pickerCategory: { gap: spacing.xs },
  pickerCategoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  typeChipPressed: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  typeChipText: { ...typography.caption, color: colors.textPrimary },

  // Config sheet content
  configContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  configTitle: { ...typography.titleSmall, color: colors.textPrimary },
  configSubtitle: { ...typography.caption, color: colors.textSecondary },
});

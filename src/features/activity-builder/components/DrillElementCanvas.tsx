import { useCallback, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { ArrowsInSimple, ArrowsOutSimple, Plus } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import Sortable from 'react-native-sortables';

import { InBottomSheetContext } from '@/shared/components/BottomSheet';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import { colors, typography, spacing, radii } from '@/shared/theme';
import {
  ELEMENT_LABELS,
  ELEMENT_CATEGORIES,
  ELEMENT_SUPPORTS_HALF_WIDTH,
  type ElementType,
  type ElementCategory,
  type ElementWidth,
} from '@/shared/tracking-elements/types/element-types';
import { ElementInfoModal } from './elements/previews/ElementInfoModal';
import { ElementPreview } from './elements/previews/element-previews';
import { ElementStaticPreview } from './ElementStaticPreview';

const CATEGORY_LABELS: Record<ElementCategory, string> = {
  counters: 'Counters',
  timers: 'Timers',
  selection: 'Selection',
  input: 'Input',
};

// ---------------------------------------------------------------------------
// The drill-builder element canvas: the live grid of tracking-element cards,
// the "Add tracking element" tile, the type picker, and the configure modal.
// It owns the UI (grid measurement, the full/half toggle, swipe-to-delete, the
// picker → ElementInfoModal flow) but NOT persistence — the parent passes the
// elements and handles each callback (draft state on create, live mutations on
// edit), so the add and edit screens share one identical canvas.
// ---------------------------------------------------------------------------

export interface CanvasElement {
  /** Stable id — a draft localId on create, the DB row id on edit. */
  id: string;
  type: ElementType;
  label: string;
  config: Record<string, unknown>;
  width: ElementWidth;
}

interface DrillElementCanvasProps {
  elements: CanvasElement[];
  /** Add (editingId null) or edit an existing element after the configure modal. */
  onSubmitElement: (
    editingId: string | null,
    type: ElementType,
    label: string,
    config: Record<string, unknown>,
  ) => void;
  /** Full/half toggle on a card. */
  onToggleWidth: (id: string, width: ElementWidth) => void;
  /** Raw removal — the swipe row already ran the confirmation. */
  onDelete: (id: string) => void;
  /** New element order (ids) after a drag-reorder. */
  onReorder: (ids: string[]) => void;
}

export function DrillElementCanvas({
  elements,
  onSubmitElement,
  onToggleWidth,
  onDelete,
  onReorder,
}: DrillElementCanvasProps) {
  const [gridW, setGridW] = useState(0);
  const [infoElement, setInfoElement] = useState<ElementType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pickerRef = useRef<BottomSheetModal>(null);
  // Type chosen in the picker. The configure modal opens only AFTER the picker
  // finishes dismissing — opening the RN Modal while the sheet is still
  // animating closed leaves the sheet stuck open behind it.
  const pendingTypeRef = useRef<ElementType | null>(null);
  // Quick picker open/close so the configure modal (which can only open after
  // the picker fully dismisses) appears promptly.
  const sheetAnimationConfigs = useBottomSheetTimingConfigs({ duration: 200 });

  const editingElement = elements.find((e) => e.id === editingId) ?? null;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  const toggleWidth = (id: string, width: ElementWidth) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleWidth(id, width);
  };

  const handleEdit = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    setEditingId(id);
    setInfoElement(el.type);
  };

  const handleSubmit = (type: ElementType, label: string, config: Record<string, unknown>) => {
    onSubmitElement(editingId, type, label, config);
    setInfoElement(null);
    setEditingId(null);
  };

  return (
    <>
      {/* Tracking element cards — press-and-hold to reorder, tap to edit, swipe
          left to remove. Laid out by width: full takes its own row, half pairs. */}
      <View style={styles.canvasGrid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
        <Sortable.Flex
          columnGap={spacing.sm}
          rowGap={spacing.sm}
          dimensionsAnimationType="worklet"
          hapticsEnabled
          onDragEnd={({ order }) => onReorder(order(elements).map((e) => e.id))}
        >
          {elements.map((el) => {
            const supportsHalf = ELEMENT_SUPPORTS_HALF_WIDTH[el.type];
            const isHalf = el.width === 'half' && supportsHalf;
            const WidthIcon = isHalf ? ArrowsOutSimple : ArrowsInSimple;
            // A percentage flexBasis does not re-apply at runtime on this build
            // (Fabric), so size each slot with an explicit pixel width derived
            // from the measured grid: full = whole row, half = (row − gap) / 2.
            const slotW =
              gridW > 0 ? (isHalf ? Math.floor((gridW - spacing.sm) / 2) : gridW) : undefined;
            return (
              <View key={el.id} style={[styles.cardSlot, slotW != null && { width: slotW }]}>
                <SwipeToDeleteRow
                  borderRadius={radii.lg}
                  onDelete={() => onDelete(el.id)}
                  confirmTitle="Remove element"
                  confirmMessage={`Remove ${el.label}?`}
                >
                  <Sortable.Touchable
                    onTap={() => handleEdit(el.id)}
                    style={styles.card}
                    accessibilityLabel={`Edit ${el.label}`}
                  >
                    {supportsHalf && (
                      <Sortable.Touchable
                        onTap={() => toggleWidth(el.id, isHalf ? 'full' : 'half')}
                        style={styles.widthButton}
                        accessibilityLabel={
                          isHalf
                            ? `Expand ${el.label} to full width`
                            : `Reduce ${el.label} to half width`
                        }
                      >
                        <WidthIcon size={18} color={colors.primary700} weight="bold" />
                      </Sortable.Touchable>
                    )}
                    <Text style={styles.elementLabel} numberOfLines={1}>{el.label}</Text>
                    <View style={styles.elementPreviewBox}>
                      <ElementStaticPreview type={el.type} config={el.config} />
                    </View>
                  </Sortable.Touchable>
                </SwipeToDeleteRow>
              </View>
            );
          })}
        </Sortable.Flex>
      </View>

      {/* Add tracking tile */}
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          pickerRef.current?.present();
        }}
        style={({ pressed }) => [styles.addTile, pressed && styles.addTilePressed]}
        accessibilityLabel="Add tracking element"
      >
        <Plus size={16} color={colors.primary500} weight="bold" />
        <Text style={styles.addTileText}>Add tracking element</Text>
      </Pressable>

      <BottomSheetModal
        ref={pickerRef}
        snapPoints={['75%']}
        animationConfigs={sheetAnimationConfigs}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        handleStyle={styles.sheetHandle}
        handleIndicatorStyle={styles.sheetHandleIndicator}
        backgroundStyle={styles.sheetBackground}
        onDismiss={() => {
          const type = pendingTypeRef.current;
          if (type) {
            pendingTypeRef.current = null;
            setInfoElement(type);
          }
        }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickerContent}>
          <InBottomSheetContext.Provider value={true}>
            <Text style={styles.pickerTitle}>What do you want to track?</Text>
            {(Object.entries(ELEMENT_CATEGORIES) as [ElementCategory, readonly ElementType[]][]).map(
              ([category, types]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category]}</Text>
                  <View style={styles.previewGrid}>
                    {types.map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => {
                          pendingTypeRef.current = type;
                          pickerRef.current?.dismiss();
                        }}
                        style={({ pressed }) => [styles.previewCard, pressed && styles.previewCardPressed]}
                        accessibilityLabel={`Add ${ELEMENT_LABELS[type]}`}
                      >
                        <View style={styles.previewBox}><ElementPreview type={type} /></View>
                        <Text style={styles.previewLabel}>{ELEMENT_LABELS[type]}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ),
            )}
          </InBottomSheetContext.Provider>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <ElementInfoModal
        type={infoElement}
        seedKey={editingId ?? (infoElement ? `add:${infoElement}` : undefined)}
        initialLabel={editingElement?.label}
        initialConfig={editingElement?.config}
        submitLabel={editingId ? 'Save' : 'Add to drill'}
        onDismiss={() => {
          setInfoElement(null);
          setEditingId(null);
        }}
        onAdd={handleSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  canvasGrid: {
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary100,
    padding: spacing.md,
    minWidth: 0,
  },
  cardSlot: { minWidth: 0 },
  widthButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elementLabel: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  elementPreviewBox: {
    minHeight: 56,
    paddingTop: spacing.xs,
  },

  // Dashed add tile
  addTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary50,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.primary100,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  addTilePressed: { backgroundColor: colors.primary100 },
  addTileText: { ...typography.bodySmall, color: colors.primary700, fontWeight: '600' },

  // Tracking picker sheet
  sheetHandle: { paddingTop: 12, paddingBottom: 8 },
  sheetHandleIndicator: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.borderDefault,
  },
  sheetBackground: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  pickerContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  pickerTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.md },
  categorySection: { marginBottom: spacing.md },
  categoryLabel: {
    ...typography.caption,
    color: colors.primary700,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  previewCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary100,
    padding: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  previewCardPressed: { backgroundColor: colors.primary50, borderColor: colors.primary500 },
  previewBox: { width: '100%', height: 72, alignItems: 'center', justifyContent: 'center' },
  previewLabel: { ...typography.caption, color: colors.textPrimary, textAlign: 'center' },
});

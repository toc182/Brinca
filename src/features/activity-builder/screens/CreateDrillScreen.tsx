import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { Info, NotePencil, Plus, WarningCircle } from 'phosphor-react-native';

import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';

import { BottomSheet } from '@/shared/components/BottomSheet';
import { Screen } from '@/shared/components/Screen';
import { MODAL_HEADER_CONTENT_BOTTOM, ModalHeader } from '@/shared/components/ModalHeader';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { processPendingPhotos } from '@/lib/sync/photo-upload-queue';
import { insertDrill } from '../repositories/drill.repository';
import { insertLocalPhoto } from '../repositories/drill-photo.repository';
import { insertElement } from '../repositories/tracking-element.repository';
import { activityBuilderKeys } from '../queries/keys';
import { DrillDescriptionEditor } from '../components/DrillDescriptionEditor';
import {
  ELEMENT_LABELS,
  ELEMENT_CATEGORIES,
  type ElementType,
  type ElementCategory,
} from '@/shared/tracking-elements/types/element-types';
import { ElementInfoModal } from '../components/elements/previews/ElementInfoModal';
import { ElementPreview } from '../components/elements/previews/element-previews';
import { ElementStaticPreview } from '../components/ElementStaticPreview';

const CATEGORY_LABELS: Record<ElementCategory, string> = {
  counters: 'Counters',
  timers: 'Timers',
  selection: 'Selection',
  input: 'Input',
};

// ---------------------------------------------------------------------------
// Live-canvas drill builder (Concept A). You assemble the actual screen your
// kid will use: name it, optionally add an instructions card and tracking
// elements, and the always-present pieces (session photos/notes, mark
// complete) are shown ghosted so the full drill is visible at a glance.
//
// Tracking elements are added via a bottom-sheet picker → ElementInfoModal
// (configure) → appended to the canvas. Phase 1: add + remove + reorder-less
// cards. Tap-to-reconfigure and drag-reorder come next.
//
// The screen keeps the "color wash" look (tinted page, purple accents) as a
// one-screen trial; not applied app-wide yet.
// ---------------------------------------------------------------------------

interface PendingElement {
  localId: string;
  type: ElementType;
  label: string;
  config: Record<string, unknown>;
}

export function CreateDrillScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const queryClient = useQueryClient();
  const { showDestructiveAlert } = useDestructiveAlert();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionPhotoUris, setDescriptionPhotoUris] = useState<string[]>([]);
  const [elements, setElements] = useState<PendingElement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoElement, setInfoElement] = useState<ElementType | null>(null);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [showTrackingPicker, setShowTrackingPicker] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  const editingElement = elements.find((e) => e.localId === editingLocalId) ?? null;
  const nameInputRef = useRef<TextInput>(null);
  const [nameError, setNameError] = useState(false);

  const isValid = name.trim().length >= 1 && name.trim().length <= 50;
  const hasInstructions = description.trim().length > 0 || descriptionPhotoUris.length > 0;

  const handleSubmitElement = (type: ElementType, label: string, config: Record<string, unknown>) => {
    if (editingLocalId) {
      setElements((prev) =>
        prev.map((e) => (e.localId === editingLocalId ? { ...e, label, config } : e)),
      );
    } else {
      setElements((prev) => [...prev, { localId: randomUUID(), type, label, config }]);
    }
    setInfoElement(null);
    setEditingLocalId(null);
  };

  const handleEditElement = (localId: string) => {
    const el = elements.find((e) => e.localId === localId);
    if (!el) return;
    setEditingLocalId(localId);
    setInfoElement(el.type);
  };

  const handleRemoveElement = (localId: string) => {
    showDestructiveAlert({
      title: 'Remove this element?',
      message: 'The element will be removed from this drill.',
      destructiveLabel: 'Remove',
      onConfirm: () => setElements((prev) => prev.filter((e) => e.localId !== localId)),
    });
  };

  const handleSave = async () => {
    if (!activityId) return;
    if (!isValid) {
      // Tapping the check with no name shouldn't be a dead end — surface an
      // inline error (a top toast would sit behind this modal sheet) and drop
      // the cursor straight into the name field.
      setNameError(true);
      nameInputRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    try {
      const drillId = randomUUID();
      const trimmedDescription = description.trim();
      await insertDrill(
        drillId,
        activityId,
        name.trim(),
        trimmedDescription.length > 0 ? trimmedDescription : null,
      );

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        await insertElement(randomUUID(), drillId, el.type, el.label, el.config);
      }

      // Materialize draft description photos: insert pending rows pointing
      // at the now-existing drill, then kick the upload pipeline.
      for (const uri of descriptionPhotoUris) {
        await insertLocalPhoto(drillId, uri);
      }
      if (descriptionPhotoUris.length > 0) {
        void processPendingPhotos();
      }

      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.drills(activityId) });
      router.back();
    } catch {
      showToast('error', 'Could not create drill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ModalHeader
      title="New drill"
      leftAction={{ icon: 'close', onPress: () => router.back(), accessibilityLabel: 'Cancel' }}
      rightAction={{ icon: 'check', onPress: handleSave, disabled: isSubmitting, accessibilityLabel: 'Save drill' }}
    />
    <Screen edges={['bottom']}>
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      bottomOffset={88}
    >
      {/* Name — the one required field, focused on open */}
      <TextInput
        ref={nameInputRef}
        style={[styles.nameInput, nameError && styles.nameInputError]}
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (nameError) setNameError(false);
        }}
        placeholder="Name your drill"
        placeholderTextColor={colors.textPlaceholder}
        autoFocus
        maxLength={50}
        returnKeyType="done"
      />
      {nameError ? (
        <View style={styles.nameErrorRow}>
          <WarningCircle size={14} color={colors.error600} weight="regular" />
          <Text style={styles.nameErrorText}>Enter a name to save your drill.</Text>
        </View>
      ) : (
        <View style={styles.nameSpacer} />
      )}

      {/* Instructions & photos card */}
      {instructionsExpanded ? (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardKicker}>
              <Info size={13} color={colors.primary500} weight="bold" />  INSTRUCTIONS &amp; PHOTOS
            </Text>
            <Pressable onPress={() => setInstructionsExpanded(false)} hitSlop={spacing.sm}>
              <Text style={styles.doneLink}>Done</Text>
            </Pressable>
          </View>
          <DrillDescriptionEditor
            mode="create"
            description={description}
            onChangeDescription={setDescription}
            draftPhotoUris={descriptionPhotoUris}
            onChangeDraftPhotoUris={setDescriptionPhotoUris}
          />
        </View>
      ) : hasInstructions ? (
        <Pressable
          onPress={() => setInstructionsExpanded(true)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          accessibilityLabel="Edit instructions and photos"
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardKicker}>
              <Info size={13} color={colors.primary500} weight="bold" />  INSTRUCTIONS &amp; PHOTOS
            </Text>
            <NotePencil size={16} color={colors.textPlaceholder} weight="regular" />
          </View>
          {description.trim().length > 0 && (
            <Text style={styles.instructionsSummary} numberOfLines={2}>
              {description.trim()}
            </Text>
          )}
          {descriptionPhotoUris.length > 0 && (
            <Text style={styles.instructionsPhotoCount}>
              {descriptionPhotoUris.length} photo{descriptionPhotoUris.length === 1 ? '' : 's'}
            </Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          onPress={() => setInstructionsExpanded(true)}
          style={({ pressed }) => [styles.addTile, pressed && styles.addTilePressed]}
          accessibilityLabel="Add instructions and photos"
        >
          <Plus size={16} color={colors.primary500} weight="bold" />
          <Text style={styles.addTileText}>Add instructions &amp; photos</Text>
        </Pressable>
      )}

      {/* Tracking element cards — tap to edit, Remove to delete */}
      {elements.map((el) => (
        <Pressable
          key={el.localId}
          onPress={() => handleEditElement(el.localId)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          accessibilityLabel={`Edit ${el.label}`}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.elementLabel} numberOfLines={1}>{el.label}</Text>
            <Pressable
              onPress={() => handleRemoveElement(el.localId)}
              hitSlop={spacing.sm}
              accessibilityLabel={`Remove ${el.label}`}
            >
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
          <View style={styles.elementPreviewBox}>
            <ElementStaticPreview type={el.type} config={el.config} />
          </View>
        </Pressable>
      ))}

      {/* Add tracking tile */}
      <Pressable
        onPress={() => setShowTrackingPicker(true)}
        style={({ pressed }) => [styles.addTile, pressed && styles.addTilePressed]}
        accessibilityLabel="Add tracking element"
      >
        <Plus size={16} color={colors.primary500} weight="bold" />
        <Text style={styles.addTileText}>Add tracking element</Text>
      </Pressable>

    </KeyboardAwareScrollView>
    </Screen>
    <AppKeyboardToolbar />

    {showTrackingPicker && (
      <BottomSheet
        snapPoints={['75%']}
        onDismiss={() => setShowTrackingPicker(false)}
        enableContentPanningGesture={false}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickerContent}>
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
                        setShowTrackingPicker(false);
                        setInfoElement(type);
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
            )
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    )}

    <ElementInfoModal
      type={infoElement}
      seedKey={editingLocalId ?? (infoElement ? `add:${infoElement}` : undefined)}
      initialLabel={editingElement?.label}
      initialConfig={editingElement?.config}
      submitLabel={editingLocalId ? 'Save' : 'Add to drill'}
      onDismiss={() => {
        setInfoElement(null);
        setEditingLocalId(null);
      }}
      onAdd={handleSubmitElement}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary50 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },

  nameInput: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  nameInputError: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.error500,
  },
  nameErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  nameErrorText: {
    ...typography.caption,
    color: colors.error700,
  },
  nameSpacer: { height: spacing.lg },

  // Shared canvas card (instructions, elements)
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary100,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: { backgroundColor: colors.primary50 },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardKicker: {
    ...typography.captionSmall,
    color: colors.primary700,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  doneLink: { ...typography.caption, color: colors.primary500, fontWeight: '600' },
  instructionsSummary: { ...typography.bodySmall, color: colors.textPrimary },
  instructionsPhotoCount: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },

  elementLabel: { ...typography.titleSmall, color: colors.textPrimary, flex: 1 },
  removeText: { ...typography.caption, color: colors.error600 },
  elementPreviewBox: {
    minHeight: 56,
    paddingTop: spacing.xs,
  },

  // Dashed add tiles
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

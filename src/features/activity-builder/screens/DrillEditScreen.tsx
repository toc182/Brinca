import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { Info, NotePencil, Plus, WarningCircle } from 'phosphor-react-native';

import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { Screen } from '@/shared/components/Screen';
import { MODAL_HEADER_CONTENT_BOTTOM, ModalHeader } from '@/shared/components/ModalHeader';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { colors, radii, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import type { ElementType, ElementWidth } from '@/shared/tracking-elements/types/element-types';
import { useUpdateElementMutation } from '../mutations/useUpdateElementMutation';
import { getDrillById, updateDrill } from '../repositories/drill.repository';
import {
  getElementsByDrill,
  insertElement,
  deleteElement,
  reorderElements,
} from '../repositories/tracking-element.repository';
import { activityBuilderKeys } from '../queries/keys';
import { DrillDescriptionEditor } from '../components/DrillDescriptionEditor';
import { DrillElementCanvas, type CanvasElement } from '../components/DrillElementCanvas';

// ---------------------------------------------------------------------------
// Edit drill. Mirrors the create screen's live canvas (shared
// DrillElementCanvas) but wired to live mutations: elements insert/update/
// delete/resize immediately; the header check commits name + description.
// Adds the edit-only Drill Rewards and Drill Actions sections below.
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

export function DrillEditScreen() {
  const router = useRouter();
  const { activityId, drillId } = useLocalSearchParams<{ activityId: string; drillId: string }>();
  const queryClient = useQueryClient();
  const updateElementMutation = useUpdateElementMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  const [nameError, setNameError] = useState(false);

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
    if (drill) {
      setName(drill.name);
      setDescription(drill.description ?? '');
    }
  }, [drill]);

  const isValid = name.trim().length >= 1 && name.trim().length <= 50;
  const hasInstructions = description.trim().length > 0;

  // -------------------------------------------------------------------------
  // Drill-level handlers
  // -------------------------------------------------------------------------

  const handleSaveAndClose = async () => {
    if (!drillId) return;
    if (!isValid) {
      setNameError(true);
      nameInputRef.current?.focus();
      return;
    }
    setIsSaving(true);
    try {
      const trimmed = description.trim();
      await updateDrill(drillId, {
        name: name.trim(),
        description: trimmed.length > 0 ? trimmed : null,
      });
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.drill(drillId) });
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.drills(activityId ?? '') });
      // DrillScreen (live session) keys the drill query on ['drill', id].
      queryClient.invalidateQueries({ queryKey: ['drill', drillId] });
      router.back();
    } catch {
      showToast('error', 'Could not save drill.');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Element handlers (live persistence — canvas drives the UI)
  // -------------------------------------------------------------------------

  const invalidateElements = () =>
    queryClient.invalidateQueries({ queryKey: activityBuilderKeys.elements(drillId ?? '') });

  const handleSubmitElement = async (
    editingId: string | null,
    type: ElementType,
    label: string,
    config: Record<string, unknown>,
  ) => {
    if (!drillId) return;
    try {
      if (editingId) {
        // Width is owned by the canvas toggle, not the modal — leave it alone.
        await updateElementMutation.mutateAsync({ elementId: editingId, drillId, fields: { label, config } });
      } else {
        await insertElement(randomUUID(), drillId, type, label, config);
        await invalidateElements();
      }
    } catch {
      showToast('error', 'Could not save element.');
    }
  };

  const handleToggleWidth = (id: string, width: ElementWidth) => {
    if (!drillId) return;
    // Optimistic: update the cache now so the canvas animates without waiting
    // for the DB round-trip; the mutation persists and re-confirms on success.
    queryClient.setQueryData(
      activityBuilderKeys.elements(drillId),
      (old: typeof elements) => old?.map((e) => (e.id === id ? { ...e, width } : e)),
    );
    updateElementMutation.mutate({ elementId: id, drillId, fields: { width } });
  };

  const handleDeleteElement = async (id: string) => {
    try {
      await deleteElement(id);
      await invalidateElements();
    } catch {
      showToast('error', 'Could not remove element.');
    }
  };

  const handleReorder = (ids: string[]) => {
    if (!drillId) return;
    // Optimistic: reorder the cache now so the canvas settles instantly; the
    // repo write persists the new display_order in the background.
    queryClient.setQueryData(activityBuilderKeys.elements(drillId), (old: typeof elements) => {
      if (!old) return old;
      const byId = new Map(old.map((e) => [e.id, e]));
      return ids.map((id) => byId.get(id)).filter((e): e is NonNullable<typeof e> => e != null);
    });
    reorderElements(ids).catch(() => {
      showToast('error', 'Could not reorder elements.');
      void invalidateElements();
    });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const canvasElements: CanvasElement[] = (elements ?? []).map((el) => ({
    id: el.id,
    type: el.type as ElementType,
    label: el.label,
    config: JSON.parse(el.config) as Record<string, unknown>,
    width: (el.width as ElementWidth) ?? 'full',
  }));

  const header = (
    <ModalHeader
      title="Edit drill"
      leftAction={{ icon: 'back', onPress: () => router.back(), accessibilityLabel: 'Back' }}
      rightAction={
        isLoading || isError
          ? undefined
          : { icon: 'check', onPress: handleSaveAndClose, disabled: isSaving, accessibilityLabel: 'Save drill' }
      }
    />
  );

  if (isLoading) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <View style={[styles.container, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}>
            <OfflineBanner />
            <LoadingSkeleton />
          </View>
        </Screen>
      </>
    );
  }

  if (isError) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <View style={[styles.container, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}>
            <OfflineBanner />
            <ErrorState
              onRetry={() => {
                void refetchDrill();
                void refetchElements();
              }}
            />
          </View>
        </Screen>
      </>
    );
  }

  return (
    <>
    {header}
    <Screen edges={['bottom']}>
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      bottomOffset={88}
    >
      <View style={styles.bannerInScroll}>
        <OfflineBanner />
      </View>

      {/* Name */}
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
            mode="edit"
            drillId={drillId!}
            description={description}
            onChangeDescription={setDescription}
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
          <Text style={styles.instructionsSummary} numberOfLines={2}>
            {description.trim()}
          </Text>
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

      {/* Tracking elements (shared canvas; edit wires live mutations) */}
      <DrillElementCanvas
        elements={canvasElements}
        onSubmitElement={handleSubmitElement}
        onToggleWidth={handleToggleWidth}
        onDelete={handleDeleteElement}
        onReorder={handleReorder}
      />
    </KeyboardAwareScrollView>
    </Screen>
    <AppKeyboardToolbar />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary50 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  bannerInScroll: { marginHorizontal: -spacing.lg },

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
  },
  nameErrorText: { ...typography.caption, color: colors.error700 },
  nameSpacer: { height: 0 },

  // Instructions card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary100,
    padding: spacing.md,
    minWidth: 0,
  },
  cardPressed: { opacity: 0.6 },
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

  // Dashed add tile (instructions)
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
  },
  addTilePressed: { backgroundColor: colors.primary100 },
  addTileText: { ...typography.bodySmall, color: colors.primary700, fontWeight: '600' },

  // Skeleton
  skeleton: { gap: spacing.sm },
  skeletonName: { height: 72, borderRadius: radii.md },
  skeletonElement: { height: 56, borderRadius: radii.md },
});

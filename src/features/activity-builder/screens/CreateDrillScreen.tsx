import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { Info, NotePencil, Plus, WarningCircle } from 'phosphor-react-native';

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
import { DrillElementCanvas } from '../components/DrillElementCanvas';
import type { ElementType, ElementWidth } from '@/shared/tracking-elements/types/element-types';

// ---------------------------------------------------------------------------
// Live-canvas drill builder (Concept A). You assemble the actual screen your
// kid will use: name it, optionally add an instructions card, and add tracking
// elements via the shared DrillElementCanvas (also used by the edit screen).
//
// Create builds a draft in local state and inserts everything on Save; the edit
// screen wires the same canvas to live mutations. The screen keeps the "color
// wash" look (tinted page, purple accents).
// ---------------------------------------------------------------------------

interface PendingElement {
  localId: string;
  type: ElementType;
  label: string;
  config: Record<string, unknown>;
  width: ElementWidth;
}

export function CreateDrillScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionPhotoUris, setDescriptionPhotoUris] = useState<string[]>([]);
  const [elements, setElements] = useState<PendingElement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  const nameInputRef = useRef<TextInput>(null);
  const [nameError, setNameError] = useState(false);

  const isValid = name.trim().length >= 1 && name.trim().length <= 50;
  const hasInstructions = description.trim().length > 0 || descriptionPhotoUris.length > 0;

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
        await insertElement(randomUUID(), drillId, el.type, el.label, el.config, el.width);
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
    // This screen is presented as a native modal, so the (settings) provider
    // sits behind it — the element picker's BottomSheetModal needs its own
    // provider here or it presents behind the screen (invisible).
    <BottomSheetModalProvider>
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

      {/* Tracking elements (shared canvas; create wires draft-state callbacks) */}
      <DrillElementCanvas
        elements={elements.map((e) => ({
          id: e.localId,
          type: e.type,
          label: e.label,
          config: e.config,
          width: e.width,
        }))}
        onSubmitElement={(editingId, type, label, config) => {
          if (editingId) {
            // Width is owned by the canvas toggle, not the modal — preserve it.
            setElements((prev) =>
              prev.map((e) => (e.localId === editingId ? { ...e, label, config } : e)),
            );
          } else {
            setElements((prev) => [...prev, { localId: randomUUID(), type, label, config, width: 'full' }]);
          }
        }}
        onToggleWidth={(id, width) =>
          setElements((prev) => prev.map((e) => (e.localId === id ? { ...e, width } : e)))
        }
        onDelete={(id) => setElements((prev) => prev.filter((e) => e.localId !== id))}
        onReorder={(ids) =>
          setElements((prev) => {
            const byId = new Map(prev.map((e) => [e.localId, e]));
            return ids.map((id) => byId.get(id)).filter((e): e is PendingElement => e != null);
          })
        }
      />
    </KeyboardAwareScrollView>
    </Screen>
    <AppKeyboardToolbar />
    </BottomSheetModalProvider>
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
  instructionsPhotoCount: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },

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
    marginBottom: spacing.sm,
  },
  addTilePressed: { backgroundColor: colors.primary100 },
  addTileText: { ...typography.bodySmall, color: colors.primary700, fontWeight: '600' },
});

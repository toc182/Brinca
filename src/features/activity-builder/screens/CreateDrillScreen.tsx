import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';

import { Input } from '@/shared/components/Input';
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
import { MarkCompleteDefaultCard } from '../components/MarkCompleteDefaultCard';

const CATEGORY_LABELS: Record<ElementCategory, string> = {
  counters: 'Counters',
  timers: 'Timers',
  selection: 'Selection',
  input: 'Input',
};

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

  const isValid = name.trim().length >= 1 && name.trim().length <= 50;

  const handleAddElement = (type: ElementType, label: string, config: Record<string, unknown>) => {
    setElements((prev) => [
      ...prev,
      { localId: randomUUID(), type, label, config },
    ]);
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
    if (!activityId || !isValid) return;
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

  const canSave = isValid && !isSubmitting;

  return (
    <>
    <ModalHeader
      title="New Drill"
      leftAction={{ icon: 'close', onPress: () => router.back(), accessibilityLabel: 'Cancel' }}
      rightAction={{ icon: 'check', onPress: handleSave, disabled: !canSave, accessibilityLabel: 'Save drill' }}
    />
    <Screen edges={['bottom']}>
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      bottomOffset={88}
    >
      <Input
        label="Drill name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Batting practice, Stretches"
        required
        error={name.length > 50 ? 'Name must be under 50 characters.' : undefined}
      />

      <DrillDescriptionEditor
        mode="create"
        description={description}
        onChangeDescription={setDescription}
        draftPhotoUris={descriptionPhotoUris}
        onChangeDraftPhotoUris={setDescriptionPhotoUris}
      />

      <View style={styles.section}>
        <MarkCompleteDefaultCard />
      </View>

      {elements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Added elements</Text>
          {elements.map((el) => (
            <View key={el.localId} style={styles.addedElement}>
              <Text style={styles.addedElementText}>{el.label}</Text>
              <Pressable onPress={() => handleRemoveElement(el.localId)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add tracking elements (optional)</Text>
        <Text style={styles.sectionSubtitle}>
          Add these only if you want to measure reps, time, or notes during the drill. Otherwise the drill just gets marked complete.
        </Text>

        {(Object.entries(ELEMENT_CATEGORIES) as [ElementCategory, readonly ElementType[]][]).map(
          ([category, types]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category]}</Text>
              <View style={styles.previewGrid}>
                {types.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setInfoElement(type)}
                    style={({ pressed }) => [styles.previewCard, pressed && styles.previewCardPressed]}
                    accessibilityLabel={`Learn more about ${ELEMENT_LABELS[type]}`}
                  >
                    <View style={styles.previewBox}><ElementPreview type={type} /></View>
                    <Text style={styles.previewLabel}>{ELEMENT_LABELS[type]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )
        )}
      </View>

    </KeyboardAwareScrollView>
    </Screen>
    <AppKeyboardToolbar />
    <ElementInfoModal
      type={infoElement}
      onDismiss={() => setInfoElement(null)}
      onAdd={(type, label, config) => {
        handleAddElement(type, label, config);
        setInfoElement(null);
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  section: { marginTop: spacing.lg },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.xs },
  sectionSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  categorySection: { marginBottom: spacing.md },
  categoryLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  previewCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  previewCardPressed: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  previewBox: {
    width: '100%',
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  addedElement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: colors.primary50,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  addedElementText: { ...typography.bodySmall, color: colors.textPrimary },
  removeText: { ...typography.caption, color: colors.error600 },
});

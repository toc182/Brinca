import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { insertDrill } from '../repositories/drill.repository';
import { insertElement } from '../repositories/tracking-element.repository';
import { activityBuilderKeys } from '../queries/keys';
import {
  ELEMENT_LABELS,
  ELEMENT_CATEGORIES,
  type ElementType,
  type ElementCategory,
} from '@/shared/tracking-elements/types/element-types';
import { getDefaultConfig } from '@/shared/tracking-elements/validation';

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
}

export function CreateDrillScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const queryClient = useQueryClient();
  const { showDestructiveAlert } = useDestructiveAlert();

  const [name, setName] = useState('');
  const [elements, setElements] = useState<PendingElement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length >= 2 && name.trim().length <= 50;

  const handleAddElement = (type: ElementType) => {
    setElements((prev) => [
      ...prev,
      { localId: randomUUID(), type, label: ELEMENT_LABELS[type] },
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
      await insertDrill(drillId, activityId, name.trim());

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const config = getDefaultConfig(el.type);
        await insertElement(randomUUID(), drillId, el.type, el.label, config);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        label="Drill name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Batting practice, Stretches"
        required
        error={name.length > 50 ? 'Name must be under 50 characters.' : undefined}
      />

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
        <Text style={styles.sectionTitle}>Add tracking elements</Text>
        <Text style={styles.sectionSubtitle}>
          Choose what to track during this drill. You can skip this and add them later.
        </Text>

        {(Object.entries(ELEMENT_CATEGORIES) as [ElementCategory, readonly ElementType[]][]).map(
          ([category, types]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category]}</Text>
              <View style={styles.chipRow}>
                {types.map((type) => (
                  <Pressable
                    key={type}
                    style={styles.chip}
                    onPress={() => handleAddElement(type)}
                  >
                    <Text style={styles.chipText}>+ {ELEMENT_LABELS[type]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )
        )}
      </View>

      <Button
        title="Save drill"
        onPress={handleSave}
        disabled={!isValid || isSubmitting}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  section: { marginTop: spacing.lg },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.xs },
  sectionSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  categorySection: { marginBottom: spacing.md },
  categoryLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  chipText: { ...typography.caption, color: colors.textPrimary },
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
  saveButton: { marginTop: spacing.xl },
});

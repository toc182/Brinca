import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useActiveChildStore } from '@/stores/active-child.store';
import { insertActivity } from '../repositories/activity.repository';
import { activityBuilderKeys } from '../queries/keys';

const ACTIVITY_ICONS = ['⚽', '🏀', '🎾', '⚾', '🏈', '🏊', '🤸', '🎯', '📚', '🎵', '🎨', '🏃', '🧘', '🏋️', '🤼', '🥊', '🎸', '🧩'];

const CATEGORIES = ['Sport', 'Therapy', 'Academic', 'Custom'] as const;

export function CreateActivityScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const childId = useActiveChildStore((s) => s.childId);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ACTIVITY_ICONS[0]);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length >= 1 && name.trim().length <= 50;

  const handleCreate = async () => {
    if (!childId || !isValid) return;
    setIsSubmitting(true);
    try {
      const id = randomUUID();
      await insertActivity(id, childId, name.trim(), icon, category);
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.activities(childId) });
      router.replace(`/(settings)/activities/${id}` as never);
    } catch {
      showToast('error', 'Could not create activity. Please try again.');
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
      <Text style={styles.title}>New activity</Text>

      <Text style={styles.sectionLabel}>Icon</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.iconRow}
      >
        {ACTIVITY_ICONS.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => setIcon(emoji)}
            style={[styles.iconChip, icon === emoji && styles.iconChipSelected]}
          >
            <Text style={styles.iconEmoji}>{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(category === cat ? undefined : cat)}
            style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
          >
            <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextSelected]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Activity name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Baseball, Therapy Exercises"
        required
        error={name.length > 50 ? 'Name must be under 50 characters.' : undefined}
      />

      <Button
        title="Create activity"
        onPress={handleCreate}
        disabled={!isValid || isSubmitting}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: { ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.lg },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconChipSelected: {
    backgroundColor: colors.primary100,
    borderColor: colors.primary500,
  },
  iconEmoji: { fontSize: 24 },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: colors.textOnPrimary,
  },
  button: { marginTop: spacing.lg },
});

import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, typography, spacing } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useActiveChildStore } from '@/stores/active-child.store';
import { insertActivity } from '../repositories/activity.repository';
import { activityBuilderKeys } from '../queries/keys';

export function CreateActivityScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const childId = useActiveChildStore((s) => s.childId);

  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length >= 2 && name.trim().length <= 50;

  const handleCreate = async () => {
    if (!childId || !isValid) return;
    setIsSubmitting(true);
    try {
      const id = randomUUID();
      await insertActivity(id, childId, name.trim());
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.activities(childId) });
      router.back();
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
  button: { marginTop: spacing.lg },
});

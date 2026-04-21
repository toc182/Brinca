import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, typography, spacing } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { insertDrill } from '../repositories/drill.repository';
import { activityBuilderKeys } from '../queries/keys';

export function CreateDrillScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length >= 2 && name.trim().length <= 50;

  const handleCreate = async () => {
    if (!activityId || !isValid) return;
    setIsSubmitting(true);
    try {
      const id = randomUUID();
      await insertDrill(id, activityId, name.trim());
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
      <Text style={styles.title}>New drill</Text>

      <Input
        label="Drill name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Batting practice, Stretches"
        required
        error={name.length > 50 ? 'Name must be under 50 characters.' : undefined}
      />

      <Button
        title="Save"
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

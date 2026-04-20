import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, typography, spacing } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useCreateActivityMutation } from '../mutations/useCreateActivityMutation';

export function OnboardingStep3Screen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const createActivity = useCreateActivityMutation();

  const [activityName, setActivityName] = useState('');

  const isValid = activityName.trim().length >= 2 && activityName.trim().length <= 50;

  const handleGetStarted = () => {
    if (!childId) return;

    createActivity.mutate(
      {
        data: { name: activityName.trim() },
        childId,
      },
      {
        onSuccess: () => {
          router.replace('/(tabs)/home');
        },
        onError: () => {
          showToast('error', 'error.generic');
        },
      }
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepLabel}>Step 3 of 3</Text>
      <Text style={styles.title}>What will you be practicing?</Text>
      <Text style={styles.subtitle}>
        You can configure drills and exercises after setup.
      </Text>

      <Input
        label="Activity name"
        value={activityName}
        onChangeText={setActivityName}
        placeholder="e.g. Baseball, Therapy Exercises, Multiplication"
        required
        error={
          activityName.length > 50
            ? 'Name must be under 50 characters.'
            : undefined
        }
      />

      <Button
        title="Get started"
        onPress={handleGetStarted}
        disabled={!isValid || createActivity.isPending}
        style={styles.getStartedButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  getStartedButton: {
    marginTop: spacing.lg,
  },
});

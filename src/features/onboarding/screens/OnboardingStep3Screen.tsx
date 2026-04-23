import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { colors, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useAuthContext } from '@/shared/contexts/AuthContext';
import { useCreateActivityMutation } from '../mutations/useCreateActivityMutation';
import { useOnboardingStore } from '@/stores/onboarding.store';

export function OnboardingStep3Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ childId?: string }>();
  const createActivity = useCreateActivityMutation();
  const { setAuthState } = useAuthContext();
  const store = useOnboardingStore();

  // childId comes from route params on first visit; falls back to store on resume
  const childId = params.childId ?? store.pendingChildId ?? '';

  const [activityName, setActivityName] = useState('');

  useEffect(() => {
    if (!childId) {
      showToast('error', 'Something went wrong. Please go back and try again.');
    }
    // Persist childId to store for resume
    if (params.childId && params.childId !== store.pendingChildId) {
      store.setPendingChildId(params.childId);
    }
  }, [childId]);

  const isValid =
    activityName.trim().length >= 1 && activityName.trim().length <= 50;

  const handleGetStarted = () => {
    if (!childId) {
      showToast('error', 'Something went wrong. Please go back and try again.');
      return;
    }

    createActivity.mutate(
      {
        data: { name: activityName.trim() },
        childId,
      },
      {
        onSuccess: () => {
          store.clearAll();
          setAuthState('authenticated');
        },
        onError: () => {
          showToast('error', 'Something went wrong. Please try again.');
        },
      }
    );
  };

  return (
    <Screen>
      <ScrollView
        style={styles.scrollView}
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
          maxLength={50}
          required
          error={
            activityName.length > 50
              ? 'Name must be under 50 characters.'
              : undefined
          }
        />

        {createActivity.isPending && (
          <ActivityIndicator
            color={colors.primary500}
            style={styles.spinner}
          />
        )}

        <Button
          title="Get started"
          onPress={handleGetStarted}
          disabled={!isValid || createActivity.isPending}
          style={styles.getStartedButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
  spinner: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  getStartedButton: {
    marginTop: spacing.lg,
  },
});

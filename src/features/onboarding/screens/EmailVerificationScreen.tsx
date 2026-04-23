import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Session } from '@supabase/supabase-js';

import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { colors, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { supabase } from '@/lib/supabase/client';
import { resendVerificationEmail } from '@/lib/supabase/auth';
import { useAuthContext } from '@/shared/contexts/AuthContext';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useCompleteAccountSetupMutation } from '../mutations/useCompleteAccountSetupMutation';
import type { PersonaType } from '@/types/domain.types';

const RESEND_COOLDOWN_SECONDS = 30;

export function EmailVerificationScreen() {
  const router = useRouter();
  const { setAuthState } = useAuthContext();
  const params = useLocalSearchParams<{
    email?: string;
    displayName?: string;
    personaType?: string;
  }>();

  const store = useOnboardingStore();
  const completeSetup = useCompleteAccountSetupMutation();

  // Route params take priority; fall back to persisted store values (cold-start resume)
  const email = params.email ?? store.pendingVerificationEmail ?? '';
  const displayName = params.displayName ?? store.step1Name;
  const personaType = (params.personaType ?? store.step1Persona ?? 'parent') as PersonaType;

  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const setupTriggered = useRef(false);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Listen for email verification — fires when user clicks the link and the
  // deep link returns them to the app (requires URL scheme config — see GitHub issue).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session && !setupTriggered.current) {
          setupTriggered.current = true;
          handleSetupComplete(session);
        }
      }
    );
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSetupComplete(session: Session) {
    completeSetup.mutate(
      {
        userId: session.user.id,
        displayName,
        personaType,
      },
      {
        onSuccess: ({ familyId }) => {
          store.setPendingVerificationEmail(null);
          store.setPendingFamilyId(familyId);
          setAuthState('onboarding-child');
          router.push({
            pathname: '/(auth)/onboarding/step-2',
            params: { familyId },
          });
        },
        onError: () => {
          setupTriggered.current = false; // allow retry
          showToast('error', 'Something went wrong. Please try again.');
        },
      }
    );
  }

  const handleResend = async () => {
    if (!email || countdown > 0 || resending) return;
    setResending(true);
    try {
      await resendVerificationEmail(email);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      showToast('success', 'Verification email sent.');
    } catch {
      showToast('error', 'Could not resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = () => {
    store.setPendingVerificationEmail(null);
    router.replace('/(auth)/onboarding/step-1');
  };

  const isPending = completeSetup.isPending || resending;

  return (
    <Screen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.message}>
          We sent a verification link to{' '}
          <Text style={styles.emailHighlight}>{email}</Text>.
          {'\n\n'}
          Check your inbox to continue.
        </Text>

        {completeSetup.isPending && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary500} />
            <Text style={styles.loadingText}>Setting up your account…</Text>
          </View>
        )}

        <Button
          title={
            countdown > 0
              ? `Resend email (${countdown}s)`
              : resending
              ? 'Sending…'
              : 'Resend email'
          }
          onPress={handleResend}
          variant="secondary"
          disabled={countdown > 0 || isPending}
          style={styles.resendButton}
        />

        <Button
          title="Change email"
          onPress={handleChangeEmail}
          variant="text"
          disabled={isPending}
          style={styles.changeEmailButton}
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 26,
  },
  emailHighlight: {
    ...typography.body,
    color: colors.textPrimary,
    fontFamily: 'Lexend_600SemiBold',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  resendButton: {
    marginBottom: spacing.sm,
  },
  changeEmailButton: {},
});

import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { colors, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { resendVerificationEmail } from '@/lib/supabase/auth';
import { useOnboardingStore } from '@/stores/onboarding.store';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Shown when a user taps an expired email verification link.
 * Navigation to this screen is handled by the deep-link redirect URL
 * (see GitHub issue: configure URL scheme for email verification redirects).
 */
export function ExpiredVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const store = useOnboardingStore();
  const email = params.email ?? store.pendingVerificationEmail ?? '';

  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email || countdown > 0 || resending) return;
    setResending(true);
    try {
      await resendVerificationEmail(email);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      showToast('success', 'Verification email sent. Check your inbox.');
      // Start countdown
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
      // Navigate back to the verification waiting screen
      router.replace({
        pathname: '/(auth)/onboarding/verify-email',
        params: { email },
      });
    } catch {
      showToast('error', 'Could not resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Link expired</Text>
        <Text style={styles.message}>
          This link has expired. Please request a new one.
        </Text>

        <Button
          title={resending ? 'Sending…' : 'Resend email'}
          onPress={handleResend}
          disabled={resending || countdown > 0}
          style={styles.resendButton}
        />

        <Button
          title="Back to sign in"
          onPress={() => router.replace('/(auth)/login')}
          variant="text"
          style={styles.backButton}
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
  },
  resendButton: {
    marginBottom: spacing.sm,
  },
  backButton: {},
});

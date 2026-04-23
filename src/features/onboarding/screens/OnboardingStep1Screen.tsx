import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { colors, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useCreateAccountMutation } from '../mutations/useCreateAccountMutation';
import { useAuthContext } from '@/shared/contexts/AuthContext';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { signInWithApple } from '@/lib/supabase/auth';
import type { PersonaType } from '@/types/domain.types';

// TODO: Replace with real URLs once published
const TOS_URL = 'https://brinca.app/terms';
const PRIVACY_URL = 'https://brinca.app/privacy';

const PERSONA_OPTIONS: { value: PersonaType; label: string }[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'coach', label: 'Coach' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'other', label: 'Other' },
];

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  {
    label: 'One special character',
    test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
  },
];

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function OnboardingStep1Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const createAccount = useCreateAccountMutation();
  const { setAuthState } = useAuthContext();
  const { isOnline } = useNetworkStatus();
  const store = useOnboardingStore();

  // Restore from store on mount (back-navigation or cold-start resume)
  const [email, setEmail] = useState(store.step1Email);
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(store.step1Name);
  const [personaType, setPersonaType] = useState<PersonaType | null>(
    store.step1Persona
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailFormatError, setEmailFormatError] = useState('');

  // Show offline toast once when going offline
  const wasOnline = useRef(true);
  useEffect(() => {
    if (wasOnline.current && !isOnline) {
      showToast(
        'warning',
        "You're offline. An internet connection is required to create your account."
      );
    }
    wasOnline.current = isOnline;
  }, [isOnline]);

  const allPasswordRulesMet = PASSWORD_RULES.every((rule) =>
    rule.test(password)
  );
  const isValid =
    isValidEmailFormat(email) &&
    allPasswordRulesMet &&
    displayName.trim().length >= 2 &&
    personaType !== null &&
    agreedToTerms &&
    isOnline;

  const handleEmailBlur = () => {
    if (email.length > 0 && !isValidEmailFormat(email)) {
      setEmailFormatError('Please enter a valid email address.');
    }
  };

  const handleEmailChange = (v: string) => {
    setEmail(v);
    setEmailError('');
    setEmailFormatError('');
    store.setStep1Data({ email: v });
  };

  const handleCreateAccount = () => {
    if (!personaType || !isOnline) return;
    setEmailError('');
    setEmailFormatError('');

    createAccount.mutate(
      {
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        personaType,
      },
      {
        onSuccess: () => {
          store.setPendingVerificationEmail(email.trim());
          store.setStep1Data({ name: displayName.trim(), persona: personaType });
          setAuthState('onboarding-verification');
          router.push({
            pathname: '/(auth)/onboarding/verify-email',
            params: {
              email: email.trim(),
              displayName: displayName.trim(),
              personaType,
            },
          });
        },
        onError: (error) => {
          const msg = error.message ?? '';
          if (
            msg.includes('already registered') ||
            msg.includes('already been registered')
          ) {
            setEmailError('An account with this email already exists.');
          } else {
            showToast('error', t('error.generic'));
          }
        },
      }
    );
  };

  const handleAppleSignIn = async () => {
    try {
      const result = await signInWithApple();
      if (!result.session) throw new Error('No session after Apple sign-in');
      // Social login goes directly to Step 2 (no email verification).
      // Account setup (profile/family) is handled by useCompleteAccountSetupMutation.
      // TODO: call useCompleteAccountSetupMutation here if this is a new user.
      // For now, set to onboarding-child so the router picks up the correct step.
      store.setPendingVerificationEmail(null);
      setAuthState('onboarding-child');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      // User cancelled — no toast needed
      if (msg.includes('ERR_CANCELED') || msg.includes('canceled')) return;
      showToast('error', 'Apple sign-in failed. Please try again.');
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: implement Google OAuth once Supabase provider is configured
    showToast('info', 'Google sign-in is coming soon.');
  };

  return (
    <Screen>
      <OfflineBanner />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* App logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>Brinca</Text>
          <Text style={styles.logoSubtitle}>Every day, a little leap</Text>
        </View>

        {/* Social login buttons */}
        <Button
          title="Sign in with Apple"
          onPress={handleAppleSignIn}
          variant="secondary"
          disabled={!isOnline}
          style={styles.socialButton}
        />
        <Button
          title="Sign in with Google"
          onPress={handleGoogleSignIn}
          variant="secondary"
          disabled={!isOnline}
          style={styles.socialButton}
        />

        {/* "or" divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={handleEmailChange}
          onBlur={handleEmailBlur}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={emailError || emailFormatError}
          required
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          required
        />

        {password.length > 0 && (
          <View style={styles.passwordRules}>
            {PASSWORD_RULES.map((rule) => (
              <Text
                key={rule.label}
                style={[
                  styles.passwordRule,
                  rule.test(password) && styles.passwordRuleMet,
                ]}
              >
                {rule.test(password) ? '✓' : '○'} {rule.label}
              </Text>
            ))}
          </View>
        )}

        <Input
          label="Your name"
          value={displayName}
          onChangeText={(v) => {
            setDisplayName(v);
            store.setStep1Data({ name: v });
          }}
          autoComplete="name"
          placeholder="How should we call you?"
          required
        />

        <Text style={styles.sectionLabel}>What best describes you?</Text>
        <View style={styles.personaPicker}>
          {PERSONA_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                setPersonaType(option.value);
                store.setStep1Data({ persona: option.value });
              }}
              style={[
                styles.personaChip,
                personaType === option.value && styles.personaChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.personaChipText,
                  personaType === option.value && styles.personaChipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          style={styles.termsRow}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text
              style={styles.termsLink}
              onPress={(e) => {
                e.stopPropagation();
                WebBrowser.openBrowserAsync(TOS_URL);
              }}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              style={styles.termsLink}
              onPress={(e) => {
                e.stopPropagation();
                WebBrowser.openBrowserAsync(PRIVACY_URL);
              }}
            >
              Privacy Policy
            </Text>
            . If I add a child to this account, I confirm I am that child's
            parent or legal guardian, or I have permission to record information
            about the child.
          </Text>
        </Pressable>

        {createAccount.isPending && (
          <ActivityIndicator
            color={colors.primary500}
            style={styles.spinner}
          />
        )}

        <Button
          title="Create account"
          onPress={handleCreateAccount}
          disabled={!isValid || createAccount.isPending}
          style={styles.submitButton}
        />

        {/* "Already have an account?" link */}
        <Button
          title="Already have an account? Sign in"
          onPress={() => router.replace('/(auth)/login')}
          variant="text"
          style={styles.signInLink}
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
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  logoText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 40,
    color: colors.primary500,
  },
  logoSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  socialButton: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderDefault,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
  },
  passwordRules: {
    marginBottom: spacing.sm,
    gap: spacing.xxs,
  },
  passwordRule: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  passwordRuleMet: {
    color: colors.success600,
  },
  sectionLabel: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  personaPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  personaChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  personaChipSelected: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  personaChipText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  personaChipTextSelected: {
    color: colors.primary700,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  checkmark: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  termsLink: {
    ...typography.caption,
    color: colors.primary500,
    textDecorationLine: 'underline',
  },
  spinner: {
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xs,
  },
  signInLink: {
    marginTop: spacing.sm,
  },
});

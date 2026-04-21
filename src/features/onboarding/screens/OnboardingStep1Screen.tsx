import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { colors, typography, spacing } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useCreateAccountMutation } from '../mutations/useCreateAccountMutation';
import { useAuthContext } from '@/shared/contexts/AuthContext';
import type { PersonaType } from '@/types/domain.types';

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
  { label: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function OnboardingStep1Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const createAccount = useCreateAccountMutation();
  const { setAuthState } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [personaType, setPersonaType] = useState<PersonaType | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emailError, setEmailError] = useState('');

  const allPasswordRulesMet = PASSWORD_RULES.every((rule) => rule.test(password));
  const isValid =
    email.includes('@') &&
    allPasswordRulesMet &&
    displayName.trim().length >= 2 &&
    personaType !== null &&
    agreedToTerms;

  const handleCreateAccount = () => {
    if (!personaType) return;
    setEmailError('');

    createAccount.mutate(
      {
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        personaType,
      },
      {
        onSuccess: ({ familyId }) => {
          setAuthState('onboarding-child');
          router.push({
            pathname: '/(auth)/onboarding/step-2',
            params: { familyId },
          });
        },
        onError: (error) => {
          const msg = error.message ?? '';
          if (msg.includes('already registered') || msg.includes('already been registered')) {
            setEmailError('An account with this email already exists.');
          } else {
            showToast('error', t('error.generic'));
          }
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
      <Text style={styles.stepLabel}>Step 1 of 3</Text>
      <Text style={styles.title}>Create your account</Text>

      <Input
        label="Email"
        value={email}
        onChangeText={(v) => { setEmail(v); setEmailError(''); }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={emailError}
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
        onChangeText={setDisplayName}
        autoComplete="name"
        placeholder="How should we call you?"
        required
      />

      <Text style={styles.sectionLabel}>What best describes you?</Text>
      <View style={styles.personaPicker}>
        {PERSONA_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setPersonaType(option.value)}
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
          I agree to the Terms of Service and Privacy Policy. If I add a child
          to this account, I confirm I am that child's parent or legal guardian,
          or I have permission to record information about the child.
        </Text>
      </Pressable>

      <Button
        title="Create account"
        onPress={handleCreateAccount}
        disabled={!isValid || createAccount.isPending}
        style={styles.submitButton}
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
    marginBottom: spacing.lg,
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
  submitButton: {
    marginTop: spacing.sm,
  },
});

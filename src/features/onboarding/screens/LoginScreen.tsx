import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { colors, typography, spacing } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useSignInMutation } from '../mutations/useSignInMutation';

export function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const signInMutation = useSignInMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isValid = email.includes('@') && password.length >= 8;

  const handleSignIn = () => {
    signInMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          router.replace('/(tabs)/home');
        },
        onError: (error) => {
          showToast('error', t('error.loginFailed'));
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
      <View style={styles.header}>
        <Text style={styles.title}>Brinca</Text>
        <Text style={styles.subtitle}>Every day, a little leap</Text>
      </View>

      <View style={styles.socialButtons}>
        <Button
          title="Sign in with Apple"
          onPress={() => {}}
          variant="secondary"
          style={styles.socialButton}
        />
        <Button
          title="Coming soon: Google"
          onPress={() => {}}
          variant="ghost"
          disabled
          style={styles.socialButton}
        />
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="you@example.com"
      />

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="Enter your password"
      />

      <Button
        title="Sign in"
        onPress={handleSignIn}
        disabled={!isValid || signInMutation.isPending}
        style={styles.signInButton}
      />

      <Button
        title="Create account"
        onPress={() => router.push('/(auth)/onboarding/step-1')}
        variant="text"
        style={styles.createAccountButton}
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
    paddingTop: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 40,
    color: colors.primary500,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  socialButtons: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  socialButton: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  signInButton: {
    marginTop: spacing.sm,
  },
  createAccountButton: {
    marginTop: spacing.sm,
  },
});

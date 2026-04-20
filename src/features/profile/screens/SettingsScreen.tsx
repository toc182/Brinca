import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { signOut } from '@/lib/supabase/auth';
import { colors, typography, spacing, radii } from '@/shared/theme';

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingsRow({
  label,
  onPress,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Text style={[styles.rowLabel, variant === 'destructive' && styles.rowLabelDestructive]}>
        {label}
      </Text>
      <Text style={styles.rowChevron}>{'>'}</Text>
    </Pressable>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const childName = useActiveChildStore((s) => s.childName);
  const { showDestructiveAlert } = useDestructiveAlert();

  const handleLogout = useCallback(() => {
    showDestructiveAlert({
      title: 'Log out',
      message: 'Are you sure you want to log out? Any unsynced data will remain on your device.',
      destructiveLabel: 'Log out',
      onConfirm: async () => {
        await signOut();
        router.replace('/(auth)/login');
      },
    });
  }, [showDestructiveAlert, router]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader title="Account" />
      <View style={styles.section}>
        <SettingsRow
          label="Accounts Center"
          onPress={() => router.push('/(settings)/accounts-center')}
        />
      </View>

      <SectionHeader title="Activities" />
      <View style={styles.section}>
        <SettingsRow
          label="Manage Activities"
          onPress={() => router.push('/(settings)/activities')}
        />
      </View>

      <SectionHeader title={childName ? `${childName}'s Profile` : 'Child'} />
      <View style={styles.section}>
        <SettingsRow
          label="Edit Profile"
          onPress={() => router.push('/(settings)/child/edit-profile')}
        />
        <View style={styles.separator} />
        <SettingsRow
          label="Measurements"
          onPress={() => router.push('/(settings)/child/measurements')}
        />
        <View style={styles.separator} />
        <SettingsRow
          label="External Activities"
          onPress={() => router.push('/(settings)/child/external-activities')}
        />
      </View>

      <SectionHeader title="App" />
      <View style={styles.section}>
        <SettingsRow label="Help" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsRow label="Privacy Policy" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsRow label="About" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsRow label="Log out" onPress={handleLogout} variant="destructive" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
  sectionHeader: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.xxs,
    paddingHorizontal: spacing.xxs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  rowPressed: {
    backgroundColor: colors.primary50,
  },
  rowLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  rowLabelDestructive: {
    color: colors.error500,
  },
  rowChevron: {
    ...typography.bodySmall,
    color: colors.textPlaceholder,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.md,
  },
});

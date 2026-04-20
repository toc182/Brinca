import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Switch } from 'react-native';

import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { colors, typography, spacing, radii } from '@/shared/theme';

import { useDeleteAccountMutation } from '../mutations/useDeleteAccountMutation';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function AccountsCenterScreen() {
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);
  const setMeasurementUnit = useUIPreferencesStore((s) => s.setMeasurementUnit);
  const { showDestructiveAlert } = useDestructiveAlert();
  const deleteAccountMutation = useDeleteAccountMutation();

  const [displayName] = useState('Parent');
  const [email] = useState('');

  const handleToggleMeasurementUnit = useCallback(
    (useImperial: boolean) => {
      setMeasurementUnit(useImperial ? 'imperial' : 'metric');
    },
    [setMeasurementUnit]
  );

  const handleDeleteAccount = useCallback(() => {
    showDestructiveAlert({
      title: 'Delete account',
      message:
        'This will permanently delete your account, all children profiles, and all data. This cannot be undone.',
      destructiveLabel: 'Delete my account',
      onConfirm: () => {
        showDestructiveAlert({
          title: 'Are you absolutely sure?',
          message: 'All your data will be permanently lost. This action cannot be reversed.',
          destructiveLabel: 'Yes, delete everything',
          onConfirm: () => {
            deleteAccountMutation.mutate();
          },
        });
      },
    });
  }, [showDestructiveAlert, deleteAccountMutation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Profile</Text>
      <Card style={styles.card}>
        <InfoRow label="Display name" value={displayName} />
        <View style={styles.cardSeparator} />
        <InfoRow label="Email" value={email || 'Not set'} />
      </Card>

      <Text style={styles.sectionTitle}>Family Settings</Text>
      <Card style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Use imperial units</Text>
            <Text style={styles.toggleDescription}>
              {measurementUnit === 'imperial' ? 'lbs, ft/in' : 'kg, cm'}
            </Text>
          </View>
          <Switch
            value={measurementUnit === 'imperial'}
            onValueChange={handleToggleMeasurementUnit}
            trackColor={{ false: colors.borderDefault, true: colors.primary100 }}
            thumbColor={measurementUnit === 'imperial' ? colors.primary500 : colors.surface}
          />
        </View>
        <View style={styles.cardSeparator} />
        <View style={styles.memberPlaceholder}>
          <Text style={styles.memberLabel}>Family members</Text>
          <Text style={styles.memberSubtext}>
            Invite family members to collaborate on your children's profiles.
          </Text>
          <Text style={styles.comingSoon}>Coming soon</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Danger Zone</Text>
      <Card style={styles.dangerCard}>
        <Text style={styles.dangerDescription}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </Text>
        <Button
          title="Delete my account"
          variant="destructive"
          size="small"
          onPress={handleDeleteAccount}
          disabled={deleteAccountMutation.isPending}
        />
      </Card>
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
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xxs,
  },
  card: {
    gap: 0,
  },
  cardSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
  },
  toggleInfo: {
    flex: 1,
    gap: spacing.xxxs,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
  },
  toggleDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  memberPlaceholder: {
    paddingVertical: spacing.xxs,
    gap: spacing.xxs,
  },
  memberLabel: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
  },
  memberSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  comingSoon: {
    ...typography.captionSmall,
    color: colors.textPlaceholder,
    fontStyle: 'italic',
  },
  dangerCard: {
    gap: spacing.sm,
    borderColor: colors.error50,
  },
  dangerDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

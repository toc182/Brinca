import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/shared/components/Button';
import { colors, radii, shadows, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { useTierRewardsQuery } from '../queries/useTierRewardsQuery';
import { useDeleteTierRewardMutation } from '../mutations/useDeleteTierRewardMutation';
import { activityBuilderKeys } from '../queries/keys';
import { TierRewardBottomSheet, type ConditionItem } from './TierRewardBottomSheet';

interface TierRewardRow {
  id: string;
  name: string;
  conditions: string;
  currency_amount: number;
  display_order: number;
}

interface TierRewardSectionProps {
  parentType: 'activity' | 'drill';
  parentId: string;
  conditionItems: ConditionItem[];
}

export function TierRewardSection({
  parentType,
  parentId,
  conditionItems,
}: TierRewardSectionProps) {
  const queryClient = useQueryClient();
  const { showDestructiveAlert } = useDestructiveAlert();
  const deleteTierMutation = useDeleteTierRewardMutation();

  const [sheetTier, setSheetTier] = useState<TierRewardRow | null | undefined>(undefined);
  // undefined = sheet closed, null = adding new, TierRewardRow = editing existing

  const { data: tiers } = useTierRewardsQuery(parentType, parentId);

  const handleSaved = () => {
    queryClient.invalidateQueries({
      queryKey: activityBuilderKeys.tierRewards(parentType, parentId),
    });
    setSheetTier(undefined);
  };

  const handleDelete = (tier: TierRewardRow) => {
    showDestructiveAlert({
      title: 'Delete tier',
      message: `Delete "${tier.name}"? This cannot be undone.`,
      onConfirm: () => {
        deleteTierMutation.mutate(
          { id: tier.id, parentType, parentId },
          {
            onError: () => {
              showToast('error', 'Could not delete tier.');
            },
          },
        );
      },
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tier Rewards</Text>

      {!tiers?.length && (
        <Text style={styles.empty}>No tiers configured. Add a tier to reward performance.</Text>
      )}

      {tiers?.map((tier) => (
        <Pressable
          key={tier.id}
          onPress={() => setSheetTier(tier)}
          onLongPress={() => handleDelete(tier)}
          style={styles.tierRow}
        >
          <View style={styles.tierInfo}>
            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={styles.tierAmount}>{tier.currency_amount} coins</Text>
          </View>
          <Text style={styles.tierChevron}>›</Text>
        </Pressable>
      ))}

      <Button
        title="Add tier"
        onPress={() => setSheetTier(null)}
        variant="secondary"
        size="small"
        style={styles.addButton}
      />

      {sheetTier !== undefined && (
        <TierRewardBottomSheet
          parentType={parentType}
          parentId={parentId}
          tierRow={sheetTier ?? undefined}
          conditionItems={conditionItems}
          onDismiss={() => setSheetTier(undefined)}
          onSaved={handleSaved}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    ...shadows.sm,
  },
  tierInfo: { flex: 1 },
  tierName: { ...typography.bodySmall, color: colors.textPrimary },
  tierAmount: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  tierChevron: { ...typography.body, color: colors.textSecondary },
  addButton: { alignSelf: 'flex-start' },
});

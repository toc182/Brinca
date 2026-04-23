import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/shared/components/Button';
import { colors, radii, shadows, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { getBonusPresets, deleteBonusPreset } from '../repositories/bonus-preset.repository';
import { activityBuilderKeys } from '../queries/keys';
import { BonusPresetBottomSheet } from './BonusPresetBottomSheet';

interface BonusPresetRow {
  id: string;
  amount: number;
  display_order: number;
}

interface BonusPresetSectionProps {
  parentType: 'activity' | 'drill';
  parentId: string;
}

export function BonusPresetSection({ parentType, parentId }: BonusPresetSectionProps) {
  const queryClient = useQueryClient();
  const { showDestructiveAlert } = useDestructiveAlert();

  const [sheetPreset, setSheetPreset] = useState<BonusPresetRow | null | undefined>(undefined);
  // undefined = sheet closed, null = adding new, BonusPresetRow = editing existing

  const { data: presets } = useQuery({
    queryKey: activityBuilderKeys.bonusPresets(parentType, parentId),
    queryFn: () => getBonusPresets(parentType, parentId),
    enabled: !!parentId,
  });

  const handleSaved = () => {
    queryClient.invalidateQueries({
      queryKey: activityBuilderKeys.bonusPresets(parentType, parentId),
    });
    setSheetPreset(undefined);
  };

  const handleDelete = (preset: BonusPresetRow) => {
    showDestructiveAlert({
      title: 'Delete bonus preset',
      message: `Delete the ${preset.amount}-coin bonus preset? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteBonusPreset(preset.id);
          queryClient.invalidateQueries({
            queryKey: activityBuilderKeys.bonusPresets(parentType, parentId),
          });
        } catch {
          showToast('error', 'Could not delete bonus preset.');
        }
      },
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bonus Presets</Text>

      {!presets?.length && (
        <Text style={styles.empty}>
          No bonus presets. Add preset amounts for quick bonus rewards during sessions.
        </Text>
      )}

      <View style={styles.chipsRow}>
        {presets?.map((preset) => (
          <Pressable
            key={preset.id}
            onPress={() => setSheetPreset(preset)}
            onLongPress={() => handleDelete(preset)}
            style={styles.presetChip}
          >
            <Text style={styles.presetAmount}>{preset.amount}</Text>
            <Text style={styles.presetCoin}>coins</Text>
          </Pressable>
        ))}
      </View>

      <Button
        title="Add bonus preset"
        onPress={() => setSheetPreset(null)}
        variant="secondary"
        size="small"
        style={styles.addButton}
      />

      {sheetPreset !== undefined && (
        <BonusPresetBottomSheet
          parentType={parentType}
          parentId={parentId}
          presetRow={sheetPreset ?? undefined}
          onDismiss={() => setSheetPreset(undefined)}
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetChip: {
    backgroundColor: colors.secondary50,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  presetAmount: {
    ...typography.titleSmall,
    color: colors.secondary500,
  },
  presetCoin: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  addButton: { alignSelf: 'flex-start' },
});

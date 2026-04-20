import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { ChecklistConfig } from '@/shared/tracking-elements/types/element-configs';
import type { ChecklistValue } from '@/shared/tracking-elements/types/element-values';

interface ChecklistElementProps {
  value: ChecklistValue;
  onValueChange: (value: ChecklistValue) => void;
  config: ChecklistConfig;
}

export function ChecklistElement({ value, onValueChange, config }: ChecklistElementProps) {
  const checkedCount = value.items.filter((i) => i.checked).length;
  const hasTarget = config.targetItemsCompleted != null;
  const isAtTarget = hasTarget && checkedCount >= config.targetItemsCompleted!;

  const toggle = (itemId: string) => {
    const newItems = value.items.map((item) =>
      item.item_id === itemId ? { ...item, checked: !item.checked } : item,
    );
    onValueChange({ items: newItems });
  };

  return (
    <View style={styles.container}>
      {hasTarget && (
        <Text style={[styles.progress, isAtTarget && styles.progressDone]}>
          {checkedCount} / {config.targetItemsCompleted} completed
        </Text>
      )}

      {config.items.map((configItem) => {
        const itemValue = value.items.find((v) => v.item_id === configItem.id);
        const isChecked = itemValue?.checked ?? false;
        return (
          <Pressable
            key={configItem.id}
            onPress={() => toggle(configItem.id)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && <Text style={styles.checkmark}>&#10003;</Text>}
            </View>
            <Text style={[styles.label, isChecked && styles.labelChecked]}>
              {configItem.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  progress: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  progressDone: {
    color: colors.success500,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    minHeight: touchTargets.adult,
  },
  rowPressed: {
    backgroundColor: colors.primary50,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  checkmark: {
    ...typography.caption,
    color: colors.textOnPrimary,
    marginTop: -1,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  labelChecked: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});

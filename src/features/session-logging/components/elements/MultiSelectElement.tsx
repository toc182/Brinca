import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'phosphor-react-native';

import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { MultiSelectConfig } from '@/shared/tracking-elements/types/element-configs';
import type { MultiSelectValue } from '@/shared/tracking-elements/types/element-values';

interface MultiSelectElementProps {
  value: MultiSelectValue;
  onValueChange: (value: MultiSelectValue) => void;
  config: MultiSelectConfig;
}

export function MultiSelectElement({ value, onValueChange, config }: MultiSelectElementProps) {
  const toggle = (optionId: string) => {
    const isSelected = value.selected.includes(optionId);
    const newSelected = isSelected
      ? value.selected.filter((id) => id !== optionId)
      : [...value.selected, optionId];
    onValueChange({ selected: newSelected });
  };

  return (
    <View style={styles.container}>
      {config.options.map((option) => {
        const isSelected = value.selected.includes(option.id);
        return (
          <Pressable
            key={option.id}
            onPress={() => toggle(option.id)}
            style={({ pressed }) => [
              styles.row,
              isSelected && styles.rowSelected,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Check size={16} color={colors.textOnPrimary} weight="bold" />}
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.name}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minHeight: touchTargets.adult,
  },
  rowSelected: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  rowPressed: {
    opacity: 0.8,
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
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  labelSelected: {
    color: colors.primary700,
  },
});

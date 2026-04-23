import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { SingleSelectConfig } from '@/shared/tracking-elements/types/element-configs';
import type { SingleSelectValue } from '@/shared/tracking-elements/types/element-values';

interface SingleSelectElementProps {
  value: SingleSelectValue;
  onValueChange: (value: SingleSelectValue) => void;
  config: SingleSelectConfig;
}

export function SingleSelectElement({ value, onValueChange, config }: SingleSelectElementProps) {
  const select = (optionId: string) => {
    // Tap selected option to deselect
    if (value.selected === optionId) {
      onValueChange({ selected: null });
    } else {
      onValueChange({ selected: optionId });
    }
  };

  return (
    <View style={styles.container}>
      {config.options.map((option) => {
        const isSelected = value.selected === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => select(option.id)}
            style={({ pressed }) => [
              styles.row,
              isSelected && styles.rowSelected,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && <View style={styles.radioDot} />}
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
  radio: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioSelected: {
    borderColor: colors.primary500,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    backgroundColor: colors.primary500,
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

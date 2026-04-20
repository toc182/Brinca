import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { NumberInputConfig } from '@/shared/tracking-elements/types/element-configs';
import type { NumberInputValue } from '@/shared/tracking-elements/types/element-values';

interface NumberInputElementProps {
  value: NumberInputValue;
  onValueChange: (value: NumberInputValue) => void;
  config: NumberInputConfig;
}

export function NumberInputElement({ value, onValueChange, config }: NumberInputElementProps) {
  const displayValue = value.value != null ? String(value.value) : '';
  const hasTarget = config.targetValue != null;
  const isAtTarget = hasTarget && value.value != null && value.value >= config.targetValue!;

  const handleChange = (text: string) => {
    if (text === '') {
      onValueChange({ value: null });
      return;
    }
    const parsed = parseFloat(text);
    if (isNaN(parsed)) return;

    // Clamp to min/max if configured
    let clamped = parsed;
    if (config.minValue != null && clamped < config.minValue) clamped = config.minValue;
    if (config.maxValue != null && clamped > config.maxValue) clamped = config.maxValue;

    onValueChange({ value: clamped });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, isAtTarget && styles.inputAtTarget]}
          value={displayValue}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textPlaceholder}
        />
        {config.unit && (
          <Text style={styles.unit}>{config.unit}</Text>
        )}
      </View>

      {hasTarget && (
        <Text style={[styles.target, isAtTarget && styles.targetReached]}>
          Target: {config.targetValue} {config.unit ?? ''}
        </Text>
      )}

      {(config.minValue != null || config.maxValue != null) && (
        <Text style={styles.range}>
          {config.minValue != null ? `Min: ${config.minValue}` : ''}
          {config.minValue != null && config.maxValue != null ? '  ·  ' : ''}
          {config.maxValue != null ? `Max: ${config.maxValue}` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  input: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.borderDefault,
    minWidth: 100,
    paddingVertical: spacing.xs,
    padding: 0,
  },
  inputAtTarget: {
    borderBottomColor: colors.success500,
    color: colors.success500,
  },
  unit: {
    ...typography.body,
    color: colors.textSecondary,
  },
  target: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  targetReached: {
    color: colors.success500,
  },
  range: {
    ...typography.captionSmall,
    color: colors.textPlaceholder,
  },
});

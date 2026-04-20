import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { RatingScaleConfig } from '@/shared/tracking-elements/types/element-configs';
import type { RatingScaleValue } from '@/shared/tracking-elements/types/element-values';

interface RatingScaleElementProps {
  value: RatingScaleValue;
  onValueChange: (value: RatingScaleValue) => void;
  config: RatingScaleConfig;
}

export function RatingScaleElement({ value, onValueChange, config }: RatingScaleElementProps) {
  const range: number[] = [];
  for (let i = config.minValue; i <= config.maxValue; i++) {
    range.push(i);
  }

  const select = (n: number) => {
    // Toggle off if re-tapped
    onValueChange({ value: value.value === n ? null : n });
  };

  return (
    <View style={styles.container}>
      {/* Labels row */}
      {(config.lowLabel || config.highLabel) && (
        <View style={styles.labelsRow}>
          <Text style={styles.endLabel}>{config.lowLabel ?? ''}</Text>
          <Text style={styles.endLabel}>{config.highLabel ?? ''}</Text>
        </View>
      )}

      {/* Buttons row */}
      <View style={styles.row}>
        {range.map((n) => {
          const isSelected = value.value === n;
          return (
            <Pressable
              key={n}
              onPress={() => select(n)}
              style={({ pressed }) => [
                styles.cell,
                isSelected && styles.cellSelected,
                pressed && styles.cellPressed,
              ]}
            >
              <Text style={[styles.cellText, isSelected && styles.cellTextSelected]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxs,
  },
  endLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxs,
    flexWrap: 'wrap',
  },
  cell: {
    minWidth: touchTargets.adult,
    minHeight: touchTargets.adult,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
  },
  cellSelected: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  cellPressed: {
    opacity: 0.7,
  },
  cellText: {
    ...typography.buttonSmall,
    color: colors.textPrimary,
  },
  cellTextSelected: {
    color: colors.textOnPrimary,
  },
});

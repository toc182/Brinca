import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

const PILL_SIZE = 28;
const COUNT_FONT_SIZE = 22;
const STEP_DOT = 12;

export function CounterPreview() {
  return (
    <View style={s.row}>
      <View style={[s.pill, s.pillMinus]}>
        <Text style={s.pillText}>−</Text>
      </View>
      <Text style={s.count}>3</Text>
      <View style={[s.pill, s.pillPlus]}>
        <Text style={s.pillTextOnPrimary}>+</Text>
      </View>
    </View>
  );
}

export function CombinedCounterPreview() {
  return (
    <View style={s.row}>
      <View style={[s.pill, s.pillMinus]}>
        <Text style={s.pillText}>−</Text>
      </View>
      <View style={s.editableContainer}>
        <Text style={s.count}>12</Text>
        <View style={s.editableUnderline} />
      </View>
      <View style={[s.pill, s.pillPlus]}>
        <Text style={s.pillTextOnPrimary}>+</Text>
      </View>
    </View>
  );
}

export function SplitCounterPreview() {
  return (
    <View style={s.splitRow}>
      <View style={s.splitSide}>
        <Text style={s.splitLabel}>L</Text>
        <View style={s.miniRow}>
          <View style={s.miniDot} />
          <Text style={s.splitCount}>2</Text>
          <View style={[s.miniDot, s.miniDotPlus]} />
        </View>
      </View>
      <View style={s.splitDivider} />
      <View style={s.splitSide}>
        <Text style={s.splitLabel}>R</Text>
        <View style={s.miniRow}>
          <View style={s.miniDot} />
          <Text style={s.splitCount}>3</Text>
          <View style={[s.miniDot, s.miniDotPlus]} />
        </View>
      </View>
    </View>
  );
}

export function MultistepCounterPreview() {
  return (
    <View style={s.stepRow}>
      <View style={[s.step, s.stepDone]} />
      <View style={[s.step, s.stepDone]} />
      <View style={[s.step, s.stepActive]} />
      <View style={s.step} />
      <View style={s.step} />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pill: {
    width: PILL_SIZE,
    height: PILL_SIZE,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillMinus: { backgroundColor: colors.primary50 },
  pillPlus: { backgroundColor: colors.primary500 },
  pillText: {
    ...typography.titleSmall,
    color: colors.primary700,
  },
  pillTextOnPrimary: {
    ...typography.titleSmall,
    color: colors.textOnPrimary,
  },
  count: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: COUNT_FONT_SIZE,
    color: colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },

  // Combined counter — count is editable
  editableContainer: {
    alignItems: 'center',
  },
  editableUnderline: {
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary500,
    marginTop: 2,
  },

  // Split counter — two side-by-side mini counters
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  splitSide: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  splitLabel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  miniDot: {
    width: 14,
    height: 14,
    borderRadius: radii.full,
    backgroundColor: colors.primary50,
  },
  miniDotPlus: {
    backgroundColor: colors.primary500,
  },
  splitCount: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    minWidth: 14,
    textAlign: 'center',
  },
  splitDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderSubtle,
  },

  // Multistep counter — row of step indicators
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  step: {
    width: STEP_DOT,
    height: STEP_DOT,
    borderRadius: radii.full,
    backgroundColor: colors.borderSubtle,
  },
  stepDone: {
    backgroundColor: colors.primary500,
  },
  stepActive: {
    backgroundColor: colors.primary500,
    borderWidth: 2,
    borderColor: colors.primary100,
  },
});

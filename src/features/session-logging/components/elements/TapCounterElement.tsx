import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors, typography, spacing, radii } from '@/shared/theme';
import type { TapCounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { TapCounterValue } from '@/shared/tracking-elements/types/element-values';

interface TapCounterElementProps {
  value: TapCounterValue;
  onValueChange: (value: TapCounterValue) => void;
  config: TapCounterConfig;
}

/** Light tick when adding, a firmer tap when removing, so they feel distinct. */
function bumpHaptic(direction: 1 | -1) {
  void Haptics.impactAsync(
    direction > 0 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
  );
}

/**
 * Tap Counter — the whole card is one big +1 target; press-and-hold removes one.
 * No visible buttons, so it stays large and easy for a kid to hit mid-activity.
 */
export function TapCounterElement({ value, onValueChange, config }: TapCounterElementProps) {
  const count = value.count;
  const hasTarget = config.target != null;
  const isAtTarget = hasTarget && count >= config.target!;

  return (
    <Pressable
      onPress={() => {
        bumpHaptic(1);
        onValueChange({ count: count + 1 });
      }}
      onLongPress={() => {
        if (count > 0) {
          bumpHaptic(-1);
          onValueChange({ count: count - 1 });
        }
      }}
      delayLongPress={350}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityLabel="Tap to add one, hold to remove one"
    >
      <Text style={[styles.bigNum, isAtTarget && styles.atTarget]}>{count}</Text>
      {hasTarget && <Text style={styles.sub}>of {config.target}</Text>}
      <Text style={styles.hint}>tap +1 · hold −1</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary100,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 124,
  },
  cardPressed: { backgroundColor: colors.primary50 },
  bigNum: { ...typography.counter, color: colors.textPrimary },
  atTarget: { color: colors.success500 },
  sub: { ...typography.caption, color: colors.textSecondary },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});

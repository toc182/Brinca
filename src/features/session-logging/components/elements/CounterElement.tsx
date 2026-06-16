import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'phosphor-react-native';

import { IconButton } from '@/shared/components/IconButton';
import { colors, typography, spacing } from '@/shared/theme';
import type { CounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { CounterValue } from '@/shared/tracking-elements/types/element-values';

interface CounterElementProps {
  value: CounterValue;
  onValueChange: (value: CounterValue) => void;
  config: CounterConfig;
}

/** Light tick when adding, a firmer tap when removing, so they feel distinct. */
function bumpHaptic(direction: 1 | -1) {
  void Haptics.impactAsync(
    direction > 0 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
  );
}

/** Counter — bold minus / number / plus row, built on the shared IconButton. */
export function CounterElement({ value, onValueChange, config }: CounterElementProps) {
  const count = value.count;
  const hasTarget = config.target != null;
  const isAtTarget = hasTarget && count >= config.target!;

  return (
    <View style={styles.row}>
      <IconButton
        icon={Minus}
        variant="outline"
        disabled={count === 0}
        onPress={() => {
          if (count > 0) {
            bumpHaptic(-1);
            onValueChange({ count: count - 1 });
          }
        }}
        accessibilityLabel="Remove one"
      />
      <View style={styles.numWrap}>
        <Text style={[styles.bigNum, isAtTarget && styles.atTarget]}>{count}</Text>
        {hasTarget && <Text style={styles.sub}>of {config.target}</Text>}
      </View>
      <IconButton
        icon={Plus}
        variant="filled"
        onPress={() => {
          bumpHaptic(1);
          onValueChange({ count: count + 1 });
        }}
        accessibilityLabel="Add one"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  numWrap: { alignItems: 'center', minWidth: 80 },
  bigNum: { ...typography.counter, color: colors.textPrimary },
  atTarget: { color: colors.success500 },
  sub: { ...typography.caption, color: colors.textSecondary },
});

import { StyleSheet, Text, View } from 'react-native';

import { colors, typography, spacing } from '@/shared/theme';
import type { TapCounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { TapCounterValue } from '@/shared/tracking-elements/types/element-values';

interface TapCounterElementProps {
  value: TapCounterValue;
  onValueChange: (value: TapCounterValue) => void;
  config: TapCounterConfig;
}

/**
 * Tap Counter — display only: the name (from ElementCard), the count, and the
 * optional "of N" goal. The whole card is the tap target (tap = +1, hold = −1);
 * that press logic lives on the ElementCard in DrillScreen, so there are no
 * inner buttons or card here — one tappable surface, name + number.
 */
export function TapCounterElement({ value, config }: TapCounterElementProps) {
  const count = value.count;
  const hasTarget = config.target != null;
  const isAtTarget = hasTarget && count >= config.target!;

  return (
    <View style={styles.body}>
      <Text
        style={[styles.num, isAtTarget && styles.atTarget]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {count}
      </Text>
      {hasTarget && (
        <Text style={styles.sub} numberOfLines={1}>of {config.target}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Centered in a fixed min height that matches the regular counter, so a half
  // tap counter and a half counter line up in the same row with no blank space.
  body: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  // alignSelf: 'stretch' gives the number the card's content width so
  // adjustsFontSizeToFit can shrink a wide count at half width.
  num: { ...typography.counter, color: colors.textPrimary, textAlign: 'center', alignSelf: 'stretch' },
  atTarget: { color: colors.success500 },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxxs },
});

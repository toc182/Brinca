import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'phosphor-react-native';

import { IconButton } from '@/shared/components/IconButton';
import { colors, typography, spacing, touchTargets } from '@/shared/theme';
import type { SplitCounterConfig } from '@/shared/tracking-elements/types/element-configs';
import type { SplitCounterValue } from '@/shared/tracking-elements/types/element-values';

interface SplitCounterElementProps {
  value: SplitCounterValue;
  onValueChange: (value: SplitCounterValue) => void;
  config: SplitCounterConfig;
}

const DIVIDER_W = 1;
const DIVIDER_MARGIN = spacing.xs; // each side of the divider
const ROW_GAP = spacing.xs; // between a button and the number
const NUM_MIN = 36; // space the number keeps between the two buttons
const MAX_BTN = touchTargets.adult; // 48
const MIN_BTN = 34;

export function SplitCounterElement({ value, onValueChange, config }: SplitCounterElementProps) {
  const [containerW, setContainerW] = useState(0);

  const leftAtTarget = config.targetLeft != null && value.left >= config.targetLeft;
  const rightAtTarget = config.targetRight != null && value.right >= config.targetRight;

  // Each side gets half the width left after the divider. Size the −/+ buttons
  // so the row fits even in the narrow configure-modal preview; the number
  // flexes into the middle (and shrinks its font) so it never pushes the
  // buttons past the edge.
  const sideW = containerW > 0 ? (containerW - DIVIDER_W - DIVIDER_MARGIN * 2) / 2 : 0;
  const buttonSize =
    sideW > 0
      ? Math.round(Math.max(MIN_BTN, Math.min(MAX_BTN, (sideW - NUM_MIN - ROW_GAP * 2) / 2)))
      : MAX_BTN;

  return (
    <View style={styles.container} onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}>
      {/* Left counter */}
      <View style={styles.side}>
        <Text style={styles.label} numberOfLines={1}>{config.leftLabel}</Text>
        <View style={styles.row}>
          <IconButton
            icon={Minus}
            variant="outline"
            size={buttonSize}
            disabled={value.left === 0}
            onPress={() => value.left > 0 && onValueChange({ ...value, left: value.left - 1 })}
            accessibilityLabel={`Remove one from ${config.leftLabel}`}
          />
          <Text
            style={[styles.count, leftAtTarget && styles.countAtTarget]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value.left}
          </Text>
          <IconButton
            icon={Plus}
            variant="filled"
            size={buttonSize}
            onPress={() => onValueChange({ ...value, left: value.left + 1 })}
            accessibilityLabel={`Add one to ${config.leftLabel}`}
          />
        </View>
        {config.targetLeft != null && (
          <Text style={styles.target}>/ {config.targetLeft}</Text>
        )}
      </View>

      <View style={styles.divider} />

      {/* Right counter */}
      <View style={styles.side}>
        <Text style={styles.label} numberOfLines={1}>{config.rightLabel}</Text>
        <View style={styles.row}>
          <IconButton
            icon={Minus}
            variant="outline"
            size={buttonSize}
            disabled={value.right === 0}
            onPress={() => value.right > 0 && onValueChange({ ...value, right: value.right - 1 })}
            accessibilityLabel={`Remove one from ${config.rightLabel}`}
          />
          <Text
            style={[styles.count, rightAtTarget && styles.countAtTarget]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value.right}
          </Text>
          <IconButton
            icon={Plus}
            variant="filled"
            size={buttonSize}
            onPress={() => onValueChange({ ...value, right: value.right + 1 })}
            accessibilityLabel={`Add one to ${config.rightLabel}`}
          />
        </View>
        {config.targetRight != null && (
          <Text style={styles.target}>/ {config.targetRight}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // paddingBottom keeps the right side's + button clear of the card's
  // bottom-right target-met ribbon (TargetMetRibbon), which would otherwise
  // graze it.
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: spacing.lg,
  },
  side: { flex: 1, alignItems: 'center', gap: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  divider: { width: DIVIDER_W, backgroundColor: colors.borderSubtle, alignSelf: 'stretch', marginHorizontal: DIVIDER_MARGIN },
  count: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: ROW_GAP,
  },
  countAtTarget: { color: colors.success500 },
  target: { ...typography.caption, color: colors.textSecondary },
});

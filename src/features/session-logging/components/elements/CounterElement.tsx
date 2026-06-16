import { useState } from 'react';
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

// At or above this measured width the counter renders its full-width layout;
// below it, the separate compact layout. The two share no styling.
const FULL_WIDTH_MIN = 240;

/** Light tick when adding, a firmer tap when removing, so they feel distinct. */
function bumpHaptic(direction: 1 | -1) {
  void Haptics.impactAsync(
    direction > 0 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
  );
}

/**
 * Counter. Measures its width and renders one of two fully independent layouts:
 * CounterWide (lots of room) or CounterCompact (half width). They are separate
 * components with separate styles — neither reuses the other's rules.
 */
export function CounterElement(props: CounterElementProps) {
  const [width, setWidth] = useState(0);
  const useCompact = width > 0 && width < FULL_WIDTH_MIN;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {useCompact ? <CounterCompact {...props} width={width} /> : <CounterWide {...props} />}
    </View>
  );
}

// --- Full-width layout: centered cluster, big fixed buttons ------------------

function CounterWide({ value, onValueChange, config }: CounterElementProps) {
  const count = value.count;
  const hasTarget = config.target != null;
  const isAtTarget = hasTarget && count >= config.target!;

  return (
    <View style={wide.row}>
      <IconButton
        icon={Minus}
        variant="outline"
        size={64}
        disabled={count === 0}
        onPress={() => {
          if (count > 0) {
            bumpHaptic(-1);
            onValueChange({ count: count - 1 });
          }
        }}
        accessibilityLabel="Remove one"
      />
      <View style={wide.numWrap}>
        <Text style={[wide.num, isAtTarget && wide.atTarget]}>{count}</Text>
        {hasTarget && <Text style={wide.sub}>of {config.target}</Text>}
      </View>
      <IconButton
        icon={Plus}
        variant="filled"
        size={64}
        onPress={() => {
          bumpHaptic(1);
          onValueChange({ count: count + 1 });
        }}
        accessibilityLabel="Add one"
      />
    </View>
  );
}

const wide = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  numWrap: { alignItems: 'center', minWidth: 80 },
  num: { ...typography.counter, color: colors.textPrimary, textAlign: 'center' },
  atTarget: { color: colors.success500 },
  sub: { ...typography.caption, color: colors.textSecondary },
});

// --- Half-width layout: compact, buttons sized to fit the measured width -----

function CounterCompact({ value, onValueChange, config, width }: CounterElementProps & { width: number }) {
  const count = value.count;
  const hasTarget = config.target != null;
  const isAtTarget = hasTarget && count >= config.target!;

  // Size circles from the available width so two buttons + the number always
  // fit inside the card, with margin to spare.
  const buttonSize = Math.round(Math.max(36, Math.min(52, width * 0.26)));
  const numFontSize = Math.round(buttonSize * 0.72);

  return (
    <View style={compact.row}>
      <IconButton
        icon={Minus}
        variant="outline"
        size={buttonSize}
        disabled={count === 0}
        onPress={() => {
          if (count > 0) {
            bumpHaptic(-1);
            onValueChange({ count: count - 1 });
          }
        }}
        accessibilityLabel="Remove one"
      />
      <View style={compact.numWrap}>
        <Text
          style={[compact.num, { fontSize: numFontSize, lineHeight: Math.round(numFontSize * 1.1) }, isAtTarget && compact.atTarget]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {count}
        </Text>
        {hasTarget && <Text style={compact.sub} numberOfLines={1}>of {config.target}</Text>}
      </View>
      <IconButton
        icon={Plus}
        variant="filled"
        size={buttonSize}
        onPress={() => {
          bumpHaptic(1);
          onValueChange({ count: count + 1 });
        }}
        accessibilityLabel="Add one"
      />
    </View>
  );
}

const compact = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numWrap: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  num: { ...typography.counter, color: colors.textPrimary, textAlign: 'center' },
  atTarget: { color: colors.success500 },
  sub: { ...typography.caption, color: colors.textSecondary },
});

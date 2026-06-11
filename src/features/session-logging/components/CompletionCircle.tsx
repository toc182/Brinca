import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check } from 'phosphor-react-native';

import { colors, spacing, typography } from '@/shared/theme';

/**
 * The single completion control for drills. Tap once to complete (quick pop +
 * success haptic), tap again to un-complete (light haptic, no confirmation —
 * accidents are covered by the UndoBar pattern).
 *
 * With a `label`, the whole thing renders as a tappable row (label left,
 * circle right) — the compact form for screens where a large centered circle
 * would dominate, e.g. a drill screen full of tracking elements.
 *
 * The animation fires on the false→true transition of `complete`, so it only
 * runs when the mutation actually lands — never on initial mount when a drill
 * loads already completed. It's the "ink + bounce" sequence (user-picked from
 * an option lineup): green floods outward from the center while the circle
 * squeezes down, bounces up once, and settles; the check fades in mid-bounce.
 * Fixed-duration timings throughout — deliberately not a spring, so it can
 * never oscillate or drag on. (Earlier iterations, all rejected on device:
 * v9–v11 8-dot particle burst read as slow swelling; v12 bare pop too dull;
 * v13 pop + ring pulse still not it.)
 */

const SIZES = {
  small: { circle: 36, border: 2, check: 18, hitSlop: 10 },
  large: { circle: 104, border: 3, check: 52, hitSlop: 4 },
} as const;

const SQUEEZE_MS = 120;
const SQUEEZE_SCALE = 0.82;
const BOUNCE_MS = 140;
const BOUNCE_SCALE = 1.14;
const SETTLE_MS = 140;
const FILL_MS = 200;
const CHECK_DELAY_MS = 120;
const CHECK_FADE_MS = 160;

interface CompletionCircleProps {
  size: 'small' | 'large';
  complete: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
  /** Renders a full-width tappable row: this text on the left, circle on the right. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function CompletionCircle({
  size,
  complete,
  onToggle,
  accessibilityLabel,
  label,
  style,
  disabled = false,
}: CompletionCircleProps) {
  const dims = SIZES[size];
  const scale = useSharedValue(1);
  // Fill disc scale and check opacity double as steady-state visuals: 1 when
  // complete, 0 when not. Animated only on the completing transition;
  // un-completing snaps back instantly.
  const fillScale = useSharedValue(complete ? 1 : 0);
  const checkOpacity = useSharedValue(complete ? 1 : 0);
  const prevCompleteRef = useRef(complete);

  useEffect(() => {
    if (complete && !prevCompleteRef.current) {
      scale.value = withSequence(
        withTiming(SQUEEZE_SCALE, { duration: SQUEEZE_MS, easing: Easing.in(Easing.quad) }),
        withTiming(BOUNCE_SCALE, { duration: BOUNCE_MS, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: SETTLE_MS, easing: Easing.inOut(Easing.quad) }),
      );
      fillScale.value = withTiming(1, { duration: FILL_MS, easing: Easing.out(Easing.quad) });
      checkOpacity.value = withDelay(
        CHECK_DELAY_MS,
        withTiming(1, { duration: CHECK_FADE_MS, easing: Easing.out(Easing.quad) }),
      );
    } else if (!complete && prevCompleteRef.current) {
      fillScale.value = 0;
      checkOpacity.value = 0;
    }
    prevCompleteRef.current = complete;
  }, [complete, scale, fillScale, checkOpacity]);

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fillScale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const handlePress = () => {
    if (complete) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onToggle();
  };

  const fillSize = dims.circle - 2 * dims.border;
  const circleNode = (
    <View style={{ width: dims.circle, height: dims.circle }}>
      <Animated.View
        style={[
          styles.circle,
          {
            width: dims.circle,
            height: dims.circle,
            borderRadius: dims.circle / 2,
            borderWidth: dims.border,
          },
          complete && styles.circleComplete,
          circleAnimatedStyle,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            { width: fillSize, height: fillSize, borderRadius: fillSize / 2 },
            fillAnimatedStyle,
          ]}
        />
        {complete && (
          <Animated.View style={checkAnimatedStyle}>
            <Check size={dims.check} color={colors.textOnPrimary} weight="bold" />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );

  if (label) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: complete }}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed, style]}
      >
        <Text style={[styles.label, complete && styles.labelComplete]}>{label}</Text>
        {circleNode}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={dims.hitSlop}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: complete }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.pressable, style]}
    >
      {circleNode}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowPressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  labelComplete: {
    color: colors.textSecondary,
  },
  circle: {
    borderColor: colors.borderDefault,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // No backgroundColor here — the interior green comes from the fill disc,
  // which expands from the center on completion and sits at full size after.
  circleComplete: {
    borderColor: colors.success500,
  },
  fill: {
    position: 'absolute',
    backgroundColor: colors.success500,
  },
});

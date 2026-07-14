import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors, radii } from '@/shared/theme';

// Triangle box. Its outer corner is rounded to the card radius so it sits flush
// in the card's bottom-right without needing the card to clip (which would kill
// the card shadow on iOS).
const SIZE = 46;
const CORNER_R = radii.lg;
// Filled triangle hugging the bottom-right, with the outer corner rounded.
const TRI_PATH = `M0,${SIZE} L${SIZE - CORNER_R},${SIZE} A${CORNER_R},${CORNER_R} 0 0 0 ${SIZE},${SIZE - CORNER_R} L${SIZE},0 Z`;
// Chunky, round-capped check drawn around the triangle's centroid (~2/3 toward
// the corner) so it sits in the visual mass and matches the page's rounded feel.
const CHECK_PATH = 'M24.2,30.2 L28.7,35.2 L38.2,24.7';
const CHECK_STROKE = 2.5;

const POP_UP_MS = 170;
const POP_SETTLE_MS = 140;
const CHECK_DELAY_MS = 110;
const CHECK_FADE_MS = 150;

interface TargetMetRibbonProps {
  /** Whether the element has reached its target. */
  met: boolean;
}

/**
 * Green corner ribbon for the bottom-right of an ElementCard: a rounded-corner
 * triangle (matching the card radius) with a centered, round-capped check, shown
 * when an element hits its target. It pops out of the corner on the false→true
 * transition (never on mount if already met) and snaps away instantly when no
 * longer met — matching the fixed-duration motion of CompletionCircle, not a
 * spring. pointerEvents="none" so it never intercepts taps on a pressable card.
 */
export function TargetMetRibbon({ met }: TargetMetRibbonProps) {
  const scale = useSharedValue(met ? 1 : 0);
  const checkOpacity = useSharedValue(met ? 1 : 0);
  const prevMet = useRef(met);

  useEffect(() => {
    if (met && !prevMet.current) {
      scale.value = withSequence(
        withTiming(1.12, { duration: POP_UP_MS, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: POP_SETTLE_MS, easing: Easing.inOut(Easing.quad) }),
      );
      checkOpacity.value = withDelay(
        CHECK_DELAY_MS,
        withTiming(1, { duration: CHECK_FADE_MS, easing: Easing.out(Easing.quad) }),
      );
    } else if (!met && prevMet.current) {
      scale.value = 0;
      checkOpacity.value = 0;
    }
    prevMet.current = met;
  }, [met, scale, checkOpacity]);

  const ribbonStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: checkOpacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, ribbonStyle]}>
      <Svg width={SIZE} height={SIZE}>
        <Path d={TRI_PATH} fill={colors.success500} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, checkStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Path
            d={CHECK_PATH}
            stroke={colors.textOnPrimary}
            strokeWidth={CHECK_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: SIZE,
    height: SIZE,
    transformOrigin: 'bottom right',
  },
});

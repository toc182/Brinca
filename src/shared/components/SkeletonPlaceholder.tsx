import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Dimensions, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHIMMER_DELAY_MS = 250;
const SHIMMER_DURATION_MS = 1500;
const SHIMMER_FROM = -SCREEN_WIDTH * 1.5;
const SHIMMER_TO = SCREEN_WIDTH * 1.5;

interface SkeletonPlaceholderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Skeleton shimmer loading placeholder.
 * Wraps arbitrary layout-shape Views and sweeps a shimmer gradient over them.
 *
 * Base color: #E8E5F2 (shimmerBase). Highlight: #F4F2FA (shimmerHighlight).
 * Shimmer sweeps left-to-right at ~17° angle, 1500ms linear infinite.
 * 250ms delay before animation starts. Reduce-motion: static gray, no animation.
 *
 * Usage:
 *   <SkeletonPlaceholder>
 *     <View style={{ height: 16, width: '70%', borderRadius: 8 }} />
 *     <View style={{ height: 16, width: '50%', borderRadius: 8, marginTop: 8 }} />
 *   </SkeletonPlaceholder>
 */
export function SkeletonPlaceholder({ children, style }: SkeletonPlaceholderProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const translateX = useSharedValue(SHIMMER_FROM);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted.current) setReduceMotion(enabled);
    });
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(translateX);
      translateX.value = SHIMMER_FROM;
      return;
    }

    translateX.value = withDelay(
      SHIMMER_DELAY_MS,
      withRepeat(
        withTiming(SHIMMER_TO, { duration: SHIMMER_DURATION_MS }),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(translateX);
    };
  }, [reduceMotion, translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const styledChildren = injectShimmerBackground(children);

  return (
    <View style={[styles.container, style]}>
      {styledChildren}
      {!reduceMotion && (
        <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
          <LinearGradient
            colors={[
              'transparent',
              `${colors.shimmerHighlight}99`,
              colors.shimmerHighlight,
              `${colors.shimmerHighlight}99`,
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.gradient]}
          />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Recursively injects shimmerBase background into all View children.
 * Children define the layout shapes; the shimmer gradient sweeps over them.
 */
function injectShimmerBackground(node: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(node)) return node;

  const element = node as React.ReactElement<{
    style?: ViewStyle | ViewStyle[];
    children?: React.ReactNode;
    borderRadius?: number;
  }>;

  const injectedStyle: ViewStyle = {
    backgroundColor: colors.shimmerBase,
    borderRadius: element.props.borderRadius ?? radii.sm,
  };

  const mergedStyle: ViewStyle = StyleSheet.flatten([injectedStyle, element.props.style]);

  return React.cloneElement(element, {
    style: mergedStyle,
    children: element.props.children
      ? React.Children.map(element.props.children, injectShimmerBackground)
      : undefined,
  });
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    transform: [{ skewX: '-17deg' }],
  },
});
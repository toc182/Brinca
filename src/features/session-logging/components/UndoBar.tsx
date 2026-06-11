import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii, shadows, spacing, typography } from '@/shared/theme';

const AUTO_DISMISS_MS = 3000;
const SWIPE_DISMISS_DISTANCE = 64;
const SWIPE_DISMISS_VELOCITY = 800;
const OFFSCREEN_Y = 120;
const OFFSCREEN_X = 480;

/**
 * Bottom snackbar shown right after a drill is completed. Gives a short
 * window to undo an accidental tap — the cheap-mistakes half of the
 * tap-to-complete pattern (see CompletionCircle).
 *
 * Dismisses three ways: tapping Undo, swiping it sideways, or on its own
 * after 3 seconds. The auto-dismiss timer is keyed ONLY on `visible` — the
 * session screen re-renders every second (running timer), and depending on a
 * per-render callback identity here would reset the countdown forever (that
 * bug shipped once; the bar never left).
 *
 * Positioned absolutely; `bottomOffset` lets screens with a footer (Session)
 * or a bare safe area (Drill) place it above their bottom chrome.
 */
interface UndoBarProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  bottomOffset: number;
}

export function UndoBar({ visible, message, onUndo, onDismiss, bottomOffset }: UndoBarProps) {
  const translateY = useSharedValue(OFFSCREEN_Y);
  const translateX = useSharedValue(0);

  // Latest onDismiss without retriggering the timer effect on parent re-renders.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (visible) {
      translateX.value = 0;
      translateY.value = withSpring(0, { mass: 0.8, stiffness: 220, damping: 18 });
      const timer = setTimeout(() => {
        // Slide down, then unmount via the parent.
        translateY.value = withTiming(OFFSCREEN_Y, { duration: 180 }, (finished) => {
          if (finished) runOnJS(invokeDismiss)();
        });
      }, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    } else {
      translateY.value = OFFSCREEN_Y;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function invokeDismiss() {
    onDismissRef.current();
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const flungFar = Math.abs(e.translationX) > SWIPE_DISMISS_DISTANCE;
      const flungFast = Math.abs(e.velocityX) > SWIPE_DISMISS_VELOCITY;
      if (flungFar || flungFast) {
        const direction = e.translationX >= 0 ? 1 : -1;
        translateX.value = withTiming(direction * OFFSCREEN_X, { duration: 150 }, (finished) => {
          if (finished) runOnJS(invokeDismiss)();
        });
      } else {
        translateX.value = withSpring(0, { stiffness: 400, damping: 30 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
  }));

  if (!visible) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, { bottom: bottomOffset }, animatedStyle]}>
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
        <Pressable
          onPress={onUndo}
          hitSlop={spacing.sm}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          style={({ pressed }) => [styles.undoButton, pressed && styles.undoButtonPressed]}
        >
          <Text style={styles.undoText}>Undo</Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success500,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.md,
    zIndex: 9999,
  },
  message: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  undoButtonPressed: {
    backgroundColor: colors.success50,
  },
  undoText: {
    ...typography.buttonSmall,
    color: colors.success600,
  },
});

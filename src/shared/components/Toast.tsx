import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, typography, radii, spacing, shadows } from '../theme';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  variant: ToastVariant;
  visible: boolean;
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, { borderColor: string; iconColor: string }> = {
  success: { borderColor: colors.success500, iconColor: colors.success600 },
  error: { borderColor: colors.error500, iconColor: colors.error600 },
  warning: { borderColor: colors.warning500, iconColor: colors.warning700 },
  info: { borderColor: colors.info500, iconColor: colors.info700 },
};

const DURATION: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

export function Toast({ message, variant, visible, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        mass: 0.8,
        stiffness: 220,
        damping: 18,
      }).start();

      const timer = setTimeout(onDismiss, DURATION[variant]);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, variant, translateY, onDismiss]);

  if (!visible) return null;

  const { borderColor } = VARIANT_STYLES[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        { borderLeftColor: borderColor, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.md,
    zIndex: 9999,
  },
  message: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
  },
});

import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii } from '../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  variant?: 'adult' | 'kid';
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  variant = 'adult',
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const isKid = variant === 'kid';
  const height = isKid ? 10 : 4;
  const fillColor = isKid ? colors.accent500 : colors.primary500;

  return (
    <View style={[styles.track, { height }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.borderSubtle,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { Pause, Timer } from 'phosphor-react-native';

import { colors, fontFamilies, radii, spacing } from '@/shared/theme';
import { useSessionTimer } from '../hooks/useSessionTimer';

/**
 * Compact session-timer pill: stopwatch icon + tabular monospaced digits.
 * When paused, swaps to a Pause icon + "Paused" label so the screen state
 * is unmistakable at a glance.
 */
export function SessionTimer() {
  const { elapsedSeconds, isPaused } = useSessionTimer();

  if (isPaused) {
    return (
      <View style={styles.pill}>
        <Pause size={14} color={colors.primary700} weight="bold" />
        <Text style={styles.label}>Paused</Text>
      </View>
    );
  }

  const display = formatCompact(elapsedSeconds);
  return (
    <View style={styles.pill}>
      <Timer size={14} color={colors.primary700} weight="bold" />
      <Text style={styles.digits}>{display}</Text>
    </View>
  );
}

function formatCompact(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${m}:${s}` : `${m}:${s}`;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    backgroundColor: colors.primary50,
  },
  digits: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 14,
    color: colors.primary700,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    color: colors.primary700,
  },
});

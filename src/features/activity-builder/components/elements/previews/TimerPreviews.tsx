import { StyleSheet, Text, View } from 'react-native';
import { Play } from 'phosphor-react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';
import { formatTimerWithCentiseconds } from '@/shared/utils/formatTimer';

const TIME_FONT_SIZE = 22;

export function StopwatchPreview() {
  return (
    <View style={s.col}>
      <Text style={s.time}>{formatTimerWithCentiseconds(154.56)}</Text>
      <View style={s.playPill}>
        <Play size={12} color={colors.textOnPrimary} weight="fill" />
      </View>
    </View>
  );
}

export function CountdownTimerPreview() {
  return (
    <View style={s.col}>
      <Text style={s.time}>01:30</Text>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: '55%' }]} />
      </View>
    </View>
  );
}

export function LapTimerPreview() {
  return (
    <View style={s.col}>
      <Text style={s.time}>{formatTimerWithCentiseconds(15.34)}</Text>
      <View style={s.lapList}>
        <View style={s.lapRow}>
          <Text style={s.lapLabel}>Lap 1</Text>
          <Text style={s.lapValue}>{formatTimerWithCentiseconds(5.12)}</Text>
        </View>
        <View style={s.lapRow}>
          <Text style={s.lapLabel}>Lap 2</Text>
          <Text style={s.lapValue}>{formatTimerWithCentiseconds(4.87)}</Text>
        </View>
      </View>
    </View>
  );
}

export function IntervalTimerPreview() {
  return (
    <View style={s.col}>
      <View style={s.phaseBadge}>
        <Text style={s.phaseText}>WORK</Text>
      </View>
      <Text style={s.time}>00:45</Text>
      <View style={s.cycleDots}>
        <View style={[s.cycleDot, s.cycleDotDone]} />
        <View style={[s.cycleDot, s.cycleDotActive]} />
        <View style={s.cycleDot} />
        <View style={s.cycleDot} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  col: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: TIME_FONT_SIZE,
    color: colors.textPrimary,
  },

  // Stopwatch
  playPill: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Countdown
  progressTrack: {
    width: 88,
    height: 5,
    borderRadius: radii.full,
    backgroundColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary500,
    borderRadius: radii.full,
  },

  // Lap
  lapList: {
    width: 116,
    gap: 2,
  },
  lapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxs,
  },
  lapLabel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  lapValue: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    color: colors.textPrimary,
  },

  // Interval
  phaseBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.accent500,
  },
  phaseText: {
    ...typography.captionSmall,
    color: colors.textOnPrimary,
    fontFamily: 'Lexend_600SemiBold',
  },
  cycleDots: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  cycleDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.borderSubtle,
  },
  cycleDotDone: {
    backgroundColor: colors.primary500,
  },
  cycleDotActive: {
    backgroundColor: colors.primary500,
    borderWidth: 2,
    borderColor: colors.primary100,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretDown } from 'phosphor-react-native';

import { GradientBlurBackground } from '@/shared/components/GradientBlurBackground';
import { colors, spacing, touchTargets, typography } from '@/shared/theme';

import { SessionTimer } from './SessionTimer';

// 12pt top buffer + 50pt content row + 26pt fade zone below the safe-area
// top inset. The header grows with the device's safe area so it always sits
// below the status bar / dynamic island.
const ROW_TOP_BUFFER = 12;
const ROW_HEIGHT = 50;
const FADE_ZONE = 26;
const HEADER_CONTENT_HEIGHT = ROW_TOP_BUFFER + ROW_HEIGHT + FADE_ZONE; // 88

/** Y position (from viewport top) where the icon row visually ends. */
export function useSessionHeaderContentBottom(): number {
  const insets = useSafeAreaInsets();
  return insets.top + ROW_TOP_BUFFER + ROW_HEIGHT; // safe area + 12 + 50
}

interface SessionHeaderProps {
  activityName: string;
  childName: string;
  /** e.g. "2 of 4 done" — shown after the child name when provided. */
  progressText?: string;
  onMinimize: () => void;
}

export function SessionHeader({ activityName, childName, progressText, onMinimize }: SessionHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { height: insets.top + HEADER_CONTENT_HEIGHT }]}>
      <GradientBlurBackground style={StyleSheet.absoluteFill} fadeStart={0.55} />
      <View style={[styles.row, { marginTop: insets.top + ROW_TOP_BUFFER }]}>
        <Pressable
          onPress={onMinimize}
          hitSlop={spacing.sm}
          accessibilityLabel="Minimize session"
          style={styles.minimizeButton}
        >
          <CaretDown size={20} color={colors.textSecondary} weight="regular" />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.activityName} numberOfLines={1}>{activityName}</Text>
          <Text style={styles.childName} numberOfLines={1}>
            {childName}{progressText ? ` · ${progressText}` : ''}
          </Text>
        </View>

        <View style={styles.timerSlot}>
          <SessionTimer />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  minimizeButton: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  activityName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  childName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  timerSlot: {
    minWidth: touchTargets.min,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

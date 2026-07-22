import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pause, Play, X } from 'phosphor-react-native';

import { Button } from '@/shared/components/Button';
import { GradientBlurBackground } from '@/shared/components/GradientBlurBackground';
import { colors, radii, spacing, touchTargets } from '@/shared/theme';

const ROW_HEIGHT = 56;
const ROW_TOP_PADDING = 16;
const FOOTER_CONTENT_HEIGHT = ROW_TOP_PADDING + ROW_HEIGHT;

/** Height the footer occupies — consumed by SessionScreen for FlatList paddingBottom. */
export function useSessionFooterContentTop(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + FOOTER_CONTENT_HEIGHT;
}

interface SessionFooterProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  finishDisabled: boolean;
}

export function SessionFooter({ isPaused, onTogglePause, onFinish, onDiscard, finishDisabled }: SessionFooterProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.footer}>
      <GradientBlurBackground
        style={StyleSheet.absoluteFill}
        fadeDirection="up"
        fadeStart={0.55}
      />
      <View style={[styles.row, { paddingBottom: insets.bottom }]}>
        <Pressable
          onPress={onDiscard}
          accessibilityRole="button"
          accessibilityLabel="Discard session"
          style={({ pressed }) => [styles.discardButton, pressed && styles.discardPressed]}
        >
          <X size={20} color={colors.error500} weight="bold" />
        </Pressable>
        <Button
          title={isPaused ? 'Resume' : 'Pause'}
          onPress={onTogglePause}
          variant="outline"
          iconLeft={
            isPaused ? (
              <Play size={16} color={colors.primary500} weight="fill" />
            ) : (
              <Pause size={16} color={colors.primary500} weight="fill" />
            )
          }
          style={styles.pauseButton}
        />
        <Button
          title="Finish session"
          onPress={onFinish}
          disabled={finishDisabled}
          style={styles.finishButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: ROW_TOP_PADDING,
  },
  discardButton: {
    width: touchTargets.adult,
    height: touchTargets.adult,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.error500,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardPressed: { opacity: 0.7 },
  pauseButton: { flex: 1 },
  finishButton: { flex: 2 },
});

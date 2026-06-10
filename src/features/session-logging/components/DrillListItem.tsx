import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Info } from 'phosphor-react-native';

import { colors, radii, shadows, spacing, typography } from '@/shared/theme';

interface DrillListItemProps {
  name: string;
  isComplete: boolean;
  isActive: boolean;
  hasDescription: boolean;
  onPress: () => void;
  onInfoPress?: () => void;
}

export function DrillListItem({
  name,
  isComplete,
  isActive,
  hasDescription,
  onPress,
  onInfoPress,
}: DrillListItemProps) {
  // Complete wins over active. When started but not complete, show an
  // "In progress" caption under the drill name.
  const showActiveCaption = isActive && !isComplete;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isComplete && styles.containerComplete,
        pressed && styles.containerPressed,
      ]}
    >
      <View style={[styles.indicator, isComplete && styles.indicatorComplete]}>
        {isComplete ? <Check size={14} color={colors.textOnPrimary} weight="bold" /> : null}
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[styles.name, isComplete && styles.nameComplete]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {showActiveCaption && <Text style={styles.activeCaption}>In progress</Text>}
      </View>
      {hasDescription && onInfoPress && (
        <Pressable
          onPress={onInfoPress}
          hitSlop={spacing.sm}
          accessibilityLabel="Drill info"
          accessibilityRole="button"
          style={styles.infoButton}
        >
          <Info size={22} color={colors.textPrimary} weight="regular" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    minHeight: 56,
    ...shadows.sm,
  },
  containerComplete: {
    backgroundColor: colors.primary50,
    shadowOpacity: 0,
    elevation: 0,
  },
  containerPressed: {
    opacity: 0.85,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  indicatorComplete: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  textContainer: { flex: 1 },
  name: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  nameComplete: {
    color: colors.textSecondary,
  },
  activeCaption: {
    ...typography.captionSmall,
    color: colors.primary700,
    marginTop: 2,
  },
  infoButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

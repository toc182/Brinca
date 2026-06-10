import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '@/shared/theme';
import { formatRecency } from '@/shared/utils/formatRecency';

const ICON_PALETTE = [colors.primary500, colors.secondary500, colors.accent500] as const;

interface ActivityTileProps {
  id: string;
  name: string;
  icon: string | null;
  lastSessionAt: string | null;
  paletteIndex: number;
  onPress: () => void;
}

export function ActivityTile({ name, icon, lastSessionAt, paletteIndex, onPress }: ActivityTileProps) {
  const iconBg = ICON_PALETTE[paletteIndex % ICON_PALETTE.length];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      accessibilityRole="button"
      accessibilityLabel={`Start ${name}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Text style={styles.iconText}>{icon ?? '•'}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.recency} numberOfLines={1}>
        {formatRecency(lastSessionAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 96,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  tilePressed: {
    opacity: 0.85,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  name: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  recency: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

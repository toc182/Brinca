import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/shared/components/Avatar';
import { colors, typography, spacing } from '@/shared/theme';

interface ChildHeaderProps {
  name: string;
  avatarUrl: string | null;
  onPress: () => void;
}

export function ChildHeader({ name, avatarUrl, onPress }: ChildHeaderProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Avatar imageUrl={avatarUrl} name={name} size="large" />
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.chevron}>{'>'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  name: {
    ...typography.titleMedium,
    color: colors.textPrimary,
  },
  chevron: {
    ...typography.titleSmall,
    color: colors.textSecondary,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'phosphor-react-native';
import { colors, typography, spacing, radii, iconSizes } from '@/shared/theme';
import { getAccoladeById } from '@/shared/gamification/accolade-catalog';

interface AccoladeRowProps {
  accoladeIds: string[];
  onSeeAll?: () => void;
}

export function AccoladeRow({ accoladeIds, onSeeAll }: AccoladeRowProps) {

  if (accoladeIds.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {accoladeIds.map((id) => {
          const a = getAccoladeById(id);
          if (!a) return null;
          return (
            <View key={id} style={styles.badge}>
              <Star size={iconSizes.inline} color={colors.accent600} weight="fill" />
              <Text style={styles.name}>{a.name}</Text>
            </View>
          );
        })}
      </View>
      {onSeeAll && (
        <Pressable
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
          onPress={onSeeAll}
        >
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  container: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs,
    backgroundColor: colors.accent50, borderRadius: radii.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs,
  },
  name: { fontFamily: 'Lexend_600SemiBold', fontSize: 12, color: colors.accent600 },
  seeAll: { alignSelf: 'flex-start', paddingVertical: spacing.xxs },
  seeAllText: { ...typography.bodySmall, color: colors.primary500 },
  pressed: { opacity: 0.7 },
});

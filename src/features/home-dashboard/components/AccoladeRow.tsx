import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { getAccoladeById } from '@/shared/gamification/accolade-catalog';

export function AccoladeRow({ accoladeIds }: { accoladeIds: string[] }) {
  if (accoladeIds.length === 0) return null;

  return (
    <View style={styles.container}>
      {accoladeIds.map((id) => {
        const a = getAccoladeById(id);
        if (!a) return null;
        return (
          <View key={id} style={styles.badge}>
            <Text style={styles.name}>{a.name}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  badge: {
    backgroundColor: colors.accent50, borderRadius: radii.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs,
  },
  name: { fontFamily: 'Lexend_600SemiBold', fontSize: 12, color: colors.accent600 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'phosphor-react-native';
import { colors, typography, spacing, radii, iconSizes } from '@/shared/theme';

interface SessionItem {
  id: string;
  activityName: string;
  started_at: string;
  duration_seconds: number | null;
  isComplete: boolean;
}

interface RecentSessionsProps {
  sessions: SessionItem[];
  onSeeAll?: () => void;
}

export function RecentSessions({ sessions, onSeeAll }: RecentSessionsProps) {
  const router = useRouter();

  if (sessions.length === 0) {
    return (
      <Text style={styles.empty}>
        No sessions yet. Start your first session to see your progress.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {sessions.map((s) => (
        <Pressable
          key={s.id}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => router.push(`/(tabs)/stats/${s.id}` as never)}
        >
          <View style={styles.rowLeft}>
            {s.isComplete ? (
              <CheckCircle size={iconSizes.inline} color={colors.success500} weight="fill" />
            ) : (
              <View style={styles.incompleteIcon} />
            )}
            <View style={styles.rowText}>
              <Text style={styles.name}>{s.activityName}</Text>
              <Text style={styles.status}>{s.isComplete ? 'Complete' : 'Incomplete'}</Text>
            </View>
          </View>
          <Text style={styles.date}>{new Date(s.started_at).toLocaleDateString()}</Text>
        </Pressable>
      ))}

      <Pressable
        style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
        onPress={onSeeAll ?? (() => router.navigate('/(tabs)/stats' as never))}
      >
        <Text style={styles.seeAllText}>See all sessions</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  rowText: { gap: 2, flex: 1 },
  pressed: { opacity: 0.7 },
  name: { ...typography.titleSmall, color: colors.textPrimary },
  status: { ...typography.caption, color: colors.textSecondary },
  date: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.bodySmall, color: colors.textSecondary },
  seeAll: { alignSelf: 'flex-start', paddingVertical: spacing.xxs },
  seeAllText: { ...typography.bodySmall, color: colors.primary500 },
  incompleteIcon: {
    width: iconSizes.inline, height: iconSizes.inline, borderRadius: radii.full,
    borderWidth: 2, borderColor: colors.textSecondary,
  },
});

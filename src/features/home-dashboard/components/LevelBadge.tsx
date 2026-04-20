import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { getLevelProgress } from '@/shared/gamification/level-thresholds';

export function LevelBadge({ sessionCount }: { sessionCount: number }) {
  const { level, progress, sessionsToNext } = getLevelProgress(sessionCount);
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.levelNumber}>{level}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Level {level}</Text>
        <ProgressBar progress={progress} variant="kid" />
        <Text style={styles.remaining}>{sessionsToNext} sessions to next level</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: {
    width: 56, height: 56, borderRadius: radii.full,
    backgroundColor: colors.primary500, alignItems: 'center', justifyContent: 'center',
  },
  levelNumber: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: colors.textOnPrimary },
  info: { flex: 1, gap: spacing.xxs },
  label: { ...typography.titleSmall, color: colors.textPrimary },
  remaining: { ...typography.caption, color: colors.textSecondary },
});

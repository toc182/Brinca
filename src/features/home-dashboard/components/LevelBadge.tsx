import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { getLevelProgress } from '@/shared/gamification/level-thresholds';

/**
 * Badge tiers (every 10 levels):
 *  Tier 0 (L1–9):   purple circle
 *  Tier 1 (L10–19): purple + gold ring
 *  Tier 2 (L20–29): teal fill + gold ring
 *  Tier 3 (L30–39): orange fill + gold ring + shadow
 *  Tier 4 (L40+):   rotating gradient simulation via layered views
 */

interface BadgeTier {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
}

function getBadgeTier(level: number): BadgeTier {
  const milestone = Math.floor((level - 1) / 10);
  switch (milestone) {
    case 0:
      return { backgroundColor: colors.primary500, borderColor: 'transparent', borderWidth: 0, textColor: colors.textOnPrimary };
    case 1:
      return { backgroundColor: colors.primary500, borderColor: '#FFD700', borderWidth: 3, textColor: colors.textOnPrimary };
    case 2:
      return { backgroundColor: colors.secondary500, borderColor: '#FFD700', borderWidth: 3, textColor: '#FFFFFF' };
    case 3:
      return { backgroundColor: colors.accent500, borderColor: '#FFD700', borderWidth: 4, textColor: '#FFFFFF' };
    default:
      // L40+: accent with thicker gold ring and slightly larger badge
      return { backgroundColor: colors.accent600, borderColor: '#FFD700', borderWidth: 5, textColor: '#FFFFFF' };
  }
}

export function LevelBadge({ sessionCount }: { sessionCount: number }) {
  const { level, progress, sessionsToNext } = getLevelProgress(sessionCount);
  const tier = getBadgeTier(level);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: tier.backgroundColor,
            borderColor: tier.borderColor,
            borderWidth: tier.borderWidth,
          },
        ]}
      >
        <Text style={[styles.levelNumber, { color: tier.textColor }]}>{level}</Text>
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
    alignItems: 'center', justifyContent: 'center',
  },
  levelNumber: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24 },
  info: { flex: 1, gap: spacing.xxs },
  label: { ...typography.titleSmall, color: colors.textPrimary },
  remaining: { ...typography.caption, color: colors.textSecondary },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, typography, spacing, shadows, radii } from '@/shared/theme';
import { useActiveSessionStore } from '@/stores/active-session.store';

export function MiniPlayerBar() {
  const router = useRouter();
  const status = useActiveSessionStore((s) => s.status);
  const activityName = useActiveSessionStore((s) => s.activityName);

  if (status === 'idle' || status === 'complete') {
    return null;
  }

  const handleResume = () => {
    useActiveSessionStore.getState().setStatus('active');
    router.push('/(modals)/session' as never);
  };

  return (
    <Pressable onPress={handleResume} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.activityName} numberOfLines={1}>
          {activityName} — in progress
        </Text>
        <Text style={styles.resumeText}>Resume</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    backgroundColor: colors.primary500,
    borderRadius: radii.md,
    ...shadows.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activityName: {
    ...typography.bodySmall,
    color: colors.textOnPrimary,
    flex: 1,
  },
  resumeText: {
    ...typography.buttonSmall,
    color: colors.textOnPrimary,
    marginLeft: spacing.sm,
  },
});

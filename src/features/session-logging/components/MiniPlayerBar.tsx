import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, typography, spacing } from '@/shared/theme';
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
      <Text style={styles.activityName} numberOfLines={1}>
        {activityName} — in progress
      </Text>
      <Text style={styles.resumeText}>Resume</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  activityName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  resumeText: {
    ...typography.buttonSmall,
    color: colors.primary500,
    marginLeft: spacing.sm,
  },
});

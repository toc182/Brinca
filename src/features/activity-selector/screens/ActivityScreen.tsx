import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { colors, typography, spacing, radii, shadows } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSession } from '@/features/session-logging/hooks/useActiveSession';
import { useActivitiesQuery } from '@/features/activity-builder/queries/useActivitiesQuery';
import { useStartSessionMutation } from '@/features/session-logging/mutations/useStartSessionMutation';
import { useSessionTimer } from '@/features/session-logging/hooks/useSessionTimer';

export function ActivityScreen() {
  const router = useRouter();
  const childId = useActiveChildStore((s) => s.childId);
  const { isActive, activityName } = useActiveSession();
  const { data: activities } = useActivitiesQuery(childId);
  const startSession = useStartSessionMutation();
  const timer = useSessionTimer();
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectActivity = useCallback((activity: { id: string; name: string }) => {
    if (!childId) return;
    setShowPicker(false);
    startSession.mutate(
      { childId, activityId: activity.id, activityName: activity.name },
      {
        onSuccess: () => {
          timer.start();
          router.push('/(modals)/session' as never);
        },
      }
    );
  }, [childId, startSession, timer, router]);

  // If session is active, show resume UI
  if (isActive) {
    return (
      <View style={styles.container}>
        <Text style={styles.activeLabel}>Session in progress</Text>
        <Text style={styles.activityName}>{activityName}</Text>
        <Text style={styles.timer}>{timer.formatted}</Text>
        <Button
          title="Resume session"
          onPress={() => router.push('/(modals)/session' as never)}
          style={styles.resumeButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!activities?.length ? (
        <EmptyState
          title="No activities"
          body="Create an activity first, then come back to start a session."
        />
      ) : (
        <>
          <Button
            title="Start session"
            onPress={() => setShowPicker(true)}
            style={styles.startButton}
          />
          <Modal
            visible={showPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <Pressable style={styles.overlay} onPress={() => setShowPicker(false)}>
              <View style={styles.sheet}>
                <Text style={styles.sheetTitle}>Choose an activity</Text>
                <FlatList
                  data={activities}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.activityRow}
                      onPress={() => handleSelectActivity({ id: item.id, name: item.name })}
                    >
                      <Text style={styles.activityRowText}>{item.name}</Text>
                    </Pressable>
                  )}
                />
              </View>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  startButton: { minWidth: 200 },
  activeLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  activityName: { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  timer: { ...typography.timer, color: colors.primary500, marginBottom: spacing.lg },
  resumeButton: { minWidth: 200 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    maxHeight: '50%',
  },
  sheetTitle: { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md },
  activityRow: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  activityRowText: { ...typography.bodySmall, color: colors.textPrimary },
});

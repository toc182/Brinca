import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';

import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { colors, typography, spacing } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSession } from '@/features/session-logging/hooks/useActiveSession';
import { useActivitiesQuery } from '@/features/activity-builder/queries/useActivitiesQuery';
import { useStartSessionMutation } from '@/features/session-logging/mutations/useStartSessionMutation';
import { useSessionTimer } from '@/features/session-logging/hooks/useSessionTimer';
import { ActivityPickerSheet } from '../components/ActivityPickerSheet';

export function ActivityScreen() {
  const router = useRouter();
  const childId = useActiveChildStore((s) => s.childId);
  const { isActive, activityName } = useActiveSession();
  const { data: activities } = useActivitiesQuery(childId);
  const startSession = useStartSessionMutation();
  const timer = useSessionTimer();
  const bottomSheetRef = useRef<BottomSheet>(null);

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

  const handleSelectActivity = useCallback((activity: { id: string; name: string }) => {
    if (!childId) return;
    bottomSheetRef.current?.close();
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
            onPress={() => bottomSheetRef.current?.expand()}
            style={styles.startButton}
          />
          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={['50%']}
            enablePanDownToClose
            backgroundStyle={styles.sheetBg}
          >
            <ActivityPickerSheet
              activities={activities.map((a) => ({ id: a.id, name: a.name, icon: a.icon }))}
              onSelect={handleSelectActivity}
            />
          </BottomSheet>
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
  sheetBg: { backgroundColor: colors.surface },
});

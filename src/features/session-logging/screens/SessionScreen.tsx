import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, type AppStateStatus, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { colors, typography, spacing, radii, shadows } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSessionStore } from '@/stores/active-session.store';
import { SessionTimer } from '../components/SessionTimer';
import { DrillListItem } from '../components/DrillListItem';
import { SessionNotes } from '../components/SessionNotes';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useFinishSessionMutation } from '../mutations/useFinishSessionMutation';
import { getDrillsByActivity } from '@/features/activity-builder/repositories/drill.repository';
import { getDrillResultsBySession, getOrCreateDrillResult, markDrillComplete } from '../repositories/drill-result.repository';
import { updateSessionNote } from '../repositories/session.repository';

const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

export function SessionScreen() {
  const router = useRouter();
  const sessionId = useActiveSessionStore((s) => s.sessionId);
  const activityId = useActiveSessionStore((s) => s.activityId);
  const activityName = useActiveSessionStore((s) => s.activityName);
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const insets = useSafeAreaInsets();
  const timer = useSessionTimer();
  const finishSession = useFinishSessionMutation();

  const [note, setNote] = useState('');
  const [sessionPhotoUri, setSessionPhotoUri] = useState<string | null>(null);
  const [showInactivityBanner, setShowInactivityBanner] = useState(false);
  const backgroundTimestampRef = useRef<number | null>(null);

  // Auto-start timer when session screen mounts
  useEffect(() => {
    if (!timer.isActive) {
      timer.start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track app background/foreground for inactivity detection
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimestampRef.current = Date.now();
      } else if (nextState === 'active') {
        if (backgroundTimestampRef.current != null) {
          const elapsed = Date.now() - backgroundTimestampRef.current;
          if (elapsed >= INACTIVITY_THRESHOLD_MS) {
            // Auto-pause after 2 hours of inactivity
            timer.pause();
            setShowInactivityBanner(true);
          }
          backgroundTimestampRef.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [timer]);

  const { data: drills, isLoading: drillsLoading } = useQuery({
    queryKey: ['drills', activityId],
    queryFn: () => getDrillsByActivity(activityId!),
    enabled: !!activityId,
  });

  const { data: drillResults, refetch: refetchResults } = useQuery({
    queryKey: ['drill-results', sessionId],
    queryFn: () => getDrillResultsBySession(sessionId!),
    enabled: !!sessionId,
  });

  const completedDrillIds = new Set(
    drillResults?.filter((dr) => dr.is_complete).map((dr) => dr.drill_id)
  );

  const handleMinimize = () => {
    useActiveSessionStore.getState().setStatus('minimized');
    router.back();
  };

  // Block child switching mid-session
  const handleChildSwitch = useCallback(() => {
    Alert.alert(
      'Session in progress',
      'You have a session in progress. Finish it before switching children.',
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  // Mark a drill with no elements complete directly from session screen
  const handleMarkComplete = useCallback(async (drillId: string) => {
    if (!sessionId) return;
    try {
      const drillResultId = await getOrCreateDrillResult(sessionId, drillId);
      await markDrillComplete(drillResultId);
      await refetchResults();
    } catch {
      // silently fail — user can retry by tapping again
    }
  }, [sessionId, refetchResults]);

  const handleFinishSession = () => {
    if (!sessionId || !childId) return;
    if (note.trim()) {
      void updateSessionNote(sessionId, note.trim());
    }
    finishSession.mutate(
      { sessionId, childId, elapsedSeconds: timer.elapsedSeconds },
      {
        onSuccess: (result) => {
          timer.reset();
          useActiveSessionStore.getState().clearSession();
          router.replace({
            pathname: '/(modals)/session-summary',
            params: {
              sessionId,
              durationSeconds: String(result.durationSeconds),
              tierResults: JSON.stringify(result.tierResults),
              newAccolades: JSON.stringify(result.newAccolades),
            },
          } as never);
        },
      }
    );
  };

  const activeDrills = drills?.filter((d) => d.is_active) ?? [];

  return (
    <Screen edges={['bottom']} style={{ paddingTop: insets.top }}>
      <OfflineBanner />

      {/* Inactivity banner */}
      {showInactivityBanner && (
        <View style={styles.inactivityBanner}>
          <Text style={styles.inactivityText}>
            Your session was paused due to inactivity.
          </Text>
          <Pressable
            onPress={() => {
              timer.resume();
              setShowInactivityBanner(false);
            }}
            style={styles.resumeButton}
          >
            <Text style={styles.resumeButtonText}>Resume</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.activityName}>{activityName}</Text>
          <Text style={styles.childName}>{childName}</Text>
        </View>
        <SessionTimer />
        <Pressable onPress={handleMinimize} style={styles.minimizeButton}>
          <Text style={styles.minimizeText}>▼</Text>
        </Pressable>
      </View>

      {drillsLoading ? (
        <View style={styles.list}>
          <SkeletonPlaceholder>
            <View style={styles.skeletonItem} />
            <View style={styles.skeletonItem} />
            <View style={styles.skeletonItem} />
          </SkeletonPlaceholder>
        </View>
      ) : (
        <FlatList
          data={activeDrills}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const hasElements = (item as unknown as { element_count?: number }).element_count !== 0;
            const isComplete = completedDrillIds.has(item.id);

            // Drills with no tracking elements: show "Mark complete" inline
            if (!hasElements && !isComplete) {
              return (
                <View style={styles.markCompleteRow}>
                  <Text style={styles.drillNameText}>{item.name}</Text>
                  <Pressable
                    onPress={() => handleMarkComplete(item.id)}
                    style={({ pressed }) => [styles.markCompleteButton, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.markCompleteText}>Mark complete</Text>
                  </Pressable>
                </View>
              );
            }

            return (
              <DrillListItem
                name={item.name}
                isComplete={isComplete}
                onPress={() => {
                  if (!hasElements && isComplete) return;
                  router.push(`/(modals)/session/${item.id}` as never);
                }}
              />
            );
          }}
          ListFooterComponent={
            <SessionNotes
              value={note}
              onChangeText={setNote}
              photoUri={sessionPhotoUri}
              onPhotoChange={setSessionPhotoUri}
              sessionId={sessionId ?? undefined}
            />
          }
        />
      )}

      <View style={styles.footer}>
        <Button
          title="Finish session"
          onPress={handleFinishSession}
          disabled={finishSession.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  headerInfo: { flex: 1 },
  activityName: { ...typography.titleSmall, color: colors.textPrimary },
  childName: { ...typography.caption, color: colors.textSecondary },
  minimizeButton: { padding: spacing.sm },
  minimizeText: { fontSize: 18, color: colors.textSecondary },
  list: { padding: spacing.md },
  footer: { padding: spacing.md },
  inactivityBanner: {
    backgroundColor: colors.warning50,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning500,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  inactivityText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
  resumeButton: {
    backgroundColor: colors.warning500,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  resumeButtonText: { ...typography.buttonSmall, color: colors.textOnPrimary },
  skeletonItem: {
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  markCompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  drillNameText: { ...typography.titleSmall, color: colors.textPrimary, flex: 1 },
  markCompleteButton: {
    backgroundColor: colors.primary500,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  markCompleteText: { ...typography.buttonSmall, color: colors.textOnPrimary },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/shared/components/Screen';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { colors, radii, spacing, typography } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSessionStore } from '@/stores/active-session.store';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import { SessionHeader, useSessionHeaderContentBottom } from '../components/SessionHeader';
import { SessionFooter, useSessionFooterContentTop } from '../components/SessionFooter';
import { DrillListItem } from '../components/DrillListItem';
import { DrillDescriptionSheet } from '../components/DrillDescriptionSheet';
import { SessionPhotosNotes } from '../components/SessionPhotosNotes';
import { UndoBar } from '../components/UndoBar';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useFinishSessionMutation } from '../mutations/useFinishSessionMutation';
import { useMarkDrillCompleteMutation } from '../mutations/useMarkDrillCompleteMutation';
import { useUnmarkDrillCompleteMutation } from '../mutations/useUnmarkDrillCompleteMutation';
import { useUpdateSessionNoteMutation } from '../mutations/useUpdateSessionNoteMutation';
import { useDrillResultsQuery } from '../queries/useDrillResultsQuery';
import { getDrillsByActivity } from '@/features/activity-builder/repositories/drill.repository';
import { getDrillIdsWithPhotos } from '@/features/activity-builder/repositories/drill-photo.repository';

const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

export function SessionScreen() {
  const router = useRouter();
  const sessionId = useActiveSessionStore((s) => s.sessionId);
  const activityId = useActiveSessionStore((s) => s.activityId);
  const activityName = useActiveSessionStore((s) => s.activityName);
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const headerContentBottom = useSessionHeaderContentBottom();
  const footerContentTop = useSessionFooterContentTop();
  const timer = useSessionTimer();
  const finishSession = useFinishSessionMutation();
  const markDrillComplete = useMarkDrillCompleteMutation();
  const unmarkDrillComplete = useUnmarkDrillCompleteMutation();
  const updateSessionNote = useUpdateSessionNoteMutation();

  const [note, setNote] = useState('');
  const [showInactivityBanner, setShowInactivityBanner] = useState(false);
  // Last drill completed from this list — drives the UndoBar. Cleared on
  // dismiss (timeout) or when Undo reverts the completion.
  const [undoTarget, setUndoTarget] = useState<{ drillId: string; name: string } | null>(null);
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

  // Which drills have description photos — combined with drill.description
  // text below to decide whether to render the info icon per row. Cheap
  // DISTINCT scan against drill_photos; cached for the session.
  const { data: drillIdsWithPhotos } = useQuery({
    queryKey: ['drill-ids-with-photos'],
    queryFn: getDrillIdsWithPhotos,
    staleTime: 5 * 60 * 1000,
  });

  const { data: drillResults } = useDrillResultsQuery(sessionId);

  // Description sheet — single instance shared across rows. State holds the
  // currently selected drill's id + text so we can present without remounting.
  const descriptionSheetRef = useRef<BottomSheetModal>(null);
  const [activeDescription, setActiveDescription] = useState<{
    drillId: string;
    description: string | null;
  } | null>(null);

  const handleInfoPress = useCallback(
    (drillId: string, description: string | null) => {
      setActiveDescription({ drillId, description });
    },
    [],
  );

  // Present the sheet only after activeDescription is set — mounting the
  // sheet and calling present() in the same tick races against React's
  // ref attachment, so the present() call no-ops on a null ref.
  useEffect(() => {
    if (activeDescription) {
      descriptionSheetRef.current?.present();
    }
  }, [activeDescription]);

  const completedDrillIds = new Set(
    drillResults?.filter((dr) => dr.is_complete).map((dr) => dr.drill_id)
  );
  const activeDrillIds = new Set(
    drillResults?.filter((dr) => !dr.is_complete).map((dr) => dr.drill_id)
  );

  const handleMinimize = () => {
    useActiveSessionStore.getState().setStatus('minimized');
    router.back();
  };

  const handleToggleComplete = useCallback(async (drillId: string, drillName: string, isComplete: boolean) => {
    if (!sessionId) return;
    try {
      if (isComplete) {
        await unmarkDrillComplete.mutateAsync({ sessionId, drillId });
        setUndoTarget((prev) => (prev?.drillId === drillId ? null : prev));
      } else {
        await markDrillComplete.mutateAsync({ sessionId, drillId });
        setUndoTarget({ drillId, name: drillName });
      }
    } catch {
      // silently fail — user can retry by tapping again
    }
  }, [sessionId, markDrillComplete, unmarkDrillComplete]);

  const handleUndo = useCallback(async () => {
    if (!sessionId || !undoTarget) return;
    try {
      await unmarkDrillComplete.mutateAsync({ sessionId, drillId: undoTarget.drillId });
    } catch {
      // silently fail — the circle stays green and can be tapped to retry
    }
    setUndoTarget(null);
  }, [sessionId, undoTarget, unmarkDrillComplete]);

  const handleTogglePause = useCallback(() => {
    if (timer.isPaused) {
      timer.resume();
      setShowInactivityBanner(false);
    } else {
      timer.pause();
    }
  }, [timer]);

  const handleFinishSession = async () => {
    if (!sessionId || !childId) return;
    if (note.trim()) {
      await updateSessionNote.mutateAsync({ sessionId, note: note.trim() });
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
  const completedCount = activeDrills.filter((d) => completedDrillIds.has(d.id)).length;
  const progressText = activeDrills.length > 0
    ? `${completedCount} of ${activeDrills.length} done`
    : undefined;

  // Banners that sit under the absolute blur header — full-width strips that
  // need to negate the FlatList contentContainer horizontal padding so they
  // span edge-to-edge.
  const listHeader = (
    <View style={styles.banners}>
      <OfflineBanner />
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
    </View>
  );

  const listContentStyle = [
    styles.list,
    {
      paddingTop: headerContentBottom + spacing.md,
      paddingBottom: footerContentTop + spacing.md,
    },
  ];

  const scrimOpacity = useSharedValue(0);
  useEffect(() => {
    scrimOpacity.value = withTiming(timer.isPaused ? 1 : 0, { duration: 280 });
  }, [timer.isPaused, scrimOpacity]);
  const scrimAnimatedStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));

  return (
    <Screen edges={[]}>
      <SessionHeader
        activityName={activityName ?? ''}
        childName={childName ?? ''}
        progressText={progressText}
        onMinimize={handleMinimize}
      />

      {drillsLoading ? (
        <View style={listContentStyle}>
          {listHeader}
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
          contentContainerStyle={listContentStyle}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => {
            const isComplete = completedDrillIds.has(item.id);
            const hasDescription =
              !!item.description?.trim() || (drillIdsWithPhotos?.has(item.id) ?? false);

            // One row shape for every drill: the circle completes/un-completes
            // in place, the rest of the row opens the drill (always — completed
            // and elementless drills stay reachable for photos/notes).
            return (
              <DrillListItem
                name={item.name}
                isComplete={isComplete}
                isActive={activeDrillIds.has(item.id)}
                hasDescription={hasDescription}
                onPress={() => router.push(`/(modals)/session/${item.id}` as never)}
                onToggleComplete={() => handleToggleComplete(item.id, item.name, isComplete)}
                onInfoPress={
                  hasDescription
                    ? () => handleInfoPress(item.id, item.description ?? null)
                    : undefined
                }
              />
            );
          }}
          ListFooterComponent={
            <SessionPhotosNotes
              sessionId={sessionId}
              note={note}
              onChangeNote={setNote}
            />
          }
        />
      )}

      <Animated.View
        pointerEvents={timer.isPaused ? 'auto' : 'none'}
        style={[
          styles.pausedScrim,
          { top: headerContentBottom, bottom: footerContentTop },
          scrimAnimatedStyle,
        ]}
      />

      <SessionFooter
        isPaused={timer.isPaused}
        onTogglePause={handleTogglePause}
        onFinish={handleFinishSession}
        finishDisabled={finishSession.isPending}
      />

      <UndoBar
        visible={undoTarget !== null}
        message={undoTarget ? `${undoTarget.name} done` : ''}
        onUndo={handleUndo}
        onDismiss={() => setUndoTarget(null)}
        bottomOffset={footerContentTop + spacing.sm}
      />

      {activeDescription && (
        <DrillDescriptionSheet
          ref={descriptionSheetRef}
          drillId={activeDescription.drillId}
          description={activeDescription.description}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.md,
  },
  banners: {
    marginHorizontal: -spacing.md,
    marginBottom: spacing.xs,
  },
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
  pausedScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.scrim,
  },
});

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CaretLeft, Info } from 'phosphor-react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { GradientBlurBackground } from '@/shared/components/GradientBlurBackground';
import { Screen } from '@/shared/components/Screen';
import { colors, typography, spacing, radii, shadows } from '@/shared/theme';
import { CompletionCircle } from '../components/CompletionCircle';
import { DrillPhotosNotes } from '../components/DrillPhotosNotes';
import { DrillDescriptionSheet } from '../components/DrillDescriptionSheet';
import { UndoBar } from '../components/UndoBar';
import { showToast } from '@/shared/utils/toast';
import { useActiveSessionStore } from '@/stores/active-session.store';
import { useActiveChildStore } from '@/stores/active-child.store';
import { getDrillById } from '@/features/activity-builder/repositories/drill.repository';
import { getElementsByDrill } from '@/features/activity-builder/repositories/tracking-element.repository';
import { useDrillDescriptionPhotos } from '@/features/activity-builder/hooks/useDrillDescriptionPhotos';
import {
  getOrCreateDrillResult,
  getElementValuesByDrillResult,
  getDrillResultIsComplete,
  markDrillIncomplete,
  updateDrillResultNote,
  upsertElementValue,
} from '../repositories/drill-result.repository';
import { useMarkDrillCompleteMutation } from '../mutations/useMarkDrillCompleteMutation';
import { ElementRenderer } from '../components/elements/ElementRenderer';
import { sessionKeys } from '../queries/keys';
import type { ElementType } from '@/shared/tracking-elements/types/element-types';
import { getDefaultValue, hasConfiguredTarget, isTargetMet } from '@/shared/tracking-elements/validation';

// Header geometry — mirrors SessionHeader so blur looks consistent across the
// session-logging surfaces. Top buffer + content row + fade-zone below.
const HEADER_ROW_TOP_BUFFER = 12;
const HEADER_ROW_HEIGHT = 50;
const HEADER_FADE_ZONE = 26;
const HEADER_CONTENT_HEIGHT = HEADER_ROW_TOP_BUFFER + HEADER_ROW_HEIGHT + HEADER_FADE_ZONE;

export function DrillScreen() {
  const router = useRouter();
  const { drillId } = useLocalSearchParams<{ drillId: string }>();
  const sessionId = useActiveSessionStore((s) => s.sessionId);
  const activityName = useActiveSessionStore((s) => s.activityName);
  const childName = useActiveChildStore((s) => s.childName);
  const insets = useSafeAreaInsets();
  const markDrillCompleteMutation = useMarkDrillCompleteMutation();
  const queryClient = useQueryClient();

  const { data: drill } = useQuery({
    queryKey: ['drill', drillId],
    queryFn: () => getDrillById(drillId!),
    enabled: !!drillId,
  });

  const { data: elements } = useQuery({
    queryKey: ['tracking-elements', drillId],
    queryFn: () => getElementsByDrill(drillId!),
    enabled: !!drillId,
  });

  // Completion is a single committed flag, toggled only by the big
  // CompletionCircle in the body. The back arrow never changes it, and
  // completing no longer auto-navigates back — photos/notes stay reachable.
  const hasElements = (elements?.length ?? 0) > 0;
  const [isComplete, setIsComplete] = useState(false);
  const [showUndo, setShowUndo] = useState(false);

  // Drill description metadata: text comes from the drill row, photos via
  // the dedicated hook (signed-URL fetch). The header info icon shows only
  // when there's something worth viewing.
  const { photos: descriptionPhotos } = useDrillDescriptionPhotos(drillId ?? null);
  const hasDescriptionText = !!drill?.description?.trim();
  const hasDescriptionPhotos = descriptionPhotos.length > 0;
  const hasDescription = hasDescriptionText || hasDescriptionPhotos;
  const descriptionSheetRef = useRef<BottomSheetModal>(null);

  // The drill result row — created on mount, updated throughout. Tracked as
  // both a ref (for callbacks that read the latest value without re-creating)
  // and state (so the DrillPhotosNotes query re-runs once it's known).
  const drillResultIdRef = useRef<string | null>(null);
  const [drillResultId, setDrillResultId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>({});
  const [note, setNote] = useState('');

  // "All targets met" nudge: when every element that has a target (explicit
  // or inherent) reports met, the Mark-as-complete row lights up green.
  // Elements with no target notion are ignored; if none has one, no nudge.
  const allTargetsMet = useMemo(() => {
    if (!elements || elements.length === 0) return false;
    let candidates = 0;
    for (const el of elements) {
      const type = el.type as ElementType;
      const elConfig = JSON.parse(el.config) as Record<string, unknown>;
      if (!hasConfiguredTarget(type, elConfig)) continue;
      candidates += 1;
      const elValue = values[el.id] ?? getDefaultValue(type);
      if (!isTargetMet(type, elConfig, elValue)) return false;
    }
    return candidates > 0;
  }, [elements, values]);

  // Debounce timer for SQLite writes (avoids writing every 100ms during timer ticks)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create or load the drill result when screen mounts
  useEffect(() => {
    if (!sessionId || !drillId) return;

    let cancelled = false;

    async function init() {
      try {
        const id = await getOrCreateDrillResult(sessionId!, drillId!);
        if (cancelled) return;
        drillResultIdRef.current = id;
        setDrillResultId(id);

        // Invalidate the session's drill-results query so the session screen
        // shows the active state immediately when the user goes back.
        queryClient.invalidateQueries({ queryKey: sessionKeys.drillResults(sessionId!) });

        // Reflect saved completion so a re-opened completed drill shows green.
        const alreadyComplete = await getDrillResultIsComplete(id);
        if (cancelled) return;
        setIsComplete(alreadyComplete);

        // Load persisted element values
        const existingValues = await getElementValuesByDrillResult(id);
        if (cancelled) return;
        const parsed: Record<string, Record<string, unknown>> = {};
        for (const row of existingValues) {
          try {
            parsed[row.tracking_element_id] = JSON.parse(row.value) as Record<string, unknown>;
          } catch {
            // ignore malformed rows
          }
        }
        setValues(parsed);
      } catch (e) {
        if (!cancelled) {
          showToast('error', 'Could not load drill data. Please try again.');
        }
      }
    }

    void init();
    return () => { cancelled = true; };
  }, [sessionId, drillId, queryClient]);

  // Auto-save element value to SQLite (debounced to avoid flooding during timer ticks)
  const persistValue = useCallback((elementId: string, value: Record<string, unknown>) => {
    const drillResultId = drillResultIdRef.current;
    if (!drillResultId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void upsertElementValue(drillResultId, elementId, value);
    }, 400);
  }, []);

  const handleValueChange = useCallback((elementId: string, value: Record<string, unknown>) => {
    setValues((prev) => ({ ...prev, [elementId]: value }));
    persistValue(elementId, value);
  }, [persistValue]);

  const handleNoteChange = useCallback((text: string) => {
    setNote(text);
    if (drillResultIdRef.current) {
      void updateDrillResultNote(drillResultIdRef.current, text);
    }
  }, []);

  const handleUnmark = async () => {
    const id = drillResultIdRef.current;
    if (!id || !sessionId) return;
    try {
      await markDrillIncomplete(id);
      setIsComplete(false);
      setShowUndo(false);
      queryClient.invalidateQueries({ queryKey: sessionKeys.drillResults(sessionId) });
    } catch {
      showToast('error', 'Could not update drill.');
    }
  };

  const handleToggleComplete = async () => {
    if (isComplete) {
      await handleUnmark();
      return;
    }

    if (!drillResultIdRef.current || !sessionId || !drillId) {
      showToast('error', 'Session error. Please restart the session.');
      return;
    }

    try {
      // Flush any pending saves immediately
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      // Persist final values for all elements (ensure nothing is lost)
      const drillResultId = drillResultIdRef.current;
      for (const [elementId, value] of Object.entries(values)) {
        await upsertElementValue(drillResultId, elementId, value);
      }
      if (note.trim()) {
        await updateDrillResultNote(drillResultId, note.trim());
      }

      await markDrillCompleteMutation.mutateAsync({ sessionId, drillId });
      setIsComplete(true);
      setShowUndo(true);
    } catch {
      showToast('error', 'Could not save drill. Please try again.');
    }
  };

  return (
    <>
    <Screen edges={[]}>
      {/* Fixed header with blur — content scrolls behind it */}
      <View style={[styles.header, { height: insets.top + HEADER_CONTENT_HEIGHT }]}>
        <GradientBlurBackground style={StyleSheet.absoluteFill} fadeStart={0.55} />
        <View style={[styles.headerRow, { marginTop: insets.top + HEADER_ROW_TOP_BUFFER }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={spacing.sm}
            accessibilityLabel="Back to drill list"
            style={styles.headerButton}
          >
            <CaretLeft size={22} color={colors.textPrimary} weight="bold" />
          </Pressable>
          <View style={styles.titleArea}>
            <Pressable
              onPress={hasDescription ? () => descriptionSheetRef.current?.present() : undefined}
              disabled={!hasDescription}
              hitSlop={spacing.xs}
              accessibilityLabel={hasDescription ? 'Drill info' : undefined}
              accessibilityRole={hasDescription ? 'button' : undefined}
              style={styles.titleBlock}
            >
              <Text style={styles.drillName} numberOfLines={1}>{drill?.name}</Text>
              <Text style={styles.contextText} numberOfLines={1}>
                {childName}{activityName ? ` · ${activityName}` : ''}
              </Text>
            </Pressable>
            {hasDescription && (
              <Pressable
                onPress={() => descriptionSheetRef.current?.present()}
                hitSlop={spacing.sm}
                accessibilityLabel="Drill info"
                accessibilityRole="button"
                style={styles.infoButton}
              >
                <Info size={34} color={colors.textPrimary} weight="regular" />
              </Pressable>
            )}
          </View>
          {/* Completion lives in the body's CompletionCircle — the header has
              no finish action, just the back arrow and a layout spacer. */}
          <View style={styles.headerButtonSpacer} />
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + HEADER_ROW_TOP_BUFFER + HEADER_ROW_HEIGHT + spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.elementGrid}>
        {elements?.map((el) => {
          const elConfig = JSON.parse(el.config);
          const elValue = values[el.id] ?? getDefaultValue(el.type as ElementType);
          const targetMet = isTargetMet(el.type as ElementType, elConfig, elValue);
          return (
            <View key={el.id} style={styles.elementContainer}>
              <View style={styles.elementHeader}>
                <Text style={styles.elementLabel}>{el.label}</Text>
                {targetMet && (
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetBadgeText}>✓</Text>
                  </View>
                )}
              </View>
              <ElementRenderer
                type={el.type as ElementType}
                config={elConfig}
                value={elValue}
                onValueChange={(v) => handleValueChange(el.id, v)}
                elementId={el.id}
              />
            </View>
          );
        })}
        </View>

        {/* The one completion control. Elementless drills: big centered circle
            as the screen's main content. Tracked drills: compact labeled row
            below the elements so it doesn't compete with them. Tapping again
            un-completes — no confirmation, the UndoBar covers slips. */}
        {hasElements ? (
          <CompletionCircle
            size="small"
            label={
              isComplete
                ? 'Completed'
                : allTargetsMet
                  ? 'All targets met — mark complete'
                  : 'Mark as complete'
            }
            complete={isComplete}
            onToggle={handleToggleComplete}
            accessibilityLabel={isComplete ? 'Mark drill as not done' : 'Mark drill as done'}
            style={[
              styles.completeRowCard,
              allTargetsMet && !isComplete && styles.completeRowCardReady,
            ]}
          />
        ) : (
          <View style={styles.completeSection}>
            <CompletionCircle
              size="large"
              complete={isComplete}
              onToggle={handleToggleComplete}
              accessibilityLabel={isComplete ? 'Mark drill as not done' : 'Mark drill as done'}
            />
            <Text style={styles.completeHint}>
              {isComplete ? 'Completed' : 'Tap when done'}
            </Text>
          </View>
        )}

        {/* Drill-level multi-photo + note: two-card row + thumbnail strip */}
        <DrillPhotosNotes
          drillResultId={drillResultId}
          note={note}
          onChangeNote={handleNoteChange}
          title="Drill note"
          placeholder="Anything notable from this drill?"
        />
      </KeyboardAwareScrollView>

      <UndoBar
        visible={showUndo}
        message={`${drill?.name ?? 'Drill'} done`}
        onUndo={handleUnmark}
        onDismiss={() => setShowUndo(false)}
        bottomOffset={insets.bottom + spacing.md}
      />
    </Screen>
    {drillId && (
      <DrillDescriptionSheet
        ref={descriptionSheetRef}
        drillId={drillId}
        description={drill?.description ?? null}
      />
    )}
    <AppKeyboardToolbar />
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerRow: {
    height: HEADER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  headerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    maxWidth: '85%',
  },
  drillName: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  contextText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  elementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  elementContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 0,
    ...shadows.sm,
  },
  elementHeader: { marginBottom: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  elementLabel: { ...typography.titleSmall, color: colors.textPrimary, textAlign: 'center' },
  targetBadge: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -11 }],
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.success500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  headerButtonSpacer: { width: 50, height: 50 },

  // Completion control. Elementless drills: roomy centered circle as the
  // screen's main content. Tracked drills: compact labeled row card.
  completeSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  completeHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  completeRowCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    marginBottom: spacing.md,
  },
  completeRowCardReady: {
    backgroundColor: colors.success50,
    borderWidth: 1.5,
    borderColor: colors.success500,
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CaretLeft, Check, Info } from 'phosphor-react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { Button } from '@/shared/components/Button';
import { GradientBlurBackground } from '@/shared/components/GradientBlurBackground';
import { Screen } from '@/shared/components/Screen';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import { DrillPhotosNotes } from '../components/DrillPhotosNotes';
import { DrillDescriptionSheet } from '../components/DrillDescriptionSheet';
import { showToast } from '@/shared/utils/toast';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
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
import { getDefaultValue, isTargetMet } from '@/shared/tracking-elements/validation';

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
  const { showDestructiveAlert } = useDestructiveAlert();

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

  // A drill with no tracking elements shows a "Mark as complete" checkbox plus
  // the "Finish drill" button (the redundant top-right header check is dropped
  // for these drills). `checked` is the box's visual state; `savedComplete` is
  // the committed completion. Once committed, the Finish button is hidden (only
  // Back remains) and tapping the box asks to confirm before un-completing.
  const hasElements = (elements?.length ?? 0) > 0;
  const [checked, setChecked] = useState(false);
  const [savedComplete, setSavedComplete] = useState(false);

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

        // Reflect saved completion so a re-opened completed drill shows checked.
        const alreadyComplete = await getDrillResultIsComplete(id);
        if (cancelled) return;
        setChecked(alreadyComplete);
        setSavedComplete(alreadyComplete);

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

  const handleUnmarkComplete = () => {
    showDestructiveAlert({
      title: 'Unmark as complete?',
      message: 'This drill will no longer be marked complete.',
      destructiveLabel: 'Unmark',
      onConfirm: async () => {
        const id = drillResultIdRef.current;
        if (!id || !sessionId) return;
        try {
          await markDrillIncomplete(id);
          setSavedComplete(false);
          setChecked(false);
          queryClient.invalidateQueries({ queryKey: sessionKeys.drillResults(sessionId) });
        } catch {
          showToast('error', 'Could not update drill.');
        }
      },
    });
  };

  const handleFinishDrill = async () => {
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
      router.back();
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
          {hasElements ? (
            <Pressable
              onPress={handleFinishDrill}
              hitSlop={spacing.sm}
              accessibilityLabel="Finish drill"
              style={styles.headerButton}
            >
              <Check size={20} color={colors.textPrimary} weight="bold" />
            </Pressable>
          ) : (
            // Elementless drill: finishing is done via the body button, so the
            // redundant header check is dropped — just the back button remains.
            <View style={styles.headerButtonSpacer} />
          )}
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

        {/* Elementless drill: the "Mark as complete" checkbox. Before the drill
            is committed it just toggles; once committed, tapping it confirms
            before un-completing (which restores the Finish button). */}
        {!hasElements && (
          <Pressable
            onPress={savedComplete ? handleUnmarkComplete : () => setChecked((prev) => !prev)}
            style={({ pressed }) => [styles.completeRow, pressed && styles.completeRowPressed]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel="Mark as complete"
          >
            <View style={[styles.completeCheckbox, checked && styles.completeCheckboxChecked]}>
              {checked && <Text style={styles.completeCheckmark}>&#10003;</Text>}
            </View>
            <Text style={styles.completeLabel}>Mark as complete</Text>
          </Pressable>
        )}

        {/* Drill-level multi-photo + note: two-card row + thumbnail strip */}
        <DrillPhotosNotes
          drillResultId={drillResultId}
          note={note}
          onChangeNote={handleNoteChange}
          title="Drill note"
          placeholder="Anything notable from this drill?"
        />

        {(hasElements || !savedComplete) && (
          <Button
            title="Finish drill"
            onPress={handleFinishDrill}
            style={styles.finishButton}
          />
        )}
      </KeyboardAwareScrollView>
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
  elementContainer: { marginBottom: spacing.lg },
  elementHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  elementLabel: { ...typography.titleSmall, color: colors.textPrimary, flex: 1 },
  targetBadge: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.success500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  finishButton: { marginTop: spacing.lg },
  headerButtonSpacer: { width: 50, height: 50 },

  // "Mark as complete" checkbox (elementless drills only)
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    minHeight: touchTargets.adult,
    marginBottom: spacing.md,
  },
  completeRowPressed: { backgroundColor: colors.success50 },
  completeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  completeCheckboxChecked: {
    backgroundColor: colors.success500,
    borderColor: colors.success500,
  },
  completeCheckmark: {
    ...typography.caption,
    color: colors.textOnPrimary,
    marginTop: -1,
  },
  completeLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
});

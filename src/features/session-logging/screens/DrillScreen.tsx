import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { colors, typography, spacing, radii } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useActiveSessionStore } from '@/stores/active-session.store';
import { useActiveChildStore } from '@/stores/active-child.store';
import { getDrillById } from '@/features/activity-builder/repositories/drill.repository';
import { getElementsByDrill } from '@/features/activity-builder/repositories/tracking-element.repository';
import {
  getOrCreateDrillResult,
  markDrillComplete,
  getElementValuesByDrillResult,
  updateDrillResultNote,
  updateDrillResultPhoto,
  upsertElementValue,
} from '../repositories/drill-result.repository';
import { ElementRenderer } from '../components/elements/ElementRenderer';
import type { ElementType } from '@/shared/tracking-elements/types/element-types';
import { getDefaultValue, isTargetMet } from '@/shared/tracking-elements/validation';

export function DrillScreen() {
  const router = useRouter();
  const { drillId } = useLocalSearchParams<{ drillId: string }>();
  const sessionId = useActiveSessionStore((s) => s.sessionId);
  const activityName = useActiveSessionStore((s) => s.activityName);
  const childName = useActiveChildStore((s) => s.childName);

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

  // The drill result row — created on mount, updated throughout.
  const drillResultIdRef = useRef<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>({});
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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
  }, [sessionId, drillId]);

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

  const handlePickPhoto = async () => {
    Alert.alert('Add photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setPhotoUri(uri);
            if (drillResultIdRef.current) {
              await updateDrillResultPhoto(drillResultIdRef.current, uri);
            }
          }
        },
      },
      {
        text: 'Photo library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setPhotoUri(uri);
            if (drillResultIdRef.current) {
              await updateDrillResultPhoto(drillResultIdRef.current, uri);
            }
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleNoteChange = (text: string) => {
    setNote(text);
    if (drillResultIdRef.current) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void updateDrillResultNote(drillResultIdRef.current!, text);
      }, 400);
    }
  };

  const handleFinishDrill = async () => {
    if (!drillResultIdRef.current) {
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

      await markDrillComplete(drillResultId);
      router.back();
    } catch {
      showToast('error', 'Could not save drill. Please try again.');
    }
  };

  return (
    <Screen>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Context header */}
        <View style={styles.contextRow}>
          <Text style={styles.contextText}>
            {childName}{activityName ? ` · ${activityName}` : ''}
          </Text>
        </View>

        <Text style={styles.drillName}>{drill?.name}</Text>

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

        {/* Drill notes */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={note}
            onChangeText={handleNoteChange}
            placeholder="Optional notes for this drill..."
            placeholderTextColor={colors.textPlaceholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Photo attachment */}
        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            <Pressable
              onPress={() => {
                setPhotoUri(null);
                if (drillResultIdRef.current) {
                  void updateDrillResultPhoto(drillResultIdRef.current, null);
                }
              }}
              style={styles.removePhotoButton}
            >
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={handlePickPhoto} style={styles.addPhotoButton}>
            <Text style={styles.addPhotoText}>+ Add photo</Text>
          </Pressable>
        )}

        <Button
          title="Finish drill"
          onPress={handleFinishDrill}
          style={styles.finishButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  contextRow: { marginBottom: spacing.xs },
  contextText: { ...typography.caption, color: colors.textSecondary },
  drillName: { ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.lg },
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
  notesContainer: { marginBottom: spacing.md },
  notesLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  notesInput: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing.md,
    minHeight: 80,
  },
  photoContainer: { marginBottom: spacing.md },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  removePhotoButton: { alignSelf: 'flex-start' },
  removePhotoText: { ...typography.caption, color: colors.error500 },
  addPhotoButton: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addPhotoText: { ...typography.bodySmall, color: colors.textSecondary },
  finishButton: { marginTop: spacing.lg },
});

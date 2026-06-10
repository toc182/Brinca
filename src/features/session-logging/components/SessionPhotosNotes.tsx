import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { CameraPlus, NotePencil } from 'phosphor-react-native';

import { Button } from '@/shared/components/Button';
import { colors, radii, shadows, spacing, typography } from '@/shared/theme';
import { MAX_PHOTOS_PER_SESSION, useSessionPhotos } from '../hooks/useSessionPhotos';
import { PhotoGallery } from './PhotoGallery';

interface SessionPhotosNotesProps {
  sessionId: string | null;
  note: string;
  onChangeNote: (text: string) => void;
  title?: string;
  placeholder?: string;
}

/**
 * Multi-photo + single-note section for the SessionScreen footer. Parallel to
 * DrillPhotosNotes — same two-card row + thumbnail strip + note bottom sheet.
 * The drill version owns drill-result photos; this one owns session-level
 * photos via useSessionPhotos.
 */
export function SessionPhotosNotes({
  sessionId,
  note,
  onChangeNote,
  title = 'Session note',
  placeholder = 'What stood out about this session?',
}: SessionPhotosNotesProps) {
  const { photos, addPhoto, removePhoto, retryUpload } = useSessionPhotos(sessionId);

  const noteSheetRef = useRef<BottomSheetModal>(null);
  const [draftNote, setDraftNote] = useState(note);

  // Keep draft in sync if parent value changes from outside (e.g. on screen
  // remount after backgrounding).
  useEffect(() => {
    setDraftNote(note);
  }, [note]);

  const openNoteSheet = useCallback(() => {
    setDraftNote(note);
    noteSheetRef.current?.present();
  }, [note]);

  const handleSaveNote = useCallback(() => {
    onChangeNote(draftNote);
    noteSheetRef.current?.dismiss();
  }, [draftNote, onChangeNote]);

  const handleCancelNote = useCallback(() => {
    setDraftNote(note);
    noteSheetRef.current?.dismiss();
  }, [note]);

  const hasPhoto = photos.length > 0;
  const photoCardLabel = hasPhoto ? 'Add Another' : 'Add Photo';
  const atCap = photos.length >= MAX_PHOTOS_PER_SESSION;
  const hasNote = !!note.trim();
  const noteCardLabel = hasNote ? 'Edit Note' : 'Add Note';

  return (
    <View style={styles.container}>
      <View style={styles.cardsRow}>
        <Pressable
          onPress={() => void addPhoto()}
          disabled={atCap}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
            atCap && styles.cardDisabled,
          ]}
          accessibilityLabel={photoCardLabel}
        >
          <CameraPlus
            size={24}
            color={atCap ? colors.textDisabled : colors.primary500}
            weight="regular"
          />
          <Text style={[styles.cardLabel, atCap && styles.cardLabelDisabled]}>
            {photoCardLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={openNoteSheet}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          accessibilityLabel={noteCardLabel}
        >
          <NotePencil size={24} color={colors.primary500} weight="regular" />
          <Text style={styles.cardLabel}>{noteCardLabel}</Text>
        </Pressable>
      </View>

      <PhotoGallery photos={photos} onRemove={removePhoto} onRetry={retryUpload} />

      <BottomSheetModal
        ref={noteSheetRef}
        snapPoints={['65%']}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sheetTitle}>{title}</Text>
          <BottomSheetTextInput
            style={styles.noteInput}
            value={draftNote}
            onChangeText={setDraftNote}
            placeholder={placeholder}
            placeholderTextColor={colors.textPlaceholder}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <View style={styles.sheetActions}>
            <Button
              title="Cancel"
              onPress={handleCancelNote}
              variant="secondary"
              style={styles.actionButton}
            />
            <Button
              title="Save"
              onPress={handleSaveNote}
              style={styles.actionButton}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.md },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  cardPressed: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  cardDisabled: {
    backgroundColor: colors.surfaceDisabled,
    borderColor: colors.borderSubtle,
    shadowOpacity: 0,
    elevation: 0,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.primary500,
    textAlign: 'center',
  },
  cardLabelDisabled: {
    color: colors.textDisabled,
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  sheetTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  noteInput: {
    minHeight: 140,
    fontFamily: 'Lexend_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});

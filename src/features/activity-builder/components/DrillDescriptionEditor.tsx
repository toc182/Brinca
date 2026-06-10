import { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraPlus } from 'phosphor-react-native';

import { PhotoGallery } from '@/features/session-logging/components/PhotoGallery';
import type { PhotoItem } from '@/features/session-logging/hooks/useDrillPhotos';
import { colors, radii, shadows, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';

import { TextArea } from '@/shared/components/TextArea';
import {
  MAX_PHOTOS_PER_DRILL_DESCRIPTION,
  useDrillDescriptionPhotos,
} from '../hooks/useDrillDescriptionPhotos';

const DESCRIPTION_MAX_LENGTH = 2000;

type DrillDescriptionEditorProps =
  | {
      mode: 'create';
      description: string;
      onChangeDescription: (text: string) => void;
      draftPhotoUris: string[];
      onChangeDraftPhotoUris: (uris: string[]) => void;
    }
  | {
      mode: 'edit';
      drillId: string;
      description: string;
      onChangeDescription: (text: string) => void;
    };

/**
 * Description editor section for the activity builder's drill screens.
 * Multi-line text + horizontal photo strip with an Add Photo card.
 *
 * **Create mode** holds picked photos as local URIs in component state so
 * they can be materialized as `drill_photos` rows only after the parent
 * `drills` row exists (i.e. on Save). Until then, PhotoGallery renders
 * them with `status: 'draft'` — no spinner, just thumbnails + remove.
 *
 * **Edit mode** routes through `useDrillDescriptionPhotos`, which inserts
 * each photo into SQLite immediately and kicks the upload pipeline.
 */
export function DrillDescriptionEditor(props: DrillDescriptionEditorProps) {
  const { description, onChangeDescription } = props;

  if (props.mode === 'create') {
    return (
      <DrillDescriptionEditorCreate
        description={description}
        onChangeDescription={onChangeDescription}
        draftPhotoUris={props.draftPhotoUris}
        onChangeDraftPhotoUris={props.onChangeDraftPhotoUris}
      />
    );
  }

  return (
    <DrillDescriptionEditorEdit
      description={description}
      onChangeDescription={onChangeDescription}
      drillId={props.drillId}
    />
  );
}

// ---------------------------------------------------------------------------
// Create mode — draft photos held in component state
// ---------------------------------------------------------------------------

interface CreateModeProps {
  description: string;
  onChangeDescription: (text: string) => void;
  draftPhotoUris: string[];
  onChangeDraftPhotoUris: (uris: string[]) => void;
}

function DrillDescriptionEditorCreate({
  description,
  onChangeDescription,
  draftPhotoUris,
  onChangeDraftPhotoUris,
}: CreateModeProps) {
  const photos = useMemo<PhotoItem[]>(
    () => draftPhotoUris.map((uri) => ({ id: uri, uri, status: 'draft' })),
    [draftPhotoUris],
  );
  const atCap = photos.length >= MAX_PHOTOS_PER_DRILL_DESCRIPTION;

  const handleAddPhoto = useCallback(async () => {
    if (atCap) return;
    try {
      const source = await pickImageSource();
      if (!source) return;
      const remainingSlots = MAX_PHOTOS_PER_DRILL_DESCRIPTION - draftPhotoUris.length;
      const newUris = await launchPicker(source, remainingSlots);
      if (newUris.length === 0) return;
      onChangeDraftPhotoUris([...draftPhotoUris, ...newUris]);
    } catch {
      showToast('error', 'Could not add photo. Try again.');
    }
  }, [atCap, draftPhotoUris, onChangeDraftPhotoUris]);

  const handleRemove = useCallback(
    (id: string) => {
      // Create-mode photo ids are the URIs themselves.
      onChangeDraftPhotoUris(draftPhotoUris.filter((uri) => uri !== id));
    },
    [draftPhotoUris, onChangeDraftPhotoUris],
  );

  return (
    <DescriptionLayout
      description={description}
      onChangeDescription={onChangeDescription}
      photos={photos}
      atCap={atCap}
      onAddPhoto={handleAddPhoto}
      onRemovePhoto={handleRemove}
    />
  );
}

// ---------------------------------------------------------------------------
// Edit mode — live photos via the hook
// ---------------------------------------------------------------------------

interface EditModeProps {
  description: string;
  onChangeDescription: (text: string) => void;
  drillId: string;
}

function DrillDescriptionEditorEdit({
  description,
  onChangeDescription,
  drillId,
}: EditModeProps) {
  const { photos, addPhoto, removePhoto, retryUpload } = useDrillDescriptionPhotos(drillId);
  const atCap = photos.length >= MAX_PHOTOS_PER_DRILL_DESCRIPTION;

  return (
    <DescriptionLayout
      description={description}
      onChangeDescription={onChangeDescription}
      photos={photos}
      atCap={atCap}
      onAddPhoto={() => void addPhoto()}
      onRemovePhoto={removePhoto}
      onRetryUpload={retryUpload}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

interface DescriptionLayoutProps {
  description: string;
  onChangeDescription: (text: string) => void;
  photos: PhotoItem[];
  atCap: boolean;
  onAddPhoto: () => void;
  onRemovePhoto: (id: string) => void;
  onRetryUpload?: (id: string) => void;
}

function DescriptionLayout({
  description,
  onChangeDescription,
  photos,
  atCap,
  onAddPhoto,
  onRemovePhoto,
  onRetryUpload,
}: DescriptionLayoutProps) {
  const photoCardLabel = photos.length > 0 ? 'Add Another' : 'Add Photo';

  return (
    <View style={styles.container}>
      <TextArea
        label="Description (optional)"
        value={description}
        onChangeText={onChangeDescription}
        placeholder="What is this drill? Reference notes, tips, anything useful for next time."
        maxLength={DESCRIPTION_MAX_LENGTH}
      />

      <Text style={styles.photoSubtitle}>Add photos for reference</Text>

      <Pressable
        onPress={onAddPhoto}
        disabled={atCap}
        style={({ pressed }) => [
          styles.addPhotoCard,
          pressed && styles.addPhotoCardPressed,
          atCap && styles.addPhotoCardDisabled,
        ]}
        accessibilityLabel={photoCardLabel}
      >
        <CameraPlus
          size={24}
          color={atCap ? colors.textDisabled : colors.primary500}
          weight="regular"
        />
        <Text style={[styles.addPhotoLabel, atCap && styles.addPhotoLabelDisabled]}>
          {photoCardLabel}
        </Text>
      </Pressable>

      <PhotoGallery
        photos={photos}
        onRemove={onRemovePhoto}
        onRetry={onRetryUpload}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Photo picker — inline to keep the editor self-contained. Mirrors the
// picker UX from useDrillPhotos / useSessionPhotos.
// ---------------------------------------------------------------------------

async function pickImageSource(): Promise<'camera' | 'library' | null> {
  return new Promise((resolve) => {
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Camera', onPress: () => resolve('camera') },
      { text: 'Photo library', onPress: () => resolve('library') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

async function launchPicker(
  source: 'camera' | 'library',
  remainingSlots: number,
): Promise<string[]> {
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          quality: 0.8,
          allowsMultipleSelection: true,
          selectionLimit: Math.max(1, remainingSlots),
        });
  if (result.canceled) return [];
  return result.assets.map((asset) => asset.uri);
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  photoSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  addPhotoCard: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  addPhotoCardPressed: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  addPhotoCardDisabled: {
    backgroundColor: colors.surfaceDisabled,
    borderColor: colors.borderSubtle,
    shadowOpacity: 0,
    elevation: 0,
  },
  addPhotoLabel: {
    ...typography.caption,
    color: colors.primary500,
  },
  addPhotoLabelDisabled: {
    color: colors.textDisabled,
  },
});

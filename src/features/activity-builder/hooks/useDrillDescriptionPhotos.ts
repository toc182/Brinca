import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { showToast } from '@/shared/utils/toast';
import {
  deleteStorageObject,
  processPendingPhotos,
  uploadDrillDescriptionPhoto,
} from '@/lib/sync/photo-upload-queue';
import {
  type DrillPhotoRow,
  deletePhoto,
  getPhotosByDrill,
  insertLocalPhoto,
  markPhotoPending,
} from '../repositories/drill-photo.repository';
import type { PhotoItem } from '@/features/session-logging/hooks/useDrillPhotos';

export const MAX_PHOTOS_PER_DRILL_DESCRIPTION = 10;

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour; React Query staleTime keeps it well-fresh
const PHOTOS_QUERY_STALE_TIME_MS = 5 * 60 * 1000; // 5 min — avoid re-signing on every screen remount

/**
 * Generate a short-lived signed URL for an uploaded photo so the native
 * <Image> component (which sends no auth headers) can fetch it. The
 * session-media bucket is private — SELECT is family-member-only via RLS,
 * so a plain getPublicUrl() result returns 403 in a request from <Image>.
 */
async function withSignedUrls(rows: DrillPhotoRow[]): Promise<PhotoItem[]> {
  const items: PhotoItem[] = [];
  for (const row of rows) {
    if (row.upload_status === 'uploaded' && row.storage_path) {
      const { data, error } = await supabase.storage
        .from('session-media')
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
      if (data && !error) {
        items.push({ id: row.id, uri: data.signedUrl, status: 'uploaded' });
        continue;
      }
      // Signed-URL generation failed — fall back to local_uri if available so
      // the user still sees something while we figure it out.
    }
    items.push({
      id: row.id,
      uri: row.local_uri ?? row.storage_url ?? '',
      status: row.upload_status,
    });
  }
  return items;
}

const photosKey = (drillId: string) => ['drill-desc-photos', drillId] as const;

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

export function useDrillDescriptionPhotos(drillId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: photosKey(drillId ?? ''),
    queryFn: async () => {
      const rows = await getPhotosByDrill(drillId!);
      return withSignedUrls(rows);
    },
    enabled: !!drillId,
    staleTime: PHOTOS_QUERY_STALE_TIME_MS,
  });

  const photos: PhotoItem[] = query.data ?? [];
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: photosKey(drillId ?? '') });

  const addPhoto = useCallback(async () => {
    if (!drillId) return;
    if (photos.length >= MAX_PHOTOS_PER_DRILL_DESCRIPTION) {
      showToast('warning', `Up to ${MAX_PHOTOS_PER_DRILL_DESCRIPTION} photos per drill.`);
      return;
    }
    try {
      const source = await pickImageSource();
      if (!source) return;
      const remainingSlots = MAX_PHOTOS_PER_DRILL_DESCRIPTION - photos.length;
      const newUris = await launchPicker(source, remainingSlots);
      if (newUris.length === 0) return;

      const rows: DrillPhotoRow[] = [];
      for (const uri of newUris) {
        rows.push(await insertLocalPhoto(drillId, uri));
      }
      await invalidate();

      // Kick uploads in the background — the UI already shows pending
      // thumbnails; spinners clear as each storage URL lands.
      for (const row of rows) {
        void uploadDrillDescriptionPhoto(row).then(() => invalidate());
      }
    } catch {
      showToast('error', 'Could not add photo. Try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillId, photos.length]);

  const removePhoto = useCallback(
    async (photoId: string) => {
      if (!drillId) return;
      try {
        const { storagePath } = await deletePhoto(photoId);
        await invalidate();
        if (storagePath) void deleteStorageObject(storagePath);
      } catch {
        showToast('error', 'Could not remove photo. Try again.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drillId],
  );

  const retryUpload = useCallback(
    async (photoId: string) => {
      await markPhotoPending(photoId);
      await invalidate();
      void processPendingPhotos().then(() => invalidate());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drillId],
  );

  return {
    photos,
    isLoading: query.isLoading,
    addPhoto,
    removePhoto,
    retryUpload,
  };
}

import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { showToast } from '@/shared/utils/toast';
import {
  deleteStorageObject,
  processPendingPhotos,
  uploadSessionPhoto,
} from '@/lib/sync/photo-upload-queue';
import {
  type SessionPhotoRow,
  deletePhoto,
  getPhotosBySession,
  insertLocalPhoto,
  markPhotoPending,
} from '../repositories/session-photo.repository';
import type { PhotoItem } from './useDrillPhotos';

export const MAX_PHOTOS_PER_SESSION = 10;

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour; React Query staleTime keeps it well-fresh

/**
 * Generate a short-lived signed URL for an uploaded photo so the native
 * <Image> component (which sends no auth headers) can fetch it. The
 * session-media bucket is private — SELECT is family-member-only via RLS,
 * so a plain getPublicUrl() result returns 403 in a request from <Image>.
 */
async function withSignedUrls(rows: SessionPhotoRow[]): Promise<PhotoItem[]> {
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

const photosKey = (sessionId: string) => ['session-photos', sessionId] as const;

async function pickImageSource(): Promise<'camera' | 'library' | null> {
  return new Promise((resolve) => {
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Camera', onPress: () => resolve('camera') },
      { text: 'Photo library', onPress: () => resolve('library') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

async function launchPicker(source: 'camera' | 'library'): Promise<string | null> {
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export function useSessionPhotos(sessionId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: photosKey(sessionId ?? ''),
    queryFn: async () => {
      const rows = await getPhotosBySession(sessionId!);
      return withSignedUrls(rows);
    },
    enabled: !!sessionId,
  });

  const photos: PhotoItem[] = query.data ?? [];
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: photosKey(sessionId ?? '') });

  const addPhoto = useCallback(async () => {
    if (!sessionId) return;
    if (photos.length >= MAX_PHOTOS_PER_SESSION) {
      showToast('warning', `Up to ${MAX_PHOTOS_PER_SESSION} photos per session.`);
      return;
    }
    try {
      const source = await pickImageSource();
      if (!source) return;
      const localUri = await launchPicker(source);
      if (!localUri) return;

      const row = await insertLocalPhoto(sessionId, localUri);
      await invalidate();

      // Kick the upload in the background — the UI already shows the pending
      // thumbnail; the spinner clears when the storage URL lands.
      void uploadSessionPhoto(row).then(() => invalidate());
    } catch {
      showToast('error', 'Could not add photo. Try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, photos.length]);

  const removePhoto = useCallback(
    async (photoId: string) => {
      if (!sessionId) return;
      try {
        const { storagePath } = await deletePhoto(photoId);
        await invalidate();
        if (storagePath) void deleteStorageObject(storagePath);
      } catch {
        showToast('error', 'Could not remove photo. Try again.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId],
  );

  const retryUpload = useCallback(
    async (photoId: string) => {
      await markPhotoPending(photoId);
      await invalidate();
      void processPendingPhotos().then(() => invalidate());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId],
  );

  return {
    photos,
    isLoading: query.isLoading,
    addPhoto,
    removePhoto,
    retryUpload,
  };
}

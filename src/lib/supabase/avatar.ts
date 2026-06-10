import { supabase } from './client';

const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * True for a still-local image URI straight from the picker (file://...) that
 * was never uploaded to storage. These are the legacy/buggy values that vanish
 * on reinstall; they must be uploaded before being stored.
 */
export function isLocalAvatarUri(value: string | null | undefined): boolean {
  return !!value && value.startsWith('file://');
}

/**
 * Resolve a stored avatar value into a renderable signed URL. The `avatars`
 * bucket is private, so the stored value is a storage PATH (newer uploads) or a
 * legacy public URL with the path embedded (`.../object/public/avatars/<path>`).
 * Returns null for anything unsignable — including legacy local `file://` URIs
 * that were never uploaded, so those render as initials instead of a broken
 * image. Mirrors the helper in accounts-center for parent photos.
 */
export async function signAvatarUrl(stored: string | null): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith('file://')) return null; // never-uploaded legacy value
  let path = stored;
  if (stored.startsWith('http')) {
    const marker = '/avatars/';
    const idx = stored.indexOf(marker);
    if (idx < 0) return null;
    path = stored.slice(idx + marker.length);
    // Strip query string (signed tokens / cache busters) and decode.
    const qIdx = path.indexOf('?');
    if (qIdx >= 0) path = path.slice(0, qIdx);
    try {
      path = decodeURIComponent(path);
    } catch {
      // leave path as-is if decode fails
    }
  }
  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Upload a child's picked avatar (a local file:// URI) to the private avatars
 * bucket and return its storage PATH — the value to store in children.avatar_url.
 * The path must start with the user's id to satisfy the avatars_insert RLS
 * policy ((storage.foldername(name))[1] = auth.uid()). Mirrors uploadProfilePhoto.
 *
 * RN's fetch(file://).blob() lands a 0-byte object in supabase-js, so we use
 * arrayBuffer (the documented RN-friendly path, same as the parent photo flow).
 */
export async function uploadChildAvatar(uri: string, childId: string): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('No active session for avatar upload');

  const fileName = `${userId}/child-${childId}-${Date.now()}.jpg`;
  const arrayBuffer = await fetch(uri).then((res) => res.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;

  return fileName;
}

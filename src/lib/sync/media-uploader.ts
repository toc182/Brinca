import { supabase } from '../supabase/client';
import { getDatabase } from '../sqlite/db';

/**
 * Upload a local file to Supabase Storage and update the SQLite record.
 * WiFi-only upload — caller should check network state before calling.
 */
export async function uploadMedia(params: {
  localUri: string;
  bucket: 'avatars' | 'session-media';
  storagePath: string;
  tableName: string;
  rowId: string;
  columnName: string;
}) {
  const { localUri, bucket, storagePath, tableName, rowId, columnName } = params;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, blob, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  // Update SQLite with the Storage URL
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?`,
    urlData.publicUrl,
    rowId
  );

  return urlData.publicUrl;
}

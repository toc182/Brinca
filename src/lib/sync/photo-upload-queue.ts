import * as Sentry from '@sentry/react-native';

import { getDatabase } from '../sqlite/db';
import { supabase } from '../supabase/client';
import {
  type DrillResultPhotoRow,
  getPendingUploads as getPendingDrillResultUploads,
  markPhotoFailed as markDrillResultPhotoFailed,
  markPhotoUploaded as markDrillResultPhotoUploaded,
} from '@/features/session-logging/repositories/drill-result-photo.repository';
import {
  type SessionPhotoRow,
  getPendingUploads as getPendingSessionUploads,
  markPhotoFailed as markSessionPhotoFailed,
  markPhotoUploaded as markSessionPhotoUploaded,
} from '@/features/session-logging/repositories/session-photo.repository';
import {
  type DrillPhotoRow,
  getPendingUploads as getPendingDrillDescriptionUploads,
  markPhotoFailed as markDrillDescriptionPhotoFailed,
  markPhotoUploaded as markDrillDescriptionPhotoUploaded,
} from '@/features/activity-builder/repositories/drill-photo.repository';

const BUCKET = 'session-media';

// ---------------------------------------------------------------------------
// Path resolution — bucket RLS keys on the first path segment (family_id);
// the rest is purely organizational so files are easier to navigate per
// session/drill in the Storage dashboard.
// ---------------------------------------------------------------------------

interface DrillResultPhotoPathContext {
  familyId: string;
  sessionId: string;
  drillResultId: string;
}

interface SessionPhotoPathContext {
  familyId: string;
  sessionId: string;
}

interface DrillDescPhotoPathContext {
  familyId: string;
  drillId: string;
}

async function getDrillResultPhotoPathContext(drillResultId: string): Promise<DrillResultPhotoPathContext | null> {
  const db = await getDatabase();
  return db.getFirstAsync<DrillResultPhotoPathContext>(
    `SELECT c.family_id as familyId, s.id as sessionId, dr.id as drillResultId
       FROM drill_results dr
       JOIN sessions s ON s.id = dr.session_id
       JOIN children c ON c.id = s.child_id
      WHERE dr.id = ?`,
    drillResultId,
  );
}

async function getSessionPhotoPathContext(sessionId: string): Promise<SessionPhotoPathContext | null> {
  const db = await getDatabase();
  return db.getFirstAsync<SessionPhotoPathContext>(
    `SELECT c.family_id as familyId, s.id as sessionId
       FROM sessions s
       JOIN children c ON c.id = s.child_id
      WHERE s.id = ?`,
    sessionId,
  );
}

async function getDrillDescPhotoPathContext(drillId: string): Promise<DrillDescPhotoPathContext | null> {
  const db = await getDatabase();
  return db.getFirstAsync<DrillDescPhotoPathContext>(
    `SELECT c.family_id as familyId, d.id as drillId
       FROM drills d
       JOIN activities a ON a.id = d.activity_id
       JOIN children c ON c.id = a.child_id
      WHERE d.id = ?`,
    drillId,
  );
}

function buildDrillResultStoragePath(ctx: DrillResultPhotoPathContext, photoId: string): string {
  return `${ctx.familyId}/${ctx.sessionId}/${ctx.drillResultId}/${photoId}.jpg`;
}

function buildSessionStoragePath(ctx: SessionPhotoPathContext, photoId: string): string {
  // The literal "session" segment keeps drill-result photos and session
  // photos browsable in distinct folders, and avoids any collision with a
  // real drill_result_id at the same nesting level.
  return `${ctx.familyId}/${ctx.sessionId}/session/${photoId}.jpg`;
}

function buildDrillDescStoragePath(ctx: DrillDescPhotoPathContext, photoId: string): string {
  // Drill description photos are template metadata, NOT tied to any session.
  // The literal "drill-desc" segment puts them in their own top-level folder
  // under family_id so they don't collide with per-session photos.
  return `${ctx.familyId}/drill-desc/${ctx.drillId}/${photoId}.jpg`;
}

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------

/**
 * Pulls a local file into an ArrayBuffer and uploads it to Storage.
 * React Native's fetch(file://).blob() returns an empty body when passed to
 * supabase-js — the Storage object lands but is 0 bytes. ArrayBuffer is the
 * documented RN-friendly path.
 */
async function uploadLocalUriToStorage(localUri: string, storagePath: string): Promise<void> {
  const arrayBuffer = await fetch(localUri).then((res) => res.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;
}

/**
 * Upload a single pending drill_result photo row to Supabase Storage. On
 * success, the repository writes storage_url + storage_path AND queues the
 * Supabase INSERT (so the row sync happens only after we have a real public
 * URL). On failure, the row is marked 'failed' and stays around for retry.
 */
export async function uploadDrillResultPhoto(row: DrillResultPhotoRow): Promise<boolean> {
  if (!row.local_uri) return false;

  const ctx = await getDrillResultPhotoPathContext(row.drill_result_id);
  if (!ctx) {
    Sentry.captureMessage('photo-upload: missing drill_result context', {
      level: 'warning',
      extra: { photoId: row.id, drillResultId: row.drill_result_id },
    });
    await markDrillResultPhotoFailed(row.id);
    return false;
  }

  const storagePath = buildDrillResultStoragePath(ctx, row.id);

  try {
    await uploadLocalUriToStorage(row.local_uri, storagePath);
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    await markDrillResultPhotoUploaded(row.id, urlData.publicUrl, storagePath);
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { source: 'photo-upload', kind: 'drill-result' },
      extra: { photoId: row.id, storagePath },
    });
    await markDrillResultPhotoFailed(row.id);
    return false;
  }
}

/**
 * Upload a single pending session photo row. Mirror of
 * `uploadDrillResultPhoto` but parented on a session instead of a
 * drill_result. Storage path puts the literal "session" segment after
 * session_id so drill and session photos live in disjoint folders under
 * the same family/session prefix.
 */
export async function uploadSessionPhoto(row: SessionPhotoRow): Promise<boolean> {
  if (!row.local_uri) return false;

  const ctx = await getSessionPhotoPathContext(row.session_id);
  if (!ctx) {
    Sentry.captureMessage('photo-upload: missing session context', {
      level: 'warning',
      extra: { photoId: row.id, sessionId: row.session_id },
    });
    await markSessionPhotoFailed(row.id);
    return false;
  }

  const storagePath = buildSessionStoragePath(ctx, row.id);

  try {
    await uploadLocalUriToStorage(row.local_uri, storagePath);
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    await markSessionPhotoUploaded(row.id, urlData.publicUrl, storagePath);
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { source: 'photo-upload', kind: 'session' },
      extra: { photoId: row.id, storagePath },
    });
    await markSessionPhotoFailed(row.id);
    return false;
  }
}

/**
 * Upload a single pending drill-description photo row. Drill descriptions
 * are template metadata — not tied to any session — so the storage path
 * uses a dedicated `drill-desc/` segment under the family_id.
 *
 * The optional ctx param lets the drainer cache the JOIN result across
 * multiple photos for the same drill_id within a single drain pass.
 */
export async function uploadDrillDescriptionPhoto(
  row: DrillPhotoRow,
  ctx?: DrillDescPhotoPathContext | null,
): Promise<boolean> {
  if (!row.local_uri) return false;

  const resolvedCtx = ctx ?? (await getDrillDescPhotoPathContext(row.drill_id));
  if (!resolvedCtx) {
    Sentry.captureMessage('photo-upload: missing drill context', {
      level: 'warning',
      extra: { photoId: row.id, drillId: row.drill_id },
    });
    await markDrillDescriptionPhotoFailed(row.id);
    return false;
  }

  const storagePath = buildDrillDescStoragePath(resolvedCtx, row.id);

  try {
    await uploadLocalUriToStorage(row.local_uri, storagePath);
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    await markDrillDescriptionPhotoUploaded(row.id, urlData.publicUrl, storagePath);
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { source: 'photo-upload', kind: 'drill-description' },
      extra: { photoId: row.id, storagePath },
    });
    await markDrillDescriptionPhotoFailed(row.id);
    return false;
  }
}

/**
 * Best-effort delete of the underlying Storage object when a photo row is
 * removed. Errors are swallowed and logged — an orphaned file is a small
 * storage cost, not a correctness bug. Used by all three photo removal
 * flows (drill_result, session, drill description).
 */
export async function deleteStorageObject(storagePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) throw error;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { source: 'photo-storage-cleanup' },
      extra: { storagePath },
    });
  }
}

// ---------------------------------------------------------------------------
// Drainers
// ---------------------------------------------------------------------------

let isDraining = false;

async function drainPendingDrillResultPhotos(): Promise<void> {
  const pending = await getPendingDrillResultUploads();
  for (const row of pending) {
    const ok = await uploadDrillResultPhoto(row);
    if (!ok) continue;
  }
}

async function drainPendingSessionPhotos(): Promise<void> {
  const pending = await getPendingSessionUploads();
  for (const row of pending) {
    const ok = await uploadSessionPhoto(row);
    if (!ok) continue;
  }
}

async function drainPendingDrillDescriptionPhotos(): Promise<void> {
  const pending = await getPendingDrillDescriptionUploads();
  // Cache the path context per drill_id so we don't re-run the JOIN for
  // each draft photo of the same drill within a single drain pass (e.g.
  // the CreateDrillScreen Save flow that inserts 1–10 photos at once).
  const ctxByDrill = new Map<string, DrillDescPhotoPathContext | null>();
  for (const row of pending) {
    let ctx = ctxByDrill.get(row.drill_id);
    if (ctx === undefined) {
      ctx = await getDrillDescPhotoPathContext(row.drill_id);
      ctxByDrill.set(row.drill_id, ctx);
    }
    const ok = await uploadDrillDescriptionPhoto(row, ctx);
    if (!ok) continue;
  }
}

/**
 * Drain all pending/failed uploads across drill_result, session, and
 * drill-description photos. Safe to call on app foreground, on
 * connectivity change, or right after a fresh pick. Guards against
 * re-entrancy at the public entry so multiple triggers can't race even if
 * the inner drainers run in parallel internally.
 */
export async function processPendingPhotos(): Promise<void> {
  if (isDraining) return;
  isDraining = true;
  try {
    await drainPendingDrillResultPhotos();
    await drainPendingSessionPhotos();
    await drainPendingDrillDescriptionPhotos();
  } finally {
    isDraining = false;
  }
}

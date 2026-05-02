-- ==========================================================================
-- Storage RLS + currency_ledger fraud — closes 3 BLOCKERs from db-drift audit
-- ==========================================================================
--
-- BLOCKER #1 — avatars bucket: previously any authenticated user could read
-- every other user's avatar (path enumerable by user_id), and there was no
-- DELETE policy so users could not remove their own avatar. This migration
-- keeps reads open to authenticated users (standard profile-pic pattern) but
-- scopes write/update/delete to the owning user via path = <user_id>/...,
-- which matches the path constructed in
-- src/features/accounts-center/repositories/accounts-center.repository.ts:161.
--
-- BLOCKER #2 — session-media bucket: previously any authenticated user could
-- read any other family's session media (child photos!). Privacy + compliance
-- breach. New scheme: path is <family_id>/<session_id>/<file>; reads scoped
-- to family members; writes/updates/deletes scoped to family members with
-- write access. No upload code exists in the repo yet, so this is the
-- canonical scheme that future upload code must follow.
--
-- BLOCKER #3 — currency_ledger.INSERT: previously any family role (including
-- 'member') could insert any (source, amount) — a child user could self-credit
-- a 'manual_bonus' row for arbitrary currency. New policy is source-
-- conditional: each source value has its own structural requirements, and all
-- positive-credit sources require a real foreign-key reference to prove the
-- ledger entry corresponds to a real event. 'reward_redemption' must be
-- negative and reference a real reward.
--
-- Idempotent: every CREATE is preceded by DROP IF EXISTS.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- avatars bucket
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS avatars_select ON storage.objects;
DROP POLICY IF EXISTS avatars_insert ON storage.objects;
DROP POLICY IF EXISTS avatars_update ON storage.objects;
DROP POLICY IF EXISTS avatars_delete ON storage.objects;

-- Read: any authenticated user can read any avatar (profile-pic pattern;
-- enables invite previews etc.).
CREATE POLICY avatars_select ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (SELECT auth.uid()) IS NOT NULL
);

-- Write: only the owner can upload to their own folder.
CREATE POLICY avatars_insert ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (SELECT auth.uid()) IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY avatars_update ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY avatars_delete ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- --------------------------------------------------------------------------
-- session-media bucket
-- Path scheme: <family_id>/<session_id>/<filename>
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS session_media_select ON storage.objects;
DROP POLICY IF EXISTS session_media_insert ON storage.objects;
DROP POLICY IF EXISTS session_media_update ON storage.objects;
DROP POLICY IF EXISTS session_media_delete ON storage.objects;

CREATE POLICY session_media_select ON storage.objects FOR SELECT
USING (
  bucket_id = 'session-media'
  AND is_family_member((storage.foldername(name))[1]::uuid)
);

CREATE POLICY session_media_insert ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'session-media'
  AND has_write_access((storage.foldername(name))[1]::uuid)
);

CREATE POLICY session_media_update ON storage.objects FOR UPDATE
USING (
  bucket_id = 'session-media'
  AND has_write_access((storage.foldername(name))[1]::uuid)
)
WITH CHECK (
  bucket_id = 'session-media'
  AND has_write_access((storage.foldername(name))[1]::uuid)
);

CREATE POLICY session_media_delete ON storage.objects FOR DELETE
USING (
  bucket_id = 'session-media'
  AND has_write_access((storage.foldername(name))[1]::uuid)
);

-- --------------------------------------------------------------------------
-- currency_ledger.INSERT — source-conditional rules
-- --------------------------------------------------------------------------
--
-- Allowed cases (anything else is rejected):
--   * source='drill_tier'       : amount > 0, reference_id matches a real
--                                 drill_results row whose session belongs to
--                                 this child.
--   * source='session_tier'     : amount > 0, reference_id matches a real
--                                 sessions row for this child.
--   * source='manual_bonus'     : amount > 0, writer is admin/co_admin in
--                                 the child's family, reference_id matches a
--                                 real sessions row for this child.
--   * source='reward_redemption': amount < 0, reference_id matches a real
--                                 rewards row for this child.
--
-- All cases additionally require the writer to have write access in the
-- child's family (admin / co_admin / collaborator).

DROP POLICY IF EXISTS currency_ledger_insert ON currency_ledger;

CREATE POLICY currency_ledger_insert ON currency_ledger FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = currency_ledger.child_id
      AND has_write_access(c.family_id)
  )
  AND (
    (
      source = 'drill_tier'
      AND amount > 0
      AND EXISTS (
        SELECT 1
        FROM drill_results dr
        JOIN sessions s ON s.id = dr.session_id
        WHERE dr.id = currency_ledger.reference_id
          AND s.child_id = currency_ledger.child_id
      )
    )
    OR (
      source = 'session_tier'
      AND amount > 0
      AND EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.id = currency_ledger.reference_id
          AND s.child_id = currency_ledger.child_id
      )
    )
    OR (
      source = 'manual_bonus'
      AND amount > 0
      AND EXISTS (
        SELECT 1 FROM children c
        WHERE c.id = currency_ledger.child_id
          AND is_admin_or_coadmin(c.family_id)
      )
      AND EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.id = currency_ledger.reference_id
          AND s.child_id = currency_ledger.child_id
      )
    )
    OR (
      source = 'reward_redemption'
      AND amount < 0
      AND EXISTS (
        SELECT 1 FROM rewards r
        WHERE r.id = currency_ledger.reference_id
          AND r.child_id = currency_ledger.child_id
      )
    )
  )
);

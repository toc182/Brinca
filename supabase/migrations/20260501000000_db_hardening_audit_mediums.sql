-- ==========================================================================
-- DB hardening: 5 RLS / FK fixes from the 2026-05-01 audit
-- See docs/audits/db-code-drift-2026-05-01.md MEDIUM #6–#10.
--
--  1. families.INSERT — require an authenticated caller (was WITH CHECK true).
--  2. accolade_unlocks.INSERT — restrict to admin/co_admin only (was any
--     family member, including the 'member' role used for child accounts).
--  3. invites — add UPDATE policy so the invitee can mark accepted_at.
--  4. invites.invited_by — add ON DELETE CASCADE so deleting the inviter
--     does not block account deletion. Keeps the column NOT NULL so the
--     local SQLite schema and generated types do not need to change.
--  5. sessions / drill_results / element_values — make the no-cascade
--     behavior on activity_id / drill_id / tracking_element_id explicit
--     via ON DELETE RESTRICT instead of relying on the NO ACTION default.
-- ==========================================================================

-- 1. families: only authenticated callers can insert (was WITH CHECK true).
DROP POLICY IF EXISTS "families_insert_system" ON families;
CREATE POLICY "families_insert_authenticated" ON families
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 2. accolade_unlocks: only admin/co_admin can insert. Long-term these
-- inserts should move to a SECURITY DEFINER function so the client cannot
-- forge them at all; for now, role gating prevents the 'member' (child)
-- self-grant fraud the audit flagged.
DROP POLICY IF EXISTS "accolade_unlocks_insert" ON accolade_unlocks;
CREATE POLICY "accolade_unlocks_insert" ON accolade_unlocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = accolade_unlocks.child_id
        AND is_admin_or_coadmin(c.family_id)
    )
  );

-- 3. invites: invitee marks accepted_at. Match by email so the only person
-- who can flip the row is the actual recipient currently authenticated.
DROP POLICY IF EXISTS "invites_update_accept" ON invites;
CREATE POLICY "invites_update_accept" ON invites
  FOR UPDATE USING (
    lower(email) = lower((SELECT email FROM auth.users WHERE id = (SELECT auth.uid())))
  ) WITH CHECK (
    lower(email) = lower((SELECT email FROM auth.users WHERE id = (SELECT auth.uid())))
  );

-- 4. invites.invited_by: cascade so account deletion does not fail when
-- the user has outstanding invites.
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_invited_by_fkey;
ALTER TABLE invites ADD CONSTRAINT invites_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Make append-only intent explicit on activity / drill / element refs.
-- The default NO ACTION already prevents deletion of referenced parents;
-- ON DELETE RESTRICT documents the intent so a future reader does not
-- assume cascading was forgotten by accident.
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_activity_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE RESTRICT;

ALTER TABLE drill_results DROP CONSTRAINT IF EXISTS drill_results_drill_id_fkey;
ALTER TABLE drill_results ADD CONSTRAINT drill_results_drill_id_fkey
  FOREIGN KEY (drill_id) REFERENCES drills(id) ON DELETE RESTRICT;

ALTER TABLE element_values DROP CONSTRAINT IF EXISTS element_values_tracking_element_id_fkey;
ALTER TABLE element_values ADD CONSTRAINT element_values_tracking_element_id_fkey
  FOREIGN KEY (tracking_element_id) REFERENCES tracking_elements(id) ON DELETE RESTRICT;

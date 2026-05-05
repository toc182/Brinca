-- ==========================================================================
-- public.is_family_member — JWT short-circuit
--
-- Every family-scope RLS read goes through this helper. Adding a JWT
-- claim check before the family_members lookup eliminates the cold-start
-- race where a freshly-restored session sees zero rows because the
-- family_members read hasn't propagated yet.
--
-- Behavior:
--   * Token has family_id claim AND it matches p_family_id  -> true (no DB read).
--   * Token has family_id claim AND it does NOT match       -> falls through
--     to the family_members lookup. This matters during the transition
--     window (existing sessions issued before the hook was enabled have
--     no claim) and as a defense if a token ever carries a stale claim.
--   * Token has no family_id claim                          -> claim cast
--     yields NULL, comparison is NULL (falsy), falls through to the join.
--
-- Out of scope: has_write_access, is_admin_or_coadmin, get_family_role.
-- Those need role information that family_id alone does not carry, so
-- the role-gated write path keeps its existing family_members lookup.
--
-- Drive-by fix: the original definition omits SET search_path on a
-- SECURITY DEFINER function. Adding it here closes a known CVE pattern.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.is_family_member(p_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (auth.jwt() ->> 'family_id')::uuid = p_family_id
    OR EXISTS (
      SELECT 1 FROM family_members
      WHERE user_id = (SELECT auth.uid())
        AND family_id = p_family_id
    );
$$;
-- ==========================================================================
-- public.custom_access_token_hook
--
-- Invoked by Supabase Auth before issuing a JWT. Looks up the caller's
-- family_id from family_members and injects it into the token claims.
--
-- Contract:
--   * If the user has a family_members row -> claims.family_id is set.
--   * If the user has no family yet (e.g. mid-onboarding, before the
--     bootstrap insert) -> claim is omitted, NOT set to null. RLS helpers
--     must treat absence as "fall through to the family_members lookup".
--
-- Activation is a separate step (not part of this migration):
--   * Local: uncomment [auth.hook.custom_access_token] in supabase/config.toml
--     with uri = "pg-functions://postgres/public/custom_access_token_hook".
--   * Hosted: enable in the Auth Hooks dashboard or via Management API.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_family_id uuid;
  v_claims jsonb;
BEGIN
  v_user_id := (event ->> 'user_id')::uuid;
  v_claims := event -> 'claims';

  SELECT family_id
    INTO v_family_id
    FROM public.family_members
   WHERE user_id = v_user_id
   LIMIT 1;

  IF v_family_id IS NOT NULL THEN
    v_claims := jsonb_set(v_claims, '{family_id}', to_jsonb(v_family_id::text));
    event := jsonb_set(event, '{claims}', v_claims);
  END IF;

  RETURN event;
EXCEPTION
  -- If anything in the hook throws, log a warning and return the event
  -- untouched. The user gets a token without family_id; is_family_member
  -- falls through to the family_members join. The original cold-start race
  -- comes back, but login itself does not break. RAISE WARNING (not
  -- EXCEPTION) keeps the safety net intact while making the failure
  -- observable in Supabase logs — without it, "hook crashed" and "user has
  -- no family yet" produce identical outputs and we'd misattribute crash
  -- symptoms to the existing race.
  WHEN OTHERS THEN
    RAISE WARNING 'custom_access_token_hook failed: % (%)', SQLERRM, SQLSTATE;
    RETURN event;
END;
$$;

-- Auth invokes the hook as supabase_auth_admin. Grant exec to that role
-- only; revoke from end-user roles so the function is not callable from a
-- regular session.
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

-- The function is SECURITY DEFINER and runs as its owner, but Auth still
-- needs explicit table access in case the security context is ever
-- changed. Make the dependency explicit.
GRANT SELECT ON public.family_members TO supabase_auth_admin;
-- ==========================================================================
-- Brinca V1 — Initial schema
-- All 19 synced tables from docs/architecture/05-database-schema.md
-- RLS policies per §3, cascade rules per §4
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. profiles
-- --------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  persona_type TEXT CHECK (persona_type IN ('parent', 'therapist', 'coach', 'teacher', 'other')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- --------------------------------------------------------------------------
-- 2. families
-- --------------------------------------------------------------------------
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_name TEXT NOT NULL DEFAULT 'Coins',
  measurement_unit TEXT NOT NULL DEFAULT 'metric' CHECK (measurement_unit IN ('metric', 'imperial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 3. family_members
-- --------------------------------------------------------------------------
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'co_admin', 'collaborator', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id)
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is a member of a family
CREATE OR REPLACE FUNCTION is_family_member(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
      AND user_id = (SELECT auth.uid())
  );
$$;

-- Helper: get current user's role in a family
CREATE OR REPLACE FUNCTION get_family_role(p_family_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM family_members
  WHERE family_id = p_family_id
    AND user_id = (SELECT auth.uid())
  LIMIT 1;
$$;

-- Helper: check if current user has write access (admin, co_admin, or collaborator)
CREATE OR REPLACE FUNCTION has_write_access(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
      AND user_id = (SELECT auth.uid())
      AND role IN ('admin', 'co_admin', 'collaborator')
  );
$$;

-- Helper: check if current user is admin or co_admin
CREATE OR REPLACE FUNCTION is_admin_or_coadmin(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
      AND user_id = (SELECT auth.uid())
      AND role IN ('admin', 'co_admin')
  );
$$;

-- families policies (need family_members table to exist first)
CREATE POLICY "families_select_member" ON families
  FOR SELECT USING (is_family_member(id));

CREATE POLICY "families_insert_system" ON families
  FOR INSERT WITH CHECK (true); -- onboarding creates family

CREATE POLICY "families_update_admin" ON families
  FOR UPDATE USING (is_admin_or_coadmin(id));

-- family_members policies
CREATE POLICY "family_members_select" ON family_members
  FOR SELECT USING (is_family_member(family_id));

CREATE POLICY "family_members_insert" ON family_members
  FOR INSERT WITH CHECK (
    -- Admin or co_admin can add members, OR user is creating their own admin row during onboarding
    is_admin_or_coadmin(family_id) OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "family_members_update" ON family_members
  FOR UPDATE USING (is_admin_or_coadmin(family_id));

CREATE POLICY "family_members_delete" ON family_members
  FOR DELETE USING (is_admin_or_coadmin(family_id));

-- --------------------------------------------------------------------------
-- 4. invites
-- --------------------------------------------------------------------------
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('co_admin', 'collaborator', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select" ON invites
  FOR SELECT USING (is_family_member(family_id));

CREATE POLICY "invites_insert" ON invites
  FOR INSERT WITH CHECK (is_admin_or_coadmin(family_id));

CREATE POLICY "invites_delete" ON invites
  FOR DELETE USING (is_admin_or_coadmin(family_id));

-- --------------------------------------------------------------------------
-- 5. children
-- --------------------------------------------------------------------------
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  country TEXT,
  grade_level TEXT,
  school_calendar TEXT CHECK (school_calendar IN ('panamanian', 'us', 'custom')),
  calendar_start_month INTEGER CHECK (calendar_start_month BETWEEN 1 AND 12),
  calendar_end_month INTEGER CHECK (calendar_end_month BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "children_select" ON children
  FOR SELECT USING (is_family_member(family_id));

CREATE POLICY "children_insert" ON children
  FOR INSERT WITH CHECK (is_admin_or_coadmin(family_id));

CREATE POLICY "children_update" ON children
  FOR UPDATE USING (is_admin_or_coadmin(family_id));

CREATE POLICY "children_delete" ON children
  FOR DELETE USING (is_admin_or_coadmin(family_id));

-- --------------------------------------------------------------------------
-- 6. activities
-- --------------------------------------------------------------------------
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  category TEXT CHECK (category IN ('sport', 'therapy', 'academic', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Activities: family member via child → family_id
CREATE POLICY "activities_select" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = activities.child_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "activities_insert" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = activities.child_id
        AND has_write_access(c.family_id)
    )
  );

CREATE POLICY "activities_update" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = activities.child_id
        AND has_write_access(c.family_id)
    )
  );

CREATE POLICY "activities_delete" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = activities.child_id
        AND has_write_access(c.family_id)
    )
  );

-- --------------------------------------------------------------------------
-- 7. drills
-- --------------------------------------------------------------------------
CREATE TABLE drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE drills ENABLE ROW LEVEL SECURITY;

-- Drills: family member via activity → child → family_id
CREATE POLICY "drills_select" ON drills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN children c ON c.id = a.child_id
      WHERE a.id = drills.activity_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "drills_insert" ON drills
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN children c ON c.id = a.child_id
      WHERE a.id = drills.activity_id
        AND has_write_access(c.family_id)
    )
  );

CREATE POLICY "drills_update" ON drills
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN children c ON c.id = a.child_id
      WHERE a.id = drills.activity_id
        AND has_write_access(c.family_id)
    )
  );

CREATE POLICY "drills_delete" ON drills
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN children c ON c.id = a.child_id
      WHERE a.id = drills.activity_id
        AND has_write_access(c.family_id)
    )
  );

-- --------------------------------------------------------------------------
-- 8. tracking_elements
-- --------------------------------------------------------------------------
CREATE TABLE tracking_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id UUID NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'counter', 'combined_counter', 'split_counter', 'multistep_counter',
    'stopwatch', 'countdown_timer', 'lap_timer', 'interval_timer',
    'checklist', 'single_select', 'multi_select', 'yes_no',
    'rating_scale', 'emoji_face_scale',
    'number_input', 'multi_number_input', 'free_text_note', 'voice_note'
  )),
  label TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tracking_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracking_elements_select" ON tracking_elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM drills d
      JOIN activities a ON a.id = d.activity_id
      JOIN children c ON c.id = a.child_id
      WHERE d.id = tracking_elements.drill_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "tracking_elements_insert" ON tracking_elements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM drills d
      JOIN activities a ON a.id = d.activity_id
      JOIN children c ON c.id = a.child_id
      WHERE d.id = tracking_elements.drill_id
        AND has_write_access(c.family_id)
    )
  );

CREATE POLICY "tracking_elements_update" ON tracking_elements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM drills d
      JOIN activities a ON a.id = d.activity_id
      JOIN children c ON c.id = a.child_id
      WHERE d.id = tracking_elements.drill_id
        AND has_write_access(c.family_id)
    )
  );

CREATE POLICY "tracking_elements_delete" ON tracking_elements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM drills d
      JOIN activities a ON a.id = d.activity_id
      JOIN children c ON c.id = a.child_id
      WHERE d.id = tracking_elements.drill_id
        AND has_write_access(c.family_id)
    )
  );

-- --------------------------------------------------------------------------
-- 9. tier_rewards (polymorphic: parent_type = 'activity' or 'drill')
-- --------------------------------------------------------------------------
CREATE TABLE tier_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL CHECK (parent_type IN ('activity', 'drill')),
  parent_id UUID NOT NULL,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  currency_amount INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tier_rewards ENABLE ROW LEVEL SECURITY;

-- tier_rewards: resolve family via parent_type
CREATE POLICY "tier_rewards_select" ON tier_rewards
  FOR SELECT USING (
    CASE parent_type
      WHEN 'drill' THEN EXISTS (
        SELECT 1 FROM drills d
        JOIN activities a ON a.id = d.activity_id
        JOIN children c ON c.id = a.child_id
        WHERE d.id = tier_rewards.parent_id
          AND is_family_member(c.family_id)
      )
      WHEN 'activity' THEN EXISTS (
        SELECT 1 FROM activities a
        JOIN children c ON c.id = a.child_id
        WHERE a.id = tier_rewards.parent_id
          AND is_family_member(c.family_id)
      )
      ELSE false
    END
  );

CREATE POLICY "tier_rewards_insert" ON tier_rewards
  FOR INSERT WITH CHECK (
    CASE parent_type
      WHEN 'drill' THEN EXISTS (
        SELECT 1 FROM drills d
        JOIN activities a ON a.id = d.activity_id
        JOIN children c ON c.id = a.child_id
        WHERE d.id = tier_rewards.parent_id
          AND has_write_access(c.family_id)
      )
      WHEN 'activity' THEN EXISTS (
        SELECT 1 FROM activities a
        JOIN children c ON c.id = a.child_id
        WHERE a.id = tier_rewards.parent_id
          AND has_write_access(c.family_id)
      )
      ELSE false
    END
  );

CREATE POLICY "tier_rewards_update" ON tier_rewards
  FOR UPDATE USING (
    CASE parent_type
      WHEN 'drill' THEN EXISTS (
        SELECT 1 FROM drills d
        JOIN activities a ON a.id = d.activity_id
        JOIN children c ON c.id = a.child_id
        WHERE d.id = tier_rewards.parent_id
          AND has_write_access(c.family_id)
      )
      WHEN 'activity' THEN EXISTS (
        SELECT 1 FROM activities a
        JOIN children c ON c.id = a.child_id
        WHERE a.id = tier_rewards.parent_id
          AND has_write_access(c.family_id)
      )
      ELSE false
    END
  );

CREATE POLICY "tier_rewards_delete" ON tier_rewards
  FOR DELETE USING (
    CASE parent_type
      WHEN 'drill' THEN EXISTS (
        SELECT 1 FROM drills d
        JOIN activities a ON a.id = d.activity_id
        JOIN children c ON c.id = a.child_id
        WHERE d.id = tier_rewards.parent_id
          AND has_write_access(c.family_id)
      )
      WHEN 'activity' THEN EXISTS (
        SELECT 1 FROM activities a
        JOIN children c ON c.id = a.child_id
        WHERE a.id = tier_rewards.parent_id
          AND has_write_access(c.family_id)
      )
      ELSE false
    END
  );

-- --------------------------------------------------------------------------
-- 10. bonus_presets (polymorphic: same as tier_rewards)
-- --------------------------------------------------------------------------
CREATE TABLE bonus_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL CHECK (parent_type IN ('activity', 'drill')),
  parent_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bonus_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bonus_presets_select" ON bonus_presets
  FOR SELECT USING (
    CASE parent_type
      WHEN 'drill' THEN EXISTS (
        SELECT 1 FROM drills d JOIN activities a ON a.id = d.activity_id JOIN children c ON c.id = a.child_id
        WHERE d.id = bonus_presets.parent_id AND is_family_member(c.family_id)
      )
      WHEN 'activity' THEN EXISTS (
        SELECT 1 FROM activities a JOIN children c ON c.id = a.child_id
        WHERE a.id = bonus_presets.parent_id AND is_family_member(c.family_id)
      )
      ELSE false
    END
  );

CREATE POLICY "bonus_presets_insert" ON bonus_presets
  FOR INSERT WITH CHECK (
    CASE parent_type
      WHEN 'drill' THEN EXISTS (
        SELECT 1 FROM drills d JOIN activities a ON a.id = d.activity_id JOIN children c ON c.id = a.child_id
        WHERE d.id = bonus_presets.parent_id AND has_write_access(c.family_id)
      )
      WHEN 'activity' THEN EXISTS (
        SELECT 1 FROM activities a JOIN children c ON c.id = a.child_id
        WHERE a.id = bonus_presets.parent_id AND has_write_access(c.family_id)
      )
      ELSE false
    END
  );

CREATE POLICY "bonus_presets_update" ON bonus_presets
  FOR UPDATE USING (
    CASE parent_type
      WHEN 'drill' THEN EXISTS (
        SELECT 1 FROM drills d JOIN activities a ON a.id = d.activity_id JOIN children c ON c.id = a.child_id
        WHERE d.id = bonus_presets.parent_id AND has_write_access(c.family_id)
      )
      WHEN 'activity' THEN EXISTS (
        SELECT 1 FROM activities a JOIN children c ON c.id = a.child_id
        WHERE a.id = bonus_presets.parent_id AND has_write_access(c.family_id)
      )
      ELSE false
    END
  );

CREATE POLICY "bonus_presets_delete" ON bonus_presets
  FOR DELETE USING (
    CASE parent_type
      WHEN 'drill' THEN EXISTS (
        SELECT 1 FROM drills d JOIN activities a ON a.id = d.activity_id JOIN children c ON c.id = a.child_id
        WHERE d.id = bonus_presets.parent_id AND has_write_access(c.family_id)
      )
      WHEN 'activity' THEN EXISTS (
        SELECT 1 FROM activities a JOIN children c ON c.id = a.child_id
        WHERE a.id = bonus_presets.parent_id AND has_write_access(c.family_id)
      )
      ELSE false
    END
  );

-- --------------------------------------------------------------------------
-- 11. rewards (savings goals)
-- --------------------------------------------------------------------------
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'saving' CHECK (state IN ('saving', 'ready_to_redeem', 'redeemed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rewards_select" ON rewards
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = rewards.child_id AND is_family_member(c.family_id))
  );

CREATE POLICY "rewards_insert" ON rewards
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM children c WHERE c.id = rewards.child_id AND has_write_access(c.family_id))
  );

CREATE POLICY "rewards_update" ON rewards
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = rewards.child_id AND has_write_access(c.family_id))
  );

CREATE POLICY "rewards_delete" ON rewards
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = rewards.child_id AND has_write_access(c.family_id))
  );

-- --------------------------------------------------------------------------
-- 12. sessions
-- --------------------------------------------------------------------------
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  note TEXT,
  photo_url TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = sessions.child_id AND is_family_member(c.family_id))
  );

CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM children c WHERE c.id = sessions.child_id AND is_family_member(c.family_id))
  );

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = sessions.child_id AND is_family_member(c.family_id))
  );

CREATE POLICY "sessions_delete" ON sessions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = sessions.child_id AND is_admin_or_coadmin(c.family_id))
  );

-- --------------------------------------------------------------------------
-- 13. drill_results
-- --------------------------------------------------------------------------
CREATE TABLE drill_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES drills(id),
  is_complete BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE drill_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drill_results_select" ON drill_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN children c ON c.id = s.child_id
      WHERE s.id = drill_results.session_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "drill_results_insert" ON drill_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN children c ON c.id = s.child_id
      WHERE s.id = drill_results.session_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "drill_results_update" ON drill_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN children c ON c.id = s.child_id
      WHERE s.id = drill_results.session_id
        AND is_family_member(c.family_id)
    )
  );

-- drill_results deleted via session cascade only

-- --------------------------------------------------------------------------
-- 14. element_values
-- --------------------------------------------------------------------------
CREATE TABLE element_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_result_id UUID NOT NULL REFERENCES drill_results(id) ON DELETE CASCADE,
  tracking_element_id UUID NOT NULL REFERENCES tracking_elements(id),
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE element_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "element_values_select" ON element_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM drill_results dr
      JOIN sessions s ON s.id = dr.session_id
      JOIN children c ON c.id = s.child_id
      WHERE dr.id = element_values.drill_result_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "element_values_insert" ON element_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM drill_results dr
      JOIN sessions s ON s.id = dr.session_id
      JOIN children c ON c.id = s.child_id
      WHERE dr.id = element_values.drill_result_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "element_values_update" ON element_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM drill_results dr
      JOIN sessions s ON s.id = dr.session_id
      JOIN children c ON c.id = s.child_id
      WHERE dr.id = element_values.drill_result_id
        AND is_family_member(c.family_id)
    )
  );

-- element_values deleted via drill_result cascade only

-- --------------------------------------------------------------------------
-- 15. currency_ledger (append-only)
-- --------------------------------------------------------------------------
CREATE TABLE currency_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('drill_tier', 'session_tier', 'manual_bonus', 'reward_redemption')),
  reference_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE currency_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "currency_ledger_select" ON currency_ledger
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = currency_ledger.child_id AND is_family_member(c.family_id))
  );

CREATE POLICY "currency_ledger_insert" ON currency_ledger
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM children c WHERE c.id = currency_ledger.child_id AND is_family_member(c.family_id))
  );

-- No UPDATE or DELETE policies — append-only per schema doc

-- --------------------------------------------------------------------------
-- 16. accolade_unlocks (append-only, composite PK)
-- --------------------------------------------------------------------------
CREATE TABLE accolade_unlocks (
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  accolade_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, accolade_id)
);

ALTER TABLE accolade_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accolade_unlocks_select" ON accolade_unlocks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = accolade_unlocks.child_id AND is_family_member(c.family_id))
  );

CREATE POLICY "accolade_unlocks_insert" ON accolade_unlocks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM children c WHERE c.id = accolade_unlocks.child_id AND is_family_member(c.family_id))
  );

-- No UPDATE or DELETE policies — permanent per rewards-levels-accolades.md §7.5

-- --------------------------------------------------------------------------
-- 17. measurements
-- --------------------------------------------------------------------------
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weight', 'height')),
  value REAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "measurements_select" ON measurements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = measurements.child_id AND is_family_member(c.family_id))
  );

CREATE POLICY "measurements_insert" ON measurements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM children c WHERE c.id = measurements.child_id AND is_admin_or_coadmin(c.family_id))
  );

CREATE POLICY "measurements_update" ON measurements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = measurements.child_id AND is_admin_or_coadmin(c.family_id))
  );

CREATE POLICY "measurements_delete" ON measurements
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = measurements.child_id AND is_admin_or_coadmin(c.family_id))
  );

-- --------------------------------------------------------------------------
-- 18. external_activities
-- --------------------------------------------------------------------------
CREATE TABLE external_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schedule TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE external_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_activities_select" ON external_activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = external_activities.child_id AND is_family_member(c.family_id))
  );

CREATE POLICY "external_activities_insert" ON external_activities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM children c WHERE c.id = external_activities.child_id AND is_admin_or_coadmin(c.family_id))
  );

CREATE POLICY "external_activities_update" ON external_activities
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = external_activities.child_id AND is_admin_or_coadmin(c.family_id))
  );

CREATE POLICY "external_activities_delete" ON external_activities
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM children c WHERE c.id = external_activities.child_id AND is_admin_or_coadmin(c.family_id))
  );

-- --------------------------------------------------------------------------
-- 19. Storage buckets
-- --------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('session-media', 'session-media', false);

-- Storage policies: family members can read their family's media
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars' AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "session_media_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'session-media' AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "session_media_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'session-media' AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "session_media_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'session-media' AND (SELECT auth.uid()) IS NOT NULL);

-- --------------------------------------------------------------------------
-- updated_at trigger
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON drills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tracking_elements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tier_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bonus_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON drill_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON external_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

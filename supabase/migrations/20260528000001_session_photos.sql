-- Multi-photo support at the session level.
--
-- Parallel child table to drill_result_photos but parented on sessions instead
-- of drill_results. Same shape: each row is one uploaded photo with a public
-- Storage URL + the bucket-relative path used to delete the underlying object
-- on remove.
--
-- The broken legacy sessions.photo_url values (file://, content://, ph://)
-- were already nulled out by 20260528000000_drill_result_photos.sql — no need
-- to repeat that cleanup here.

CREATE TABLE session_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX session_photos_session_id_idx
  ON session_photos(session_id);

ALTER TABLE session_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_photos_select" ON session_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN children c ON c.id = s.child_id
      WHERE s.id = session_photos.session_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "session_photos_insert" ON session_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN children c ON c.id = s.child_id
      WHERE s.id = session_photos.session_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "session_photos_delete" ON session_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN children c ON c.id = s.child_id
      WHERE s.id = session_photos.session_id
        AND is_family_member(c.family_id)
    )
  );

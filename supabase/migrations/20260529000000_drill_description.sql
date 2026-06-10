-- Drill description: text + photos (up to 10) on the drill template.
--
-- description column on drills holds free text (nullable; null means "no
-- description set"). drill_photos is a 1-to-N child of drills that mirrors
-- the drill_result_photos / session_photos structure: each row is one
-- uploaded Storage object in the private session-media bucket, displayed in
-- the client via short-lived signed URLs.

ALTER TABLE drills ADD COLUMN description TEXT;

CREATE TABLE drill_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id UUID NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX drill_photos_drill_id_idx ON drill_photos(drill_id);

ALTER TABLE drill_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drill_photos_select" ON drill_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM drills d
      JOIN activities a ON a.id = d.activity_id
      JOIN children c ON c.id = a.child_id
      WHERE d.id = drill_photos.drill_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "drill_photos_insert" ON drill_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM drills d
      JOIN activities a ON a.id = d.activity_id
      JOIN children c ON c.id = a.child_id
      WHERE d.id = drill_photos.drill_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "drill_photos_delete" ON drill_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM drills d
      JOIN activities a ON a.id = d.activity_id
      JOIN children c ON c.id = a.child_id
      WHERE d.id = drill_photos.drill_id
        AND is_family_member(c.family_id)
    )
  );

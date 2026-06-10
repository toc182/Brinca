-- Multi-photo support for drills.
--
-- New child table mirrors the element_values 1-to-N pattern. Each row stores a
-- single uploaded photo's public Storage URL + the bucket-relative path so we
-- can delete the underlying object on remove.
--
-- Also cleans up broken legacy local URIs (file://, content://, ph://) that the
-- former single-photo flow used to write into drill_results.photo_url and
-- sessions.photo_url before the upload pipeline was wired. Those values were
-- never real public URLs and are unreachable from any other device.

CREATE TABLE drill_result_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_result_id UUID NOT NULL REFERENCES drill_results(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX drill_result_photos_drill_result_id_idx
  ON drill_result_photos(drill_result_id);

ALTER TABLE drill_result_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drill_result_photos_select" ON drill_result_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM drill_results dr
      JOIN sessions s ON s.id = dr.session_id
      JOIN children c ON c.id = s.child_id
      WHERE dr.id = drill_result_photos.drill_result_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "drill_result_photos_insert" ON drill_result_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM drill_results dr
      JOIN sessions s ON s.id = dr.session_id
      JOIN children c ON c.id = s.child_id
      WHERE dr.id = drill_result_photos.drill_result_id
        AND is_family_member(c.family_id)
    )
  );

CREATE POLICY "drill_result_photos_delete" ON drill_result_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM drill_results dr
      JOIN sessions s ON s.id = dr.session_id
      JOIN children c ON c.id = s.child_id
      WHERE dr.id = drill_result_photos.drill_result_id
        AND is_family_member(c.family_id)
    )
  );

UPDATE drill_results
   SET photo_url = NULL
 WHERE photo_url ~ '^(file|content|ph)://';

UPDATE sessions
   SET photo_url = NULL
 WHERE photo_url ~ '^(file|content|ph)://';

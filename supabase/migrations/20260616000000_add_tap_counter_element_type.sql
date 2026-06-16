-- Allow the new 'tap_counter' tracking element type.
-- Postgres can't modify a CHECK in place, so drop and re-add it with the
-- full 19-type list. The local SQLite mirror has no such constraint, so this
-- only affects sync to Supabase.

ALTER TABLE tracking_elements DROP CONSTRAINT tracking_elements_type_check;

ALTER TABLE tracking_elements ADD CONSTRAINT tracking_elements_type_check
  CHECK (type IN (
    'counter', 'tap_counter', 'combined_counter', 'split_counter', 'multistep_counter',
    'stopwatch', 'countdown_timer', 'lap_timer', 'interval_timer',
    'checklist', 'single_select', 'multi_select', 'yes_no',
    'rating_scale', 'emoji_face_scale',
    'number_input', 'multi_number_input', 'free_text_note', 'voice_note'
  ));

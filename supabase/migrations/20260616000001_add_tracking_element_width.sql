-- Per-element layout width (full default, half optional).
-- Cross-cutting display setting, stored as its own column (not in the
-- type-specific config blob). Local SQLite mirrors the column without the
-- CHECK, same as the type column.

ALTER TABLE tracking_elements
  ADD COLUMN width TEXT NOT NULL DEFAULT 'full'
  CHECK (width IN ('full', 'half'));

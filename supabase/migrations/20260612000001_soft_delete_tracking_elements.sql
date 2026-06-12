-- Soft delete for tracking elements — same rationale as activities/drills:
-- element_values FK tracking_elements with no ON DELETE rule, and stats
-- label past session data from these rows.

alter table public.tracking_elements add column if not exists deleted_at timestamptz;

-- Soft delete for activities and drills.
--
-- Sessions reference activities and drill_results reference drills with no
-- ON DELETE rule, so a hard DELETE is rejected the moment the item has any
-- session history — and stats screens resolve names from these rows for that
-- history anyway. "Deleting" now stamps deleted_at; list queries filter on
-- deleted_at IS NULL, history lookups by id stay unfiltered.

alter table public.activities add column if not exists deleted_at timestamptz;
alter table public.drills add column if not exists deleted_at timestamptz;

/**
 * Migration 0002: Normalize capitalized activity categories to lowercase.
 *
 * Background: an earlier build of CreateActivityScreen stored categories as
 * 'Sport' / 'Therapy' / 'Academic' / 'Custom', but Supabase's
 * activities_category_check constraint requires lowercase values. Affected
 * rows fail to sync with check-constraint error 23514, and drills under
 * those activities then fail RLS (42501) because the parent never lands in
 * Supabase. This migration fixes the local activities table, rewrites the
 * stuck sync_queue payloads, and resets the failed retry state so the next
 * drain succeeds.
 *
 * Idempotent — no-op for devices without bad data.
 */
export const migration = {
  version: 2,
  sql: `
    UPDATE activities
      SET category = LOWER(category)
      WHERE category IN ('Sport', 'Therapy', 'Academic', 'Custom');

    UPDATE sync_queue
      SET payload = json_set(payload, '$.category',
                             LOWER(json_extract(payload, '$.category'))),
          status = 'pending',
          retry_count = 0,
          last_error = NULL
      WHERE table_name = 'activities'
        AND json_extract(payload, '$.category') IN ('Sport', 'Therapy', 'Academic', 'Custom');

    UPDATE sync_queue
      SET status = 'pending', retry_count = 0, last_error = NULL
      WHERE table_name = 'drills'
        AND status = 'failed';
  `,
};

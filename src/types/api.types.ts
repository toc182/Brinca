/**
 * Shared request/response shapes for Supabase operations.
 * Used by repositories and mutations across features.
 */

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Sync queue operation — represents a pending write to Supabase.
 */
export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'pending' | 'in_flight' | 'failed';

export interface SyncQueueEntry {
  id: number;
  operation: SyncOperation;
  tableName: string;
  payload: string;
  status: SyncStatus;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
}

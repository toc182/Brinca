/**
 * Shared request/response shapes — populated as needed per feature.
 */

// Placeholder — will be filled as API contracts are defined in later phases.
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

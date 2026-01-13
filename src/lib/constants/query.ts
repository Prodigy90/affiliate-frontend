/**
 * Centralized React Query configuration constants.
 * Use these instead of hardcoding values in useQuery calls.
 */

/** Default stale time for most queries (30 seconds) */
export const STALE_TIME_DEFAULT = 30_000;

/** Long stale time for rarely-changing data like banks list (24 hours) */
export const STALE_TIME_LONG = 24 * 60 * 60 * 1000;

/** Short stale time for frequently-changing data (10 seconds) */
export const STALE_TIME_SHORT = 10_000;

/** Default retry count for failed queries */
export const QUERY_RETRY_COUNT = 1;

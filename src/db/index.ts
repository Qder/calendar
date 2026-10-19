/**
 * Dexie / IndexedDB wiring arrives in later phases.
 * This phase only validates notifications; no business tables.
 */
export const dbPlaceholder = {
  phase: 'notification-verification',
} as const

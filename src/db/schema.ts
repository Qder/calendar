/** Dexie store definitions and version notes for calendar-local. */

export const DB_NAME = 'calendar-local'

/**
 * Version history:
 * - v1: `_meta` placeholder (stage 0)
 * - v2: events / reminder_rules / scheduled_notifications / settings
 */
export const DB_VERSION = 2

export const STORE_DEFS = {
  _meta: 'key',
  events: 'id, date, updatedAt',
  reminder_rules: 'id, eventId',
  scheduled_notifications: '++id, eventId, ruleId, triggerAt',
  settings: 'key',
} as const

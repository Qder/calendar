/** Dexie store definitions and version notes for calendar-local. */

export const DB_NAME = 'calendar-local'

/**
 * Version history:
 * - v1: `_meta` placeholder (stage 0)
 * - v2: events / reminder_rules / scheduled_notifications / settings
 * - v3: events.recurrence (field); scheduled_notifications.occurrenceDate
 * - v4: courses / periods / semester (stage 4 timetable)
 * - v5: events.reminderKind (alarm | banner; missing → banner)
 */
export const DB_VERSION = 5

export const STORE_DEFS_V2 = {
  _meta: 'key',
  events: 'id, date, updatedAt',
  reminder_rules: 'id, eventId',
  scheduled_notifications: '++id, eventId, ruleId, triggerAt',
  settings: 'key',
} as const

export const STORE_DEFS_V3 = {
  _meta: 'key',
  events: 'id, date, updatedAt',
  reminder_rules: 'id, eventId',
  scheduled_notifications: '++id, eventId, ruleId, occurrenceDate, triggerAt',
  settings: 'key',
} as const

export const STORE_DEFS = {
  _meta: 'key',
  events: 'id, date, updatedAt',
  reminder_rules: 'id, eventId',
  scheduled_notifications: '++id, eventId, ruleId, occurrenceDate, triggerAt',
  settings: 'key',
  courses: 'id, weekday, name, updatedAt',
  periods: 'index',
  semester: 'id',
} as const

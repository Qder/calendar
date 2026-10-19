import Dexie, { type EntityTable } from 'dexie'
import type {
  CalendarEvent,
  ReminderRule,
  ScheduledNotification,
  SettingsRow,
} from '@/domain/schemas'
import { DB_NAME, STORE_DEFS, STORE_DEFS_V2 } from './schema'

export class CalendarDb extends Dexie {
  _meta!: EntityTable<{ key: string; value: string }, 'key'>
  events!: EntityTable<CalendarEvent, 'id'>
  reminder_rules!: EntityTable<ReminderRule, 'id'>
  scheduled_notifications!: EntityTable<
    Omit<ScheduledNotification, 'id'> & { id?: number },
    'id'
  >
  settings!: EntityTable<SettingsRow, 'key'>

  constructor() {
    super(DB_NAME)
    // Keep v1 so existing IndexedDB installs upgrade cleanly.
    this.version(1).stores({
      _meta: 'key',
    })
    this.version(2).stores(STORE_DEFS_V2)
    this.version(3)
      .stores(STORE_DEFS)
      .upgrade(async (tx) => {
        // Drop legacy scheduled rows (no occurrenceDate); rebuildAll refills on launch.
        await tx.table('scheduled_notifications').clear()
        // Default recurrence for events created in stage 2.
        await tx
          .table('events')
          .toCollection()
          .modify((ev: Record<string, unknown>) => {
            if (ev.recurrence == null) ev.recurrence = 'none'
          })
      })
  }
}

export const db = new CalendarDb()

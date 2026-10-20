import Dexie, { type EntityTable } from 'dexie'
import type {
  CalendarEvent,
  CourseRow,
  PeriodRow,
  ReminderRule,
  ScheduledNotification,
  SemesterRow,
  SettingsRow,
} from '@/domain/schemas'
import { DB_NAME, STORE_DEFS, STORE_DEFS_V2, STORE_DEFS_V3 } from './schema'

export class CalendarDb extends Dexie {
  _meta!: EntityTable<{ key: string; value: string }, 'key'>
  events!: EntityTable<CalendarEvent, 'id'>
  reminder_rules!: EntityTable<ReminderRule, 'id'>
  scheduled_notifications!: EntityTable<
    Omit<ScheduledNotification, 'id'> & { id?: number },
    'id'
  >
  settings!: EntityTable<SettingsRow, 'key'>
  courses!: EntityTable<CourseRow, 'id'>
  periods!: EntityTable<PeriodRow, 'index'>
  semester!: EntityTable<SemesterRow, 'id'>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      _meta: 'key',
    })
    this.version(2).stores(STORE_DEFS_V2)
    this.version(3)
      .stores(STORE_DEFS_V3)
      .upgrade(async (tx) => {
        await tx.table('scheduled_notifications').clear()
        await tx
          .table('events')
          .toCollection()
          .modify((ev: Record<string, unknown>) => {
            if (ev.recurrence == null) ev.recurrence = 'none'
          })
      })
    this.version(4).stores(STORE_DEFS)
    this.version(5)
      .stores(STORE_DEFS)
      .upgrade(async (tx) => {
        await tx
          .table('events')
          .toCollection()
          .modify((ev: Record<string, unknown>) => {
            if (ev.reminderKind !== 'alarm' && ev.reminderKind !== 'banner') {
              ev.reminderKind = 'banner'
            }
          })
      })
  }
}

export const db = new CalendarDb()

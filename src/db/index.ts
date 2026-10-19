import Dexie, { type EntityTable } from 'dexie'

/**
 * Dexie shell for later phases. No business tables yet
 * (events / courses land after stage 0).
 */
export class CalendarDb extends Dexie {
  // Placeholder typed store so Dexie is wired without CRUD APIs.
  _meta!: EntityTable<{ key: string; value: string }, 'key'>

  constructor() {
    super('calendar-local')
    this.version(1).stores({
      _meta: 'key',
    })
  }
}

export const db = new CalendarDb()

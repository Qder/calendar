import { db } from '@/db'
import type { CalendarEvent } from '@/domain/schemas'

export async function listEvents(): Promise<CalendarEvent[]> {
  return db.events.orderBy('date').toArray()
}

export async function listEventsInRange(
  fromYmd: string,
  toYmd: string,
): Promise<CalendarEvent[]> {
  return db.events
    .where('date')
    .between(fromYmd, toYmd, true, true)
    .toArray()
}

export async function getEvent(id: string): Promise<CalendarEvent | undefined> {
  return db.events.get(id)
}

export async function putEvent(event: CalendarEvent): Promise<void> {
  await db.events.put(event)
}

export async function deleteEvent(id: string): Promise<void> {
  await db.events.delete(id)
}

import { db } from '@/db'
import type { ScheduledNotification } from '@/domain/schemas'

export async function listScheduledForEvent(
  eventId: string,
): Promise<ScheduledNotification[]> {
  const rows = await db.scheduled_notifications
    .where('eventId')
    .equals(eventId)
    .toArray()
  return rows.filter((r): r is ScheduledNotification => typeof r.id === 'number')
}

export async function listAllScheduled(): Promise<ScheduledNotification[]> {
  const rows = await db.scheduled_notifications.toArray()
  return rows.filter((r): r is ScheduledNotification => typeof r.id === 'number')
}

export async function insertScheduled(row: {
  eventId: string
  ruleId: string
  occurrenceDate: string
  triggerAt: number
}): Promise<number> {
  const id = await db.scheduled_notifications.add(row)
  return id as number
}

export async function deleteScheduledById(id: number): Promise<void> {
  await db.scheduled_notifications.delete(id)
}

export async function deleteScheduledForEvent(eventId: string): Promise<number[]> {
  const rows = await listScheduledForEvent(eventId)
  const ids = rows.map((r) => r.id)
  await db.scheduled_notifications.where('eventId').equals(eventId).delete()
  return ids
}

export async function getScheduledById(
  id: number,
): Promise<ScheduledNotification | undefined> {
  const row = await db.scheduled_notifications.get(id)
  if (!row || typeof row.id !== 'number') return undefined
  return row as ScheduledNotification
}

/** Idempotency lookup: same event+rule+occurrence+triggerAt. */
export async function findScheduledDuplicate(args: {
  eventId: string
  ruleId: string
  occurrenceDate: string
  triggerAt: number
}): Promise<ScheduledNotification | undefined> {
  const rows = await db.scheduled_notifications
    .where('eventId')
    .equals(args.eventId)
    .toArray()
  return rows.find(
    (r): r is ScheduledNotification =>
      typeof r.id === 'number' &&
      r.ruleId === args.ruleId &&
      r.occurrenceDate === args.occurrenceDate &&
      r.triggerAt === args.triggerAt,
  )
}

/** Drop every scheduled row (debug cancel-all / full reset). */
export async function clearAllScheduled(): Promise<void> {
  await db.scheduled_notifications.clear()
}

import { db } from '@/db'
import type { ReminderRule } from '@/domain/schemas'

export async function listRulesForEvent(eventId: string): Promise<ReminderRule[]> {
  return db.reminder_rules.where('eventId').equals(eventId).toArray()
}

export async function putRule(rule: ReminderRule): Promise<void> {
  await db.reminder_rules.put(rule)
}

export async function deleteRulesForEvent(eventId: string): Promise<void> {
  await db.reminder_rules.where('eventId').equals(eventId).delete()
}

export async function deleteRule(id: string): Promise<void> {
  await db.reminder_rules.delete(id)
}

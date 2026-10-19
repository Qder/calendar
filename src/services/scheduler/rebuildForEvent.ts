import {
  deleteRulesForEvent,
  listRulesForEvent,
  putRule,
} from '@/db/repos/reminderRules'
import {
  deleteScheduledById,
  deleteScheduledForEvent,
  insertScheduled,
} from '@/db/repos/scheduledNotifications'
import { computeTriggerAt } from '@/domain/reminders'
import type { CalendarEvent, ReminderRule } from '@/domain/schemas'
import { getNotificationService } from '@/services/notification'

function reminderBody(daysBefore: number, eventDate: string): string {
  if (daysBefore === 0) return `今天 · ${eventDate}`
  return `提前 ${daysBefore} 天 · ${eventDate}`
}

/**
 * Cancel every OS notification + DB row for an event, then reschedule
 * from current reminder rules. Past triggers are skipped.
 *
 * Business code must only call NotificationService — no platform checks here.
 */
export async function cancelScheduledForEvent(eventId: string): Promise<void> {
  const ids = await deleteScheduledForEvent(eventId)
  const svc = getNotificationService()
  for (const id of ids) {
    try {
      await svc.cancel(id)
    } catch (err) {
      console.warn('[scheduler] cancel failed', id, err)
    }
  }
}

export async function rebuildForEvent(event: CalendarEvent): Promise<void> {
  await cancelScheduledForEvent(event.id)

  const rules = await listRulesForEvent(event.id)
  const svc = getNotificationService()
  const now = new Date()

  for (const rule of rules) {
    const triggerAt = computeTriggerAt(
      event.date,
      rule.daysBefore,
      rule.time,
      now,
    )
    if (!triggerAt) continue

    const notificationId = await insertScheduled({
      eventId: event.id,
      ruleId: rule.id,
      triggerAt: triggerAt.getTime(),
    })

    try {
      await svc.schedule({
        id: notificationId,
        title: event.title,
        body: reminderBody(rule.daysBefore, event.date),
        triggerAt,
      })
    } catch (err) {
      // Avoid orphan DB rows when the OS schedule fails.
      await deleteScheduledById(notificationId)
      console.warn('[scheduler] schedule failed, rolled back row', notificationId, err)
      throw err
    }
  }
}

/** Replace the single stage-2 reminder rule for an event, then rebuild. */
export async function setSingleReminderAndRebuild(
  event: CalendarEvent,
  reminder: { daysBefore: number; time: string } | null,
): Promise<void> {
  await deleteRulesForEvent(event.id)
  if (reminder) {
    const rule: ReminderRule = {
      id: `${event.id}-r0`,
      eventId: event.id,
      daysBefore: reminder.daysBefore,
      time: reminder.time,
    }
    await putRule(rule)
  }
  await rebuildForEvent(event)
}

/** Full delete: cancel notifications, drop rules + scheduled rows (caller drops event). */
export async function teardownEventReminders(eventId: string): Promise<void> {
  await cancelScheduledForEvent(eventId)
  await deleteRulesForEvent(eventId)
}

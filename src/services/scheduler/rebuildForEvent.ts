import { listEvents } from '@/db/repos/events'
import {
  deleteRulesForEvent,
  listRulesForEvent,
  putRule,
} from '@/db/repos/reminderRules'
import {
  deleteScheduledById,
  deleteScheduledForEvent,
  findScheduledDuplicate,
  insertScheduled,
} from '@/db/repos/scheduledNotifications'
import { addDaysYmd, todayYmd } from '@/domain/date'
import { maxDaysBefore, planTriggers } from '@/domain/reminders'
import type { RecurrenceFreq } from '@/domain/recurrence'
import type { CalendarEvent, ReminderRule } from '@/domain/schemas'
import { getNotificationService } from '@/services/notification'
import { MAX_SCHEDULED, WINDOW_DAYS } from './constants'

function reminderBody(daysBefore: number, occurrenceDate: string): string {
  if (daysBefore === 0) return `今天 · ${occurrenceDate}`
  return `提前 ${daysBefore} 天 · ${occurrenceDate}`
}

function eventRecurrence(event: CalendarEvent): RecurrenceFreq {
  return (event.recurrence ?? 'none') as RecurrenceFreq
}

/**
 * Cancel every OS notification + DB row for an event.
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

/**
 * Cancel then reschedule for one event within the rolling WINDOW_DAYS window.
 * Caps at MAX_SCHEDULED nearest triggers. Skips past triggers.
 */
export async function rebuildForEvent(event: CalendarEvent): Promise<void> {
  await cancelScheduledForEvent(event.id)

  const rules = await listRulesForEvent(event.id)
  if (rules.length === 0) return

  const now = new Date()
  const fromYmd = todayYmd(now)
  // Occurrence expand extends past WINDOW by max daysBefore so early reminders
  // for later occurrences still land inside the trigger window.
  const expandDays = WINDOW_DAYS + maxDaysBefore(rules)
  const toYmd = addDaysYmd(fromYmd, expandDays)
  const windowEndMs = now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000

  let planned = planTriggers({
    startYmd: event.date,
    recurrence: eventRecurrence(event),
    rules,
    fromYmd,
    toYmd,
    now,
    windowEndMs,
  })

  if (planned.length > MAX_SCHEDULED) {
    console.warn(
      `[scheduler] event ${event.id}: ${planned.length} triggers exceeds MAX_SCHEDULED=${MAX_SCHEDULED}; keeping nearest`,
    )
    planned = planned.slice(0, MAX_SCHEDULED)
  }

  const svc = getNotificationService()

  for (const item of planned) {
    // Defensive idempotency (cancel-first already clears; still guard duplicates).
    const dup = await findScheduledDuplicate({
      eventId: event.id,
      ruleId: item.ruleId,
      occurrenceDate: item.occurrenceDate,
      triggerAt: item.triggerAt.getTime(),
    })
    if (dup) continue

    const notificationId = await insertScheduled({
      eventId: event.id,
      ruleId: item.ruleId,
      occurrenceDate: item.occurrenceDate,
      triggerAt: item.triggerAt.getTime(),
    })

    try {
      await svc.schedule({
        id: notificationId,
        title: event.title,
        body: reminderBody(item.daysBefore, item.occurrenceDate),
        triggerAt: item.triggerAt,
      })
    } catch (err) {
      await deleteScheduledById(notificationId)
      console.warn(
        '[scheduler] schedule failed, rolled back row',
        notificationId,
        err,
      )
      throw err
    }
  }
}

/** Replace all reminder rules for an event, then rebuild. */
export async function setRemindersAndRebuild(
  event: CalendarEvent,
  reminders: { daysBefore: number; time: string }[],
): Promise<void> {
  await deleteRulesForEvent(event.id)
  for (let i = 0; i < reminders.length; i++) {
    const r = reminders[i]
    const rule: ReminderRule = {
      id: `${event.id}-r${i}`,
      eventId: event.id,
      daysBefore: r.daysBefore,
      time: r.time,
    }
    await putRule(rule)
  }
  await rebuildForEvent(event)
}

/** @deprecated stage-2 name; prefer setRemindersAndRebuild */
export async function setSingleReminderAndRebuild(
  event: CalendarEvent,
  reminder: { daysBefore: number; time: string } | null,
): Promise<void> {
  await setRemindersAndRebuild(event, reminder ? [reminder] : [])
}

/** Full delete: cancel notifications, drop rules + scheduled rows (caller drops event). */
export async function teardownEventReminders(eventId: string): Promise<void> {
  await cancelScheduledForEvent(eventId)
  await deleteRulesForEvent(eventId)
}

/**
 * Refill the rolling window for every event (start / foreground).
 * Each event is cancel-then-rebuild → no duplicate OS notifications.
 */
export async function rebuildAllScheduled(): Promise<void> {
  const events = await listEvents()
  for (const event of events) {
    try {
      await rebuildForEvent(event)
    } catch (err) {
      console.warn('[scheduler] rebuildAll failed for', event.id, err)
    }
  }
}

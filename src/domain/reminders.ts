import { addDaysYmd, combineYmdHm } from './date'
import type { RecurrenceFreq } from './recurrence'
import { expandOccurrences } from './recurrence'
import type { ReminderRule } from './schemas'

/**
 * Compute the absolute local trigger instant for a reminder:
 * eventDate (YYYY-MM-DD) minus daysBefore, at remindTime (HH:mm).
 *
 * Returns null when the trigger is at or before `now` (skip past).
 */
export function computeTriggerAt(
  eventDate: string,
  daysBefore: number,
  remindTime: string,
  now: Date = new Date(),
): Date | null {
  if (!Number.isInteger(daysBefore) || daysBefore < 0) {
    throw new RangeError(`daysBefore must be a non-negative integer, got ${daysBefore}`)
  }
  const triggerYmd = addDaysYmd(eventDate, -daysBefore)
  const triggerAt = combineYmdHm(triggerYmd, remindTime)
  if (triggerAt.getTime() <= now.getTime()) return null
  return triggerAt
}

export interface PlannedTrigger {
  ruleId: string
  occurrenceDate: string
  daysBefore: number
  triggerAt: Date
}

/**
 * Max daysBefore across rules (0 when empty). Used to extend occurrence expand
 * so reminders that fire inside the schedule window for later occurrences are kept.
 */
export function maxDaysBefore(rules: { daysBefore: number }[]): number {
  let max = 0
  for (const r of rules) {
    if (r.daysBefore > max) max = r.daysBefore
  }
  return max
}

/**
 * Expand occurrences in an extended window, then keep only triggers whose
 * triggerAt falls in (now, windowEndMs]. Sorted by triggerAt ascending.
 *
 * Callers typically pass:
 * - fromYmd = today
 * - toYmd = today + WINDOW_DAYS + maxDaysBefore(rules)  (occurrence upper bound)
 * - windowEndMs = now + WINDOW_DAYS (trigger cutoff)
 */
export function planTriggers(args: {
  startYmd: string
  recurrence: RecurrenceFreq
  rules: ReminderRule[]
  fromYmd: string
  toYmd: string
  now?: Date
  /** Exclusive upper bound for triggerAt; defaults to no extra cutoff beyond computeTriggerAt past-skip. */
  windowEndMs?: number
}): PlannedTrigger[] {
  const now = args.now ?? new Date()
  const nowMs = now.getTime()
  const windowEndMs = args.windowEndMs

  const occurrences = expandOccurrences(
    args.startYmd,
    args.recurrence,
    args.fromYmd,
    args.toYmd,
  )
  const planned: PlannedTrigger[] = []
  for (const occurrenceDate of occurrences) {
    for (const rule of args.rules) {
      const triggerAt = computeTriggerAt(
        occurrenceDate,
        rule.daysBefore,
        rule.time,
        now,
      )
      if (!triggerAt) continue
      const t = triggerAt.getTime()
      if (t <= nowMs) continue
      if (windowEndMs != null && t > windowEndMs) continue
      planned.push({
        ruleId: rule.id,
        occurrenceDate,
        daysBefore: rule.daysBefore,
        triggerAt,
      })
    }
  }
  planned.sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime())
  return planned
}

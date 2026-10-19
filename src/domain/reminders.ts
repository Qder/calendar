import { addDaysYmd, combineYmdHm } from './date'

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

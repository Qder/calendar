/**
 * Pure helpers for computing local trigger instants.
 * Kept in domain/ so notification UIs and services share one clock rule.
 */

/** Add milliseconds to a Date; returns a new Date (local wall-clock). */
export function addMs(from: Date, ms: number): Date {
  return new Date(from.getTime() + ms)
}

/** Clamp notification id into signed 32-bit int range (Android LocalNotifications). */
export function toNotificationId(n: number): number {
  const INT32_MIN = -2147483648
  const INT32_MAX = 2147483647
  if (!Number.isInteger(n) || n < INT32_MIN || n > INT32_MAX) {
    throw new RangeError(`notification id must be a 32-bit integer, got ${n}`)
  }
  return n
}

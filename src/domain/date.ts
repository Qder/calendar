/**
 * Local-calendar day helpers (YYYY-MM-DD).
 * Always use local wall-clock — never UTC getters for calendar dates.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

/** Today as YYYY-MM-DD in local timezone. */
export function todayYmd(now: Date = new Date()): string {
  return formatYmd(now)
}

/** Format a Date as YYYY-MM-DD using local year/month/day. */
export function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD into a local Date at 00:00:00.000. */
export function parseYmd(ymd: string): Date {
  if (!DATE_RE.test(ymd)) {
    throw new RangeError(`invalid YYYY-MM-DD: ${ymd}`)
  }
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0)
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    throw new RangeError(`invalid calendar date: ${ymd}`)
  }
  return dt
}

/** Add (or subtract) whole days to a YYYY-MM-DD string; returns YYYY-MM-DD. */
export function addDaysYmd(ymd: string, days: number): string {
  const d = parseYmd(ymd)
  d.setDate(d.getDate() + days)
  return formatYmd(d)
}

/** Parse HH:mm into { hours, minutes }. */
export function parseHm(hm: string): { hours: number; minutes: number } {
  if (!TIME_RE.test(hm)) {
    throw new RangeError(`invalid HH:mm: ${hm}`)
  }
  const [hours, minutes] = hm.split(':').map(Number)
  if (hours > 23 || minutes > 59) {
    throw new RangeError(`invalid HH:mm: ${hm}`)
  }
  return { hours, minutes }
}

/** Combine YYYY-MM-DD + HH:mm into a local Date. */
export function combineYmdHm(ymd: string, hm: string): Date {
  const base = parseYmd(ymd)
  const { hours, minutes } = parseHm(hm)
  base.setHours(hours, minutes, 0, 0)
  return base
}

/** First day of the month containing ymd (still YYYY-MM-DD). */
export function startOfMonthYmd(ymd: string): string {
  const d = parseYmd(ymd)
  d.setDate(1)
  return formatYmd(d)
}

/** Last day of the month containing ymd. */
export function endOfMonthYmd(ymd: string): string {
  const d = parseYmd(ymd)
  d.setMonth(d.getMonth() + 1, 0)
  return formatYmd(d)
}

/** Shift a YYYY-MM-DD by N calendar months (day clamped to month length). */
export function addMonthsYmd(ymd: string, months: number): string {
  const d = parseYmd(ymd)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return formatYmd(d)
}

/** Monday-based weekday index 0=Mon … 6=Sun for a YYYY-MM-DD. */
export function weekdayMon0(ymd: string): number {
  const js = parseYmd(ymd).getDay() // 0=Sun
  return js === 0 ? 6 : js - 1
}

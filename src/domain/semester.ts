import { addDaysYmd, formatYmd, parseYmd, weekdayMon0 } from './date'

/** Weekday: 1=Monday … 7=Sunday (ISO-ish). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface SemesterConfig {
  /** First teaching week Monday as YYYY-MM-DD (must be Monday). */
  startMonday: string
  /** Total teaching weeks (≥1). */
  totalWeeks: number
}

export function assertMonday(ymd: string): void {
  if (weekdayMon0(ymd) !== 0) {
    throw new RangeError(`semester start must be a Monday, got ${ymd}`)
  }
}

export function assertSemester(config: SemesterConfig): void {
  assertMonday(config.startMonday)
  if (!Number.isInteger(config.totalWeeks) || config.totalWeeks < 1) {
    throw new RangeError(`totalWeeks must be a positive integer, got ${config.totalWeeks}`)
  }
}

/**
 * Convert (1-based weekIndex, weekday 1=Mon…7=Sun) → YYYY-MM-DD.
 * weekIndex must be in 1..totalWeeks.
 */
export function weekIndexToDate(
  config: SemesterConfig,
  weekIndex: number,
  weekday: Weekday,
): string {
  assertSemester(config)
  if (!Number.isInteger(weekIndex) || weekIndex < 1 || weekIndex > config.totalWeeks) {
    throw new RangeError(
      `weekIndex out of range 1..${config.totalWeeks}: ${weekIndex}`,
    )
  }
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    throw new RangeError(`weekday must be 1..7, got ${weekday}`)
  }
  const offset = (weekIndex - 1) * 7 + (weekday - 1)
  return addDaysYmd(config.startMonday, offset)
}

/**
 * Map a calendar date to 1-based week index, or null if outside the semester.
 */
export function dateToWeekIndex(
  config: SemesterConfig,
  ymd: string,
): number | null {
  assertSemester(config)
  const start = parseYmd(config.startMonday)
  const d = parseYmd(ymd)
  const diffMs = d.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays < 0) return null
  const weekIndex = Math.floor(diffDays / 7) + 1
  if (weekIndex < 1 || weekIndex > config.totalWeeks) return null
  return weekIndex
}

/** Weekday 1=Mon…7=Sun for a YYYY-MM-DD. */
export function weekdayOfYmd(ymd: string): Weekday {
  return (weekdayMon0(ymd) + 1) as Weekday
}

/** Monday YYYY-MM-DD of the teaching week containing `ymd` (may be outside semester). */
export function mondayOfWeekContaining(ymd: string): string {
  const mon0 = weekdayMon0(ymd)
  return addDaysYmd(ymd, -mon0)
}

/** Today's week index in semester, or null. */
export function currentWeekIndex(
  config: SemesterConfig,
  today: string = formatYmd(new Date()),
): number | null {
  return dateToWeekIndex(config, today)
}

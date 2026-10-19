import type { SemesterConfig, Weekday } from './semester'
import { weekIndexToDate } from './semester'

/**
 * Map a course meeting (semester start Monday, 1-based week, weekday) → YYYY-MM-DD.
 * Thin wrapper over weekIndexToDate for importer / week view call sites.
 */
export function courseMeetingDate(
  semesterStartMonday: string,
  totalWeeks: number,
  weekIndex: number,
  weekday: Weekday,
): string {
  const config: SemesterConfig = {
    startMonday: semesterStartMonday,
    totalWeeks,
  }
  return weekIndexToDate(config, weekIndex, weekday)
}

/** Expand one course row's week list × weekday into concrete YYYY-MM-DD dates. */
export function expandCourseDates(args: {
  semesterStartMonday: string
  totalWeeks: number
  weeks: number[]
  weekday: Weekday
}): string[] {
  return args.weeks.map((w) =>
    courseMeetingDate(
      args.semesterStartMonday,
      args.totalWeeks,
      w,
      args.weekday,
    ),
  )
}

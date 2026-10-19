import { clearCourses, putCourses } from '@/db/repos/courses'
import type { CourseRow } from '@/domain/schemas'
import type { PreviewRowOk } from './preview'

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export type ImportMode = 'overwrite' | 'append'

export async function commitCoursePreview(
  okRows: PreviewRowOk[],
  mode: ImportMode,
): Promise<CourseRow[]> {
  const now = Date.now()
  const courses: CourseRow[] = okRows.map((r) => ({
    id: newId(),
    name: r.draft.name,
    weekday: r.draft.weekday,
    startPeriod: r.draft.startPeriod,
    endPeriod: r.draft.endPeriod,
    weeks: r.weeks,
    weeksRaw: r.draft.weeksRaw,
    room: r.draft.room ?? '',
    teacher: r.draft.teacher ?? '',
    createdAt: now,
    updatedAt: now,
  }))

  if (mode === 'overwrite') {
    await clearCourses()
  }
  await putCourses(courses)
  return courses
}

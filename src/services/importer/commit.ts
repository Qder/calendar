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

/** Strip Vue Proxy / reactive wrappers into IDB-clonable POJOs. */
export function previewRowsToCourses(
  okRows: PreviewRowOk[],
  now = Date.now(),
): CourseRow[] {
  return okRows.map((r) => ({
    id: newId(),
    name: String(r.draft.name),
    weekday: Number(r.draft.weekday),
    startPeriod: Number(r.draft.startPeriod),
    endPeriod: Number(r.draft.endPeriod),
    // Proxy 数组不能 structuredClone → Dexie put 会 DataCloneError
    weeks: Array.from(r.weeks as Iterable<number>),
    weeksRaw: String(r.draft.weeksRaw),
    room: String(r.draft.room ?? ''),
    teacher: String(r.draft.teacher ?? ''),
    createdAt: now,
    updatedAt: now,
  }))
}

export async function commitCoursePreview(
  okRows: PreviewRowOk[],
  mode: ImportMode,
): Promise<CourseRow[]> {
  const courses = previewRowsToCourses(okRows)

  if (mode === 'overwrite') {
    await clearCourses()
  }
  await putCourses(courses)
  return courses
}

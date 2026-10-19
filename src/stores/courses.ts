import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  deleteCourse,
  getCourse,
  listCourses,
  putCourse,
} from '@/db/repos/courses'
import {
  buildCourseRow,
  type CourseDraftInput,
} from '@/domain/courseDraft'
import type { CourseRow } from '@/domain/schemas'
import {
  commitCoursePreview,
  type ImportMode,
} from '@/services/importer/commit'
import type { PreviewRowOk } from '@/services/importer/preview'

export const useCoursesStore = defineStore('courses', () => {
  const items = ref<CourseRow[]>([])
  const loading = ref(false)

  async function refresh(): Promise<void> {
    loading.value = true
    try {
      items.value = await listCourses()
    } finally {
      loading.value = false
    }
  }

  async function load(id: string): Promise<CourseRow | undefined> {
    return getCourse(id)
  }

  /**
   * Create or update a course from form draft.
   * Always writes a plain POJO (weeks as real Array).
   */
  async function save(
    input: CourseDraftInput,
    opts: {
      totalWeeks: number
      periodIndices: Iterable<number>
      id?: string
    },
  ): Promise<CourseRow> {
    let createdAt: number | undefined
    if (opts.id) {
      const existing = await getCourse(opts.id)
      createdAt = existing?.createdAt
    }
    const row = buildCourseRow(input, {
      totalWeeks: opts.totalWeeks,
      periodIndices: opts.periodIndices,
      id: opts.id,
      createdAt,
    })
    await putCourse(row)
    await refresh()
    return row
  }

  async function importOkRows(
    rows: PreviewRowOk[],
    mode: ImportMode,
  ): Promise<number> {
    const saved = await commitCoursePreview(rows, mode)
    await refresh()
    return saved.length
  }

  async function remove(id: string): Promise<void> {
    await deleteCourse(id)
    await refresh()
  }

  /** Courses that meet on a given teaching week index. */
  function inWeek(weekIndex: number): CourseRow[] {
    return items.value.filter((c) => c.weeks.includes(weekIndex))
  }

  /**
   * Read-only: courses meeting on a calendar day.
   * weekIndex null (outside semester) → empty.
   */
  function meetingOn(weekIndex: number | null, weekday: number): CourseRow[] {
    if (weekIndex == null) return []
    return items.value
      .filter((c) => c.weekday === weekday && c.weeks.includes(weekIndex))
      .slice()
      .sort((a, b) => a.startPeriod - b.startPeriod)
  }

  return {
    items,
    loading,
    refresh,
    load,
    save,
    importOkRows,
    remove,
    inWeek,
    meetingOn,
  }
})

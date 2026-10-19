import { defineStore } from 'pinia'
import { ref } from 'vue'
import { deleteCourse, listCourses } from '@/db/repos/courses'
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

  return {
    items,
    loading,
    refresh,
    importOkRows,
    remove,
    inWeek,
  }
})

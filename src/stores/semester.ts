import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSemester, putSemester } from '@/db/repos/semester'
import {
  listPeriods,
  resetPeriodsToDefault,
  savePeriods,
} from '@/db/repos/periods'
import { assertMonday } from '@/domain/semester'
import type { PeriodRow, SemesterRow } from '@/domain/schemas'
import { currentWeekIndex } from '@/domain/semester'

export const useSemesterStore = defineStore('semester', () => {
  const semester = ref<SemesterRow | null>(null)
  const periods = ref<PeriodRow[]>([])
  const loaded = ref(false)

  const totalWeeks = computed(() => semester.value?.totalWeeks ?? 16)
  const startMonday = computed(() => semester.value?.startMonday ?? '')

  async function load(): Promise<void> {
    semester.value = (await getSemester()) ?? null
    periods.value = await listPeriods()
    loaded.value = true
  }

  async function saveSemester(start: string, total: number): Promise<void> {
    assertMonday(start)
    semester.value = await putSemester(start, total)
  }

  async function savePeriodTable(next: PeriodRow[]): Promise<void> {
    await savePeriods(next)
    periods.value = next
  }

  async function resetPeriods(): Promise<void> {
    periods.value = await resetPeriodsToDefault()
  }

  function weekIndexToday(today?: string): number | null {
    if (!semester.value) return null
    return currentWeekIndex(
      {
        startMonday: semester.value.startMonday,
        totalWeeks: semester.value.totalWeeks,
      },
      today,
    )
  }

  return {
    semester,
    periods,
    loaded,
    totalWeeks,
    startMonday,
    load,
    saveSemester,
    savePeriodTable,
    resetPeriods,
    weekIndexToday,
  }
})

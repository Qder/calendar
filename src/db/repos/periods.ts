import { db } from '@/db'
import { DEFAULT_PERIODS } from '@/domain/periods'
import type { PeriodRow } from '@/domain/schemas'

export async function listPeriods(): Promise<PeriodRow[]> {
  const rows = await db.periods.orderBy('index').toArray()
  if (rows.length === 0) return DEFAULT_PERIODS.map((p) => ({ ...p }))
  return rows
}

export async function savePeriods(periods: PeriodRow[]): Promise<void> {
  await db.transaction('rw', db.periods, async () => {
    await db.periods.clear()
    await db.periods.bulkPut(periods)
  })
}

export async function resetPeriodsToDefault(): Promise<PeriodRow[]> {
  const defaults = DEFAULT_PERIODS.map((p) => ({ ...p }))
  await savePeriods(defaults)
  return defaults
}

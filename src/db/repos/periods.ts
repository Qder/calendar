import { db } from '@/db'
import { assertPeriodTimes, DEFAULT_PERIODS } from '@/domain/periods'
import { PeriodSchema, type PeriodRow } from '@/domain/schemas'

export async function listPeriods(): Promise<PeriodRow[]> {
  const rows = await db.periods.orderBy('index').toArray()
  if (rows.length === 0) return DEFAULT_PERIODS.map((p) => ({ ...p }))
  return rows
}

export async function savePeriods(periods: PeriodRow[]): Promise<void> {
  assertPeriodTimes(periods)
  const parsed = periods.map((p, i) => {
    const r = PeriodSchema.safeParse(p)
    if (!r.success) {
      const msg = r.error.issues.map((x) => x.message).join('；')
      throw new Error(`第${p.index ?? i + 1}节：${msg}`)
    }
    // Zod 已产出新对象；再浅拷贝一层，避免 reactive Proxy 进 IDB
    const d = r.data
    return {
      index: Number(d.index),
      start: String(d.start),
      end: String(d.end),
      ...(d.label !== undefined ? { label: String(d.label) } : {}),
    } satisfies PeriodRow
  })
  await db.transaction('rw', db.periods, async () => {
    await db.periods.clear()
    await db.periods.bulkPut(parsed)
  })
}

export async function resetPeriodsToDefault(): Promise<PeriodRow[]> {
  const defaults = DEFAULT_PERIODS.map((p) => ({ ...p }))
  await savePeriods(defaults)
  return defaults
}

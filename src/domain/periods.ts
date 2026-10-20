/** One class period slot (local HH:mm). */
export interface PeriodSlot {
  /** 1-based period index. */
  index: number
  start: string
  end: string
  label?: string
}

/** Default mainland-CN style slots (editable in settings). */
export const DEFAULT_PERIODS: PeriodSlot[] = [
  { index: 1, start: '08:00', end: '08:45', label: '第1节' },
  { index: 2, start: '08:55', end: '09:40', label: '第2节' },
  { index: 3, start: '10:00', end: '10:45', label: '第3节' },
  { index: 4, start: '10:55', end: '11:40', label: '第4节' },
  { index: 5, start: '14:00', end: '14:45', label: '第5节' },
  { index: 6, start: '14:55', end: '15:40', label: '第6节' },
  { index: 7, start: '16:00', end: '16:45', label: '第7节' },
  { index: 8, start: '16:55', end: '17:40', label: '第8节' },
  { index: 9, start: '19:00', end: '19:45', label: '第9节' },
  { index: 10, start: '19:55', end: '20:40', label: '第10节' },
  { index: 11, start: '20:50', end: '21:35', label: '第11节' },
  { index: 12, start: '21:45', end: '22:30', label: '第12节' },
]

export function periodByIndex(
  periods: PeriodSlot[],
  index: number,
): PeriodSlot | undefined {
  return periods.find((p) => p.index === index)
}

/** Lexicographic HH:mm compare; both must be zero-padded. */
export function isHmBefore(start: string, end: string): boolean {
  return /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && start < end
}

/** Reject any slot whose start is not strictly before end. */
export function assertPeriodTimes(periods: PeriodSlot[]): void {
  for (const p of periods) {
    if (!/^\d{2}:\d{2}$/.test(p.start) || !/^\d{2}:\d{2}$/.test(p.end)) {
      throw new Error(`第${p.index}节时间格式须为 HH:mm`)
    }
    if (!isHmBefore(p.start, p.end)) {
      throw new Error(`第${p.index}节开始时刻须早于结束时刻（${p.start} < ${p.end}）`)
    }
  }
}

export function periodIndexSet(periods: PeriodSlot[]): Set<number> {
  return new Set(periods.map((p) => p.index))
}


/** Default lesson length when migration cannot infer (minutes). */
export const DEFAULT_PERIOD_DURATION_MIN = 45

export function hmToMinutes(hm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hm)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function minutesToHm(total: number): string {
  const h = Math.floor(total / 60)
  const min = total % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/**
 * start + durationMinutes → end (HH:mm).
 * Rejects non-positive duration and overnight wrap (same-day only).
 */
export function endHmFromStart(
  start: string,
  durationMinutes: number,
): string {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error('每节时长须为正整数分钟')
  }
  const mins = Math.floor(durationMinutes)
  const startMin = hmToMinutes(start)
  if (startMin == null) {
    throw new Error(`开始时刻格式须为 HH:mm（${start}）`)
  }
  const endMin = startMin + mins
  if (endMin > 24 * 60 - 1) {
    throw new Error(
      `结束会跨天（${start} + ${mins} 分钟），请改开始或缩短时长`,
    )
  }
  if (endMin <= startMin) {
    throw new Error('结束时刻须晚于开始时刻')
  }
  return minutesToHm(endMin)
}

/** Infer shared duration from period 1 (end−start); else default 45. */
export function inferPeriodDurationMinutes(
  periods: PeriodSlot[],
): number {
  const first = periods.find((p) => p.index === 1) ?? periods[0]
  if (!first) return DEFAULT_PERIOD_DURATION_MIN
  const a = hmToMinutes(first.start)
  const b = hmToMinutes(first.end)
  if (a == null || b == null || b <= a) return DEFAULT_PERIOD_DURATION_MIN
  return b - a
}

/** Recompute every row's end from its start + shared duration. */
export function applyPeriodDuration(
  periods: PeriodSlot[],
  durationMinutes: number,
): PeriodSlot[] {
  return periods.map((p) => {
    try {
      const end = endHmFromStart(p.start, durationMinutes)
      return { ...p, end }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`第${p.index}节：${msg}`, { cause: err })
    }
  })
}

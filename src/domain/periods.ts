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

import { describe, expect, it } from 'vitest'
import {
  assertMonday,
  dateToWeekIndex,
  weekIndexToDate,
  weekdayOfYmd,
} from './semester'

const semester = { startMonday: '2026-02-23', totalWeeks: 16 } // Mon

describe('semester', () => {
  it('rejects non-Monday start', () => {
    expect(() => assertMonday('2026-02-24')).toThrow(/Monday/)
  })

  it('weekIndexToDate: week1 Mon/Wed/Sun', () => {
    expect(weekIndexToDate(semester, 1, 1)).toBe('2026-02-23')
    expect(weekIndexToDate(semester, 1, 3)).toBe('2026-02-25')
    expect(weekIndexToDate(semester, 1, 7)).toBe('2026-03-01')
  })

  it('weekIndexToDate: week 16', () => {
    expect(weekIndexToDate(semester, 16, 1)).toBe('2026-06-08')
  })

  it('weekIndexToDate rejects out of range', () => {
    expect(() => weekIndexToDate(semester, 0, 1)).toThrow(/weekIndex/)
    expect(() => weekIndexToDate(semester, 17, 1)).toThrow(/weekIndex/)
  })

  it('dateToWeekIndex round-trip', () => {
    expect(dateToWeekIndex(semester, '2026-02-23')).toBe(1)
    expect(dateToWeekIndex(semester, '2026-03-01')).toBe(1)
    expect(dateToWeekIndex(semester, '2026-03-02')).toBe(2)
    expect(dateToWeekIndex(semester, '2026-06-14')).toBe(16)
    expect(dateToWeekIndex(semester, '2026-06-15')).toBeNull()
    expect(dateToWeekIndex(semester, '2026-02-22')).toBeNull()
  })

  it('weekdayOfYmd', () => {
    expect(weekdayOfYmd('2026-02-23')).toBe(1)
    expect(weekdayOfYmd('2026-03-01')).toBe(7)
  })
})

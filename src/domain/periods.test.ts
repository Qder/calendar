import { describe, expect, it } from 'vitest'
import {
  assertPeriodTimes,
  DEFAULT_PERIODS,
  isHmBefore,
  periodIndexSet,
} from './periods'
import { PeriodSchema } from './schemas'

describe('period times', () => {
  it('isHmBefore', () => {
    expect(isHmBefore('08:00', '08:45')).toBe(true)
    expect(isHmBefore('08:45', '08:45')).toBe(false)
    expect(isHmBefore('09:00', '08:00')).toBe(false)
    expect(isHmBefore('8:00', '09:00')).toBe(false)
  })

  it('assertPeriodTimes accepts defaults', () => {
    expect(() => assertPeriodTimes(DEFAULT_PERIODS)).not.toThrow()
  })

  it('assertPeriodTimes rejects start >= end', () => {
    expect(() =>
      assertPeriodTimes([{ index: 1, start: '09:00', end: '08:00' }]),
    ).toThrow(/须早于结束时刻/)
    expect(() =>
      assertPeriodTimes([{ index: 2, start: '10:00', end: '10:00' }]),
    ).toThrow(/须早于结束时刻/)
  })

  it('PeriodSchema refine', () => {
    expect(
      PeriodSchema.safeParse({ index: 1, start: '08:00', end: '08:45' }).success,
    ).toBe(true)
    const bad = PeriodSchema.safeParse({
      index: 1,
      start: '08:45',
      end: '08:00',
    })
    expect(bad.success).toBe(false)
  })

  it('periodIndexSet', () => {
    expect(periodIndexSet(DEFAULT_PERIODS).has(12)).toBe(true)
    expect(periodIndexSet(DEFAULT_PERIODS).has(13)).toBe(false)
  })
})

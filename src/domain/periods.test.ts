import { describe, expect, it } from 'vitest'
import {
  applyPeriodDuration,
  assertPeriodTimes,
  DEFAULT_PERIOD_DURATION_MIN,
  DEFAULT_PERIODS,
  endHmFromStart,
  inferPeriodDurationMinutes,
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

describe('period duration helpers', () => {
  it('endHmFromStart adds minutes', () => {
    expect(endHmFromStart('08:00', 45)).toBe('08:45')
    expect(endHmFromStart('08:55', 45)).toBe('09:40')
  })

  it('endHmFromStart rejects overnight and non-positive', () => {
    expect(() => endHmFromStart('23:30', 45)).toThrow(/跨天/)
    expect(() => endHmFromStart('08:00', 0)).toThrow(/正整数/)
  })

  it('inferPeriodDurationMinutes from first slot', () => {
    expect(inferPeriodDurationMinutes(DEFAULT_PERIODS)).toBe(45)
    expect(
      inferPeriodDurationMinutes([{ index: 1, start: '08:00', end: '08:50' }]),
    ).toBe(50)
    expect(inferPeriodDurationMinutes([])).toBe(DEFAULT_PERIOD_DURATION_MIN)
  })

  it('applyPeriodDuration rewrites ends', () => {
    const next = applyPeriodDuration(
      [
        { index: 1, start: '08:00', end: '99:99' },
        { index: 2, start: '09:00', end: '99:99' },
      ],
      40,
    )
    expect(next.map((p) => p.end)).toEqual(['08:40', '09:40'])
  })
})

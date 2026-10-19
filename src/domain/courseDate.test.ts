import { describe, expect, it } from 'vitest'
import { courseMeetingDate, expandCourseDates } from './courseDate'

describe('courseDate', () => {
  const start = '2026-02-23'
  const total = 16

  it('maps week+weekday to YMD', () => {
    expect(courseMeetingDate(start, total, 1, 1)).toBe('2026-02-23')
    expect(courseMeetingDate(start, total, 2, 5)).toBe('2026-03-06')
  })

  it('expandCourseDates', () => {
    expect(
      expandCourseDates({
        semesterStartMonday: start,
        totalWeeks: total,
        weeks: [1, 3],
        weekday: 2,
      }),
    ).toEqual(['2026-02-24', '2026-03-10'])
  })

  it('rejects week beyond total', () => {
    expect(() => courseMeetingDate(start, total, 17, 1)).toThrow(/weekIndex/)
  })
})

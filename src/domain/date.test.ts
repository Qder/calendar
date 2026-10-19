import { describe, expect, it } from 'vitest'
import {
  addDaysYmd,
  addMonthsYmd,
  combineYmdHm,
  endOfMonthYmd,
  formatYmd,
  parseHm,
  parseYmd,
  startOfMonthYmd,
  weekdayMon0,
} from './date'

describe('parseYmd / formatYmd', () => {
  it('round-trips a valid date', () => {
    const d = parseYmd('2026-10-19')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(9)
    expect(d.getDate()).toBe(19)
    expect(formatYmd(d)).toBe('2026-10-19')
  })

  it('rejects invalid calendar dates', () => {
    expect(() => parseYmd('2026-02-30')).toThrow(RangeError)
    expect(() => parseYmd('2026/10/19')).toThrow(RangeError)
  })
})

describe('addDaysYmd', () => {
  it('crosses month boundary', () => {
    expect(addDaysYmd('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('crosses year boundary', () => {
    expect(addDaysYmd('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysYmd('2027-01-01', -1)).toBe('2026-12-31')
  })
})

describe('combineYmdHm / parseHm', () => {
  it('builds local Date at given time', () => {
    const d = combineYmdHm('2026-03-15', '09:30')
    expect(d.getHours()).toBe(9)
    expect(d.getMinutes()).toBe(30)
    expect(parseHm('23:59')).toEqual({ hours: 23, minutes: 59 })
  })
})

describe('month helpers', () => {
  it('start/end of month and addMonths', () => {
    expect(startOfMonthYmd('2026-02-15')).toBe('2026-02-01')
    expect(endOfMonthYmd('2026-02-15')).toBe('2026-02-28')
    expect(addMonthsYmd('2026-01-31', 1)).toBe('2026-02-28')
  })

  it('weekdayMon0: Monday=0', () => {
    // 2026-10-19 is a Monday
    expect(weekdayMon0('2026-10-19')).toBe(0)
    // 2026-10-25 is a Sunday
    expect(weekdayMon0('2026-10-25')).toBe(6)
  })
})

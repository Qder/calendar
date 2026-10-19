import { describe, expect, it } from 'vitest'
import { addDaysYmd } from './date'
import { maxDaysBefore, planTriggers } from './reminders'

describe('planTriggers', () => {
  const now = new Date(2026, 5, 1, 8, 0, 0, 0)

  it('multiplies occurrences × rules and sorts by triggerAt', () => {
    const planned = planTriggers({
      startYmd: '2026-06-08',
      recurrence: 'weekly',
      rules: [
        { id: 'r0', eventId: 'e', daysBefore: 1, time: '09:00' },
        { id: 'r1', eventId: 'e', daysBefore: 0, time: '18:00' },
      ],
      fromYmd: '2026-06-01',
      toYmd: '2026-06-20',
      now,
    })
    // occ 06-08, 06-15 × 2 rules = 4, all future
    expect(planned).toHaveLength(4)
    expect(planned.map((p) => p.ruleId)).toEqual(['r0', 'r1', 'r0', 'r1'])
    expect(planned[0].occurrenceDate).toBe('2026-06-08')
    expect(planned[0].triggerAt.getDate()).toBe(7)
    expect(planned[1].triggerAt.getHours()).toBe(18)
  })

  it('keeps early reminders for occurrences beyond WINDOW when expand is extended', () => {
    // WINDOW = 60 days from 2026-06-01 → end trigger 2026-07-31 08:00
    // Occurrence on day 65 (2026-08-05) with daysBefore=7 → trigger 2026-07-29 — inside window
    const fromYmd = '2026-06-01'
    const windowDays = 60
    const rules = [{ id: 'r0', eventId: 'e', daysBefore: 7, time: '09:00' }]
    const expandTo = addDaysYmd(fromYmd, windowDays + maxDaysBefore(rules))
    const windowEndMs = now.getTime() + windowDays * 24 * 60 * 60 * 1000

    const planned = planTriggers({
      startYmd: '2026-08-05', // day 65 from Jun 1
      recurrence: 'none',
      rules,
      fromYmd,
      toYmd: expandTo,
      now,
      windowEndMs,
    })
    expect(planned).toHaveLength(1)
    expect(planned[0].occurrenceDate).toBe('2026-08-05')
    expect(planned[0].triggerAt.getMonth()).toBe(6) // July
    expect(planned[0].triggerAt.getDate()).toBe(29)

    // Without extend (toYmd = from+60 only), occurrence Aug 5 is outside → missed
    const narrow = planTriggers({
      startYmd: '2026-08-05',
      recurrence: 'none',
      rules,
      fromYmd,
      toYmd: addDaysYmd(fromYmd, windowDays),
      now,
      windowEndMs,
    })
    expect(narrow).toHaveLength(0)
  })

  it('drops triggers after windowEndMs even if occurrence was expanded', () => {
    const fromYmd = '2026-06-01'
    const windowDays = 60
    const rules = [{ id: 'r0', eventId: 'e', daysBefore: 0, time: '09:00' }]
    const windowEndMs = now.getTime() + windowDays * 24 * 60 * 60 * 1000
    const planned = planTriggers({
      startYmd: '2026-08-10', // far beyond window; daysBefore=0 → trigger also beyond
      recurrence: 'none',
      rules,
      fromYmd,
      toYmd: addDaysYmd(fromYmd, windowDays + 30),
      now,
      windowEndMs,
    })
    expect(planned).toHaveLength(0)
  })
})

describe('maxDaysBefore', () => {
  it('returns 0 for empty', () => {
    expect(maxDaysBefore([])).toBe(0)
  })
  it('returns max', () => {
    expect(maxDaysBefore([{ daysBefore: 1 }, { daysBefore: 7 }])).toBe(7)
  })
})

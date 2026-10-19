import { describe, expect, it } from 'vitest'
import { planTriggers } from './reminders'

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
})

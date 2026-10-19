import { describe, expect, it } from 'vitest'
import { computeTriggerAt } from './reminders'

describe('computeTriggerAt', () => {
  const now = new Date(2026, 5, 1, 8, 0, 0, 0) // 2026-06-01 08:00 local

  it('daysBefore=0: same day at remindTime', () => {
    const t = computeTriggerAt('2026-06-10', 0, '09:00', now)
    expect(t).not.toBeNull()
    expect(t!.getFullYear()).toBe(2026)
    expect(t!.getMonth()).toBe(5)
    expect(t!.getDate()).toBe(10)
    expect(t!.getHours()).toBe(9)
    expect(t!.getMinutes()).toBe(0)
  })

  it('daysBefore=1: previous day at remindTime', () => {
    const t = computeTriggerAt('2026-06-10', 1, '09:00', now)
    expect(t).not.toBeNull()
    expect(t!.getFullYear()).toBe(2026)
    expect(t!.getMonth()).toBe(5)
    expect(t!.getDate()).toBe(9)
    expect(t!.getHours()).toBe(9)
  })

  it('crosses month boundary', () => {
    const t = computeTriggerAt('2026-07-01', 1, '08:30', now)
    expect(t).not.toBeNull()
    expect(t!.getFullYear()).toBe(2026)
    expect(t!.getMonth()).toBe(5) // June
    expect(t!.getDate()).toBe(30)
    expect(t!.getHours()).toBe(8)
    expect(t!.getMinutes()).toBe(30)
  })

  it('crosses year boundary', () => {
    const t = computeTriggerAt('2027-01-01', 1, '10:00', now)
    expect(t).not.toBeNull()
    expect(t!.getFullYear()).toBe(2026)
    expect(t!.getMonth()).toBe(11)
    expect(t!.getDate()).toBe(31)
    expect(t!.getHours()).toBe(10)
  })

  it('skips when trigger is in the past', () => {
    const pastNow = new Date(2026, 5, 10, 12, 0, 0, 0)
    expect(computeTriggerAt('2026-06-10', 0, '09:00', pastNow)).toBeNull()
    expect(computeTriggerAt('2026-06-10', 1, '09:00', pastNow)).toBeNull()
  })

  it('skips when trigger equals now', () => {
    const exact = new Date(2026, 5, 9, 9, 0, 0, 0)
    expect(computeTriggerAt('2026-06-10', 1, '09:00', exact)).toBeNull()
  })

  it('rejects negative daysBefore', () => {
    expect(() => computeTriggerAt('2026-06-10', -1, '09:00', now)).toThrow(
      RangeError,
    )
  })
})

import { describe, expect, it } from 'vitest'
import { addMs, toNotificationId } from './triggerAt'

describe('addMs', () => {
  it('adds delay without mutating input', () => {
    const base = new Date('2026-10-19T10:00:00')
    const next = addMs(base, 30_000)
    expect(next.getTime() - base.getTime()).toBe(30_000)
    expect(base.getTime()).toBe(new Date('2026-10-19T10:00:00').getTime())
  })
})

describe('toNotificationId', () => {
  it('accepts 32-bit ints', () => {
    expect(toNotificationId(1)).toBe(1)
    expect(toNotificationId(-2147483648)).toBe(-2147483648)
    expect(toNotificationId(2147483647)).toBe(2147483647)
  })

  it('rejects out-of-range or non-integers', () => {
    expect(() => toNotificationId(2147483648)).toThrow(RangeError)
    expect(() => toNotificationId(1.5)).toThrow(RangeError)
  })
})

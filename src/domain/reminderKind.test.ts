import { describe, expect, it } from 'vitest'
import {
  EventInputSchema,
  EventSchema,
  normalizeReminderKind,
} from './schemas'

describe('normalizeReminderKind', () => {
  it('maps alarm only; everything else → banner', () => {
    expect(normalizeReminderKind('alarm')).toBe('alarm')
    expect(normalizeReminderKind('banner')).toBe('banner')
    expect(normalizeReminderKind(undefined)).toBe('banner')
    expect(normalizeReminderKind(null)).toBe('banner')
    expect(normalizeReminderKind('')).toBe('banner')
    expect(normalizeReminderKind('other')).toBe('banner')
  })
})

describe('EventSchema / EventInputSchema reminderKind', () => {
  const base = {
    id: 'e1',
    title: '测',
    date: '2026-10-20',
    createdAt: 1,
    updatedAt: 1,
  }

  it('defaults missing reminderKind to banner on EventSchema', () => {
    const ev = EventSchema.parse(base)
    expect(ev.reminderKind).toBe('banner')
  })

  it('accepts alarm', () => {
    const ev = EventSchema.parse({ ...base, reminderKind: 'alarm' })
    expect(ev.reminderKind).toBe('alarm')
  })

  it('EventInputSchema defaults to banner', () => {
    const input = EventInputSchema.parse({
      title: '测',
      date: '2026-10-20',
    })
    expect(input.reminderKind).toBe('banner')
  })

  it('EventInputSchema keeps alarm', () => {
    const input = EventInputSchema.parse({
      title: '测',
      date: '2026-10-20',
      reminderKind: 'alarm',
      reminders: [],
    })
    expect(input.reminderKind).toBe('alarm')
  })
})

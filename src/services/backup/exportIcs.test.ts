import { describe, expect, it } from 'vitest'
import type { CalendarEvent, ReminderRule } from '@/domain/schemas'
import {
  buildIcsCalendar,
  buildValarm,
  eventToVevent,
  toIcsDateOnly,
  toIcsLocalDateTime,
} from './exportIcs'

const baseEvent: CalendarEvent = {
  id: 'ev1',
  title: '开会, 重要',
  date: '2026-10-20',
  time: '14:30',
  note: '带材料',
  recurrence: 'weekly',
  reminderKind: 'banner',
  createdAt: 1,
  updatedAt: 1,
}

const rule: ReminderRule = {
  id: 'r1',
  eventId: 'ev1',
  daysBefore: 1,
  time: '09:00',
}

describe('exportIcs', () => {
  it('formats local datetime and date-only', () => {
    expect(toIcsLocalDateTime('2026-10-20', '09:05')).toBe('20261020T090500')
    expect(toIcsDateOnly('2026-10-20')).toBe('20261020')
  })

  it('emits VEVENT + VALARM and escapes text', () => {
    const lines = eventToVevent(baseEvent, [rule])
    const blob = lines.join('\n')
    expect(blob).toContain('BEGIN:VEVENT')
    expect(blob).toContain('SUMMARY:开会\\, 重要')
    expect(blob).toContain('DTSTART:20261020T143000')
    expect(blob).toContain('RRULE:FREQ=WEEKLY')
    expect(blob).toContain('BEGIN:VALARM')
    expect(blob).toContain('ACTION:DISPLAY')
    // daysBefore=1 + 09:00 → 2026-10-19 09:00 absolute (not -P1DT09H00M)
    expect(blob).toContain('TRIGGER;VALUE=DATE-TIME:20261019T090000')
    expect(blob).not.toContain('TRIGGER:-P')
    expect(blob).toContain('END:VEVENT')
  })

  it('buildValarm uses absolute trigger at eventDate-daysBefore @ time', () => {
    expect(buildValarm(rule, '2026-10-20')).toEqual([
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER;VALUE=DATE-TIME:20261019T090000',
      'DESCRIPTION:提醒',
      'END:VALARM',
    ])
  })

  it('buildValarm daysBefore=0 is same calendar day at rule time', () => {
    const sameDay: ReminderRule = { ...rule, daysBefore: 0, time: '18:30' }
    expect(buildValarm(sameDay, '2026-10-20')).toContain(
      'TRIGGER;VALUE=DATE-TIME:20261020T183000',
    )
  })

  it('VALARM absolute time is independent of DTSTART clock', () => {
    // Old bug: -P1DT09H00M subtracted 1d+9h from 14:30 → wrong wall clock.
    // Absolute must stay 09:00 previous day regardless of event.time.
    const evening = { ...baseEvent, time: '22:00' }
    const blob = eventToVevent(evening, [rule]).join('\n')
    expect(blob).toContain('DTSTART:20261020T220000')
    expect(blob).toContain('TRIGGER;VALUE=DATE-TIME:20261019T090000')
  })

  it('buildIcsCalendar skips needing Dexie when events injected', async () => {
    const ics = await buildIcsCalendar([baseEvent], new Map([['ev1', [rule]]]))
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).not.toContain('COURSE')
    expect(ics).toContain('VEVENT')
    expect(ics).toContain('TRIGGER;VALUE=DATE-TIME:20261019T090000')
  })

  it('all-day event uses VALUE=DATE and still absolute VALARM', () => {
    const allDay = { ...baseEvent, time: null }
    const blob = eventToVevent(allDay, [rule]).join('\n')
    expect(blob).toContain('DTSTART;VALUE=DATE:20261020')
    expect(blob).toContain('TRIGGER;VALUE=DATE-TIME:20261019T090000')
  })
})

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
    expect(blob).toContain('TRIGGER:-P1DT09H00M')
    expect(blob).toContain('END:VEVENT')
  })

  it('buildValarm shape', () => {
    expect(buildValarm(rule)).toEqual([
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P1DT09H00M',
      'DESCRIPTION:提醒',
      'END:VALARM',
    ])
  })

  it('buildIcsCalendar skips needing Dexie when events injected', async () => {
    const ics = await buildIcsCalendar([baseEvent], new Map([['ev1', [rule]]]))
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).not.toContain('COURSE')
    expect(ics).toContain('VEVENT')
  })

  it('all-day event uses VALUE=DATE', () => {
    const allDay = { ...baseEvent, time: null }
    const blob = eventToVevent(allDay, []).join('\n')
    expect(blob).toContain('DTSTART;VALUE=DATE:20261020')
  })
})

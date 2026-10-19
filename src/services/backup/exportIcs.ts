import { listEvents } from '@/db/repos/events'
import { listRulesForEvent } from '@/db/repos/reminderRules'
import type { CalendarEvent, ReminderRule } from '@/domain/schemas'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Format as floating local ICS datetime YYYYMMDDTHHMMSS (no Z). */
export function toIcsLocalDateTime(ymd: string, hm: string): string {
  const [y, m, d] = ymd.split('-')
  const [hh, mm] = hm.split(':')
  return `${y}${m}${d}T${hh}${mm}00`
}

export function toIcsDateOnly(ymd: string): string {
  return ymd.replace(/-/g, '')
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let rest = line
  parts.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  return parts.join('\r\n')
}

function rrRule(recurrence: CalendarEvent['recurrence']): string | null {
  switch (recurrence) {
    case 'weekly':
      return 'RRULE:FREQ=WEEKLY'
    case 'monthly':
      return 'RRULE:FREQ=MONTHLY'
    case 'yearly':
      return 'RRULE:FREQ=YEARLY'
    default:
      return null
  }
}

/**
 * VALARM DISPLAY with TRIGGER -P{days}DT{hh}H{mm}M
 * (daysBefore before DTSTART + rule clock as duration components).
 */
export function buildValarm(rule: ReminderRule): string[] {
  const [hh, mm] = rule.time.split(':').map(Number)
  const trigger = `TRIGGER:-P${rule.daysBefore}DT${pad2(hh)}H${pad2(mm)}M`
  return [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    trigger,
    `DESCRIPTION:${escapeIcsText('提醒')}`,
    'END:VALARM',
  ]
}

export function eventToVevent(
  event: CalendarEvent,
  rules: ReminderRule[],
): string[] {
  const lines: string[] = ['BEGIN:VEVENT']
  lines.push(`UID:${escapeIcsText(event.id)}@calendar.local`)
  lines.push(`SUMMARY:${escapeIcsText(event.title)}`)
  if (event.note) lines.push(`DESCRIPTION:${escapeIcsText(event.note)}`)

  if (event.time) {
    lines.push(`DTSTART:${toIcsLocalDateTime(event.date, event.time)}`)
  } else {
    lines.push(`DTSTART;VALUE=DATE:${toIcsDateOnly(event.date)}`)
  }

  const rule = rrRule(event.recurrence ?? 'none')
  if (rule) lines.push(rule)

  for (const r of rules) {
    lines.push(...buildValarm(r))
  }

  lines.push('END:VEVENT')
  return lines
}

/**
 * Build an ICS calendar from events + reminder rules.
 * Courses / timetable rows are intentionally NOT exported.
 */
export async function buildIcsCalendar(
  events?: CalendarEvent[],
  rulesByEventId?: Map<string, ReminderRule[]>,
): Promise<string> {
  const list = events ?? (await listEvents())
  const body: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Qder//Calendar//ZH',
    'CALSCALE:GREGORIAN',
  ]

  for (const ev of list) {
    const rules =
      rulesByEventId?.get(ev.id) ?? (await listRulesForEvent(ev.id))
    body.push(...eventToVevent(ev, rules))
  }

  body.push('END:VCALENDAR')
  return `${body.map(foldLine).join('\r\n')}\r\n`
}

export async function downloadIcs(
  filename = `calendar-${new Date().toISOString().slice(0, 10)}.ics`,
): Promise<string> {
  const ics = await buildIcsCalendar()
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return ics
}

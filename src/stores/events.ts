import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  deleteEvent,
  getEvent,
  listEvents,
  putEvent,
} from '@/db/repos/events'
import { listRulesForEvent } from '@/db/repos/reminderRules'
import { getDefaultRemindTime } from '@/db/repos/settings'
import { addDaysYmd, endOfMonthYmd, startOfMonthYmd } from '@/domain/date'
import {
  expandOccurrences,
  type RecurrenceFreq,
} from '@/domain/recurrence'
import {
  EventInputSchema,
  normalizeReminderKind,
  type CalendarEvent,
  type EventInput,
  type ReminderRule,
} from '@/domain/schemas'
import {
  setRemindersAndRebuild,
  teardownEventReminders,
} from '@/services/scheduler/rebuildForEvent'

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** An event occurrence shown on the month grid / day list. */
export interface EventOccurrence {
  event: CalendarEvent
  occurrenceDate: string
}

export const useEventsStore = defineStore('events', () => {
  const items = ref<CalendarEvent[]>([])
  const loading = ref(false)

  async function refresh(): Promise<void> {
    loading.value = true
    try {
      items.value = await listEvents()
    } finally {
      loading.value = false
    }
  }

  /**
   * Expand all series into occurrences that fall inside the month of `monthYmd`.
   * Recurring series whose start is before the month still appear when an
   * occurrence lands in-range.
   */
  async function occurrencesInMonth(monthYmd: string): Promise<EventOccurrence[]> {
    const from = startOfMonthYmd(monthYmd)
    const to = endOfMonthYmd(monthYmd)
    const all = await listEvents()
    const out: EventOccurrence[] = []
    for (const event of all) {
      if (event.date > to) continue
      const freq = (event.recurrence ?? 'none') as RecurrenceFreq
      const dates = expandOccurrences(event.date, freq, from, to)
      for (const occurrenceDate of dates) {
        out.push({ event, occurrenceDate })
      }
    }
    return out
  }

  async function load(id: string): Promise<CalendarEvent | undefined> {
    return getEvent(id)
  }

  async function loadRules(eventId: string): Promise<ReminderRule[]> {
    return listRulesForEvent(eventId)
  }

  /** @deprecated use loadRules */
  async function loadRule(eventId: string): Promise<ReminderRule | undefined> {
    const rules = await listRulesForEvent(eventId)
    return rules[0]
  }

  async function save(
    input: EventInput,
    existingId?: string,
  ): Promise<CalendarEvent> {
    const parsed = EventInputSchema.parse(input)
    const now = Date.now()
    const prev = existingId ? await getEvent(existingId) : undefined
    const event: CalendarEvent = {
      id: existingId ?? newId(),
      title: parsed.title,
      date: parsed.date,
      time: parsed.time ?? null,
      note: parsed.note ?? '',
      recurrence: parsed.recurrence ?? 'none',
      reminderKind: normalizeReminderKind(parsed.reminderKind),
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    }

    await putEvent(event)

    let reminders = parsed.reminders
    if (reminders === undefined) {
      const defaultTime = await getDefaultRemindTime()
      reminders = [{ daysBefore: 1, time: defaultTime }]
    }
    await setRemindersAndRebuild(event, reminders)
    await refresh()
    return event
  }

  /** Whole-series delete only (stage 3: no "this occurrence"). */
  async function remove(id: string): Promise<void> {
    await teardownEventReminders(id)
    await deleteEvent(id)
    await refresh()
  }

  return {
    items,
    loading,
    refresh,
    occurrencesInMonth,
    load,
    loadRules,
    loadRule,
    save,
    remove,
  }
})

/** Helper for tests / callers needing a forward window label. */
export function windowEndYmd(fromYmd: string, days: number): string {
  return addDaysYmd(fromYmd, days)
}

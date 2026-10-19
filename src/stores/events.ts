import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  deleteEvent,
  getEvent,
  listEvents,
  listEventsInRange,
  putEvent,
} from '@/db/repos/events'
import { listRulesForEvent } from '@/db/repos/reminderRules'
import { getDefaultRemindTime } from '@/db/repos/settings'
import {
  EventInputSchema,
  type CalendarEvent,
  type EventInput,
  type ReminderRule,
} from '@/domain/schemas'
import {
  setSingleReminderAndRebuild,
  teardownEventReminders,
} from '@/services/scheduler/rebuildForEvent'

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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

  async function eventsInMonth(monthYmd: string): Promise<CalendarEvent[]> {
    const y = Number(monthYmd.slice(0, 4))
    const m = Number(monthYmd.slice(5, 7))
    const from = `${monthYmd.slice(0, 7)}-01`
    const last = new Date(y, m, 0).getDate()
    const to = `${monthYmd.slice(0, 7)}-${String(last).padStart(2, '0')}`
    return listEventsInRange(from, to)
  }

  async function load(id: string): Promise<CalendarEvent | undefined> {
    return getEvent(id)
  }

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
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    }

    await putEvent(event)

    let reminder = parsed.reminder
    if (reminder === undefined) {
      const defaultTime = await getDefaultRemindTime()
      reminder = { daysBefore: 1, time: defaultTime }
    }
    await setSingleReminderAndRebuild(event, reminder ?? null)
    await refresh()
    return event
  }

  async function remove(id: string): Promise<void> {
    await teardownEventReminders(id)
    await deleteEvent(id)
    await refresh()
  }

  return {
    items,
    loading,
    refresh,
    eventsInMonth,
    load,
    loadRule,
    save,
    remove,
  }
})

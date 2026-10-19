import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db'
import type { CalendarEvent, ReminderRule } from '@/domain/schemas'
import type {
  NotificationService,
  PendingNotification,
  ScheduleRequest,
} from '@/services/notification/types'
import { buildBackupPayload, backupToJsonString } from './exportJson'
import { importBackupJsonText, parseBackupJson } from './importJson'

const { mock } = vi.hoisted(() => {
  class MockNotificationService implements NotificationService {
    scheduled: ScheduleRequest[] = []
    cancelled: number[] = []
    cancelAllCount = 0

    async requestPermission(): Promise<boolean> {
      return true
    }
    async schedule(req: ScheduleRequest): Promise<void> {
      this.scheduled.push(req)
    }
    async cancel(id: number): Promise<void> {
      this.cancelled.push(id)
      this.scheduled = this.scheduled.filter((s) => s.id !== id)
    }
    async cancelAll(): Promise<void> {
      this.cancelAllCount += 1
      this.scheduled = []
    }
    async listPending(): Promise<PendingNotification[]> {
      return this.scheduled.map((s) => ({
        id: s.id,
        title: s.title,
        body: s.body,
        triggerAt: s.triggerAt,
      }))
    }
    reset(): void {
      this.scheduled = []
      this.cancelled = []
      this.cancelAllCount = 0
    }
  }
  return { mock: new MockNotificationService() }
})

vi.mock('@/services/notification', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/notification')>(
      '@/services/notification',
    )
  return {
    ...actual,
    getNotificationService: () => mock,
  }
})

const event: CalendarEvent = {
  id: 'e-round',
  title: '往返测',
  date: '2026-12-01',
  time: '10:00',
  note: '',
  recurrence: 'none',
  createdAt: 100,
  updatedAt: 100,
}

const rule: ReminderRule = {
  id: 'rule-round',
  eventId: 'e-round',
  daysBefore: 1,
  time: '09:00',
}

describe('backup roundtrip + rebuildAll (mock NotificationService)', () => {
  beforeEach(async () => {
    mock.reset()
    await db.delete()
    await db.open()
  })

  it('parse rejects bad version', () => {
    expect(() =>
      parseBackupJson(JSON.stringify({ version: 99, exportedAt: 'x' })),
    ).toThrow(/备份校验失败/)
  })

  it('export → import overwrite restores rows and rebuild schedules on mock', async () => {
    await db.events.put(event)
    await db.reminder_rules.put(rule)
    await db.settings.put({ key: 'defaultRemindTime', value: '08:30' })

    const payload = await buildBackupPayload()
    expect(payload.version).toBe(1)
    expect(payload.events).toHaveLength(1)
    expect(payload.reminderRules).toHaveLength(1)

    const json = backupToJsonString(payload)

    await db.events.clear()
    await db.reminder_rules.clear()
    await db.settings.clear()
    mock.reset()

    const stats = await importBackupJsonText(json, 'overwrite')
    expect(stats.events).toBe(1)
    expect(stats.rules).toBe(1)

    const ev = await db.events.get('e-round')
    expect(ev?.title).toBe('往返测')
    expect(await db.reminder_rules.count()).toBe(1)

    // Dec 1 event with 1-day-before reminder is inside WINDOW_DAYS from 2026-10-19
    expect(mock.scheduled.length).toBeGreaterThan(0)
  })

  it('merge keeps existing different id and upserts', async () => {
    await db.events.put(event)
    await db.reminder_rules.put(rule)

    const other: CalendarEvent = {
      ...event,
      id: 'e-other',
      title: '本地留存',
    }
    await db.events.put(other)

    const payload = await buildBackupPayload()
    payload.events = [event]
    payload.reminderRules = [rule]

    await importBackupJsonText(backupToJsonString(payload), 'merge')
    const ids = (await db.events.toArray()).map((e) => e.id).sort()
    expect(ids).toEqual(['e-other', 'e-round'])
  })
})

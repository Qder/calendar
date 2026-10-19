import { Capacitor } from '@capacitor/core'
import {
  LocalNotifications,
  type Channel,
} from '@capacitor/local-notifications'
import { toNotificationId } from '@/domain/triggerAt'
import type {
  NotificationService,
  PendingNotification,
  ScheduleRequest,
} from './types'

const CHANNEL_ID = 'calendar_reminders'
const CHANNEL_NAME = '日历提醒'

/**
 * Android/iOS implementation via @capacitor/local-notifications.
 * Swipe-away survival relies on the OS alarm/notification scheduler, not JS timers.
 *
 * Exact-alarm basis (@capacitor/local-notifications ^8.3 + Capacitor Android docs):
 * - Manifest: SCHEDULE_EXACT_ALARM (Android 12+)
 * - Runtime: requestPermissions() for POST_NOTIFICATIONS (Android 13+)
 * - schedule() uses isExactNotification: true (plugin default); allowWhileIdle for Doze
 * See README "精确闹钟" section.
 */
export class CapacitorNotificationService implements NotificationService {
  private channelReady = false

  async requestPermission(): Promise<boolean> {
    await this.ensureChannel()

    const current = await LocalNotifications.checkPermissions()
    if (current.display === 'granted') {
      await this.ensureExactAlarmHint()
      return true
    }

    const requested = await LocalNotifications.requestPermissions()
    const ok = requested.display === 'granted'
    if (ok) await this.ensureExactAlarmHint()
    return ok
  }

  async schedule(req: ScheduleRequest): Promise<void> {
    const id = toNotificationId(req.id)
    await this.ensureChannel()

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: req.title,
          body: req.body,
          channelId: CHANNEL_ID,
          schedule: {
            at: req.triggerAt,
            allowWhileIdle: true,
          },
          // Explicit: we need wall-clock accuracy for "N seconds later" debug.
          isExactNotification: true,
        },
      ],
    })
  }

  async cancel(id: number): Promise<void> {
    await LocalNotifications.cancel({
      notifications: [{ id: toNotificationId(id) }],
    })
  }

  async cancelAll(): Promise<void> {
    await LocalNotifications.cancelAll()
  }

  async listPending(): Promise<PendingNotification[]> {
    const { notifications } = await LocalNotifications.getPending()
    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      triggerAt: n.schedule?.at ? new Date(n.schedule.at) : null,
    }))
  }

  private async ensureChannel(): Promise<void> {
    if (this.channelReady || Capacitor.getPlatform() !== 'android') {
      this.channelReady = true
      return
    }

    const channel: Channel = {
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      description: '事件与调试提醒（高重要性）',
      // 5 = IMPORTANCE_HIGH → heads-up on Android 8+
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
    }

    await LocalNotifications.createChannel(channel)
    this.channelReady = true
  }

  /**
   * If exact alarms are denied, open system settings once so Yang can grant
   * "Alarms & reminders". Non-fatal if the API is unavailable (older OS).
   */
  private async ensureExactAlarmHint(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return
    try {
      const status = await LocalNotifications.checkExactNotificationSetting()
      if (status.exact_alarm !== 'granted') {
        await LocalNotifications.changeExactNotificationSetting()
      }
    } catch (err) {
      console.warn('[capacitor-notification] exact-alarm check skipped', err)
    }
  }
}

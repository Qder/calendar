import { Capacitor } from '@capacitor/core'
import {
  LocalNotifications,
  type Channel,
} from '@capacitor/local-notifications'
import { normalizeReminderKind } from '@/domain/schemas'
import { toNotificationId } from '@/domain/triggerAt'
import type {
  NotificationService,
  PendingNotification,
  ScheduleRequest,
} from './types'

/** High-importance: heads-up + sound/vibration (闹钟式强提醒). */
export const CHANNEL_ALARM_ID = 'calendar-alarm'
const CHANNEL_ALARM_NAME = '闹钟式强提醒'

/** Default importance: banner / shade (仅弹窗通知). */
export const CHANNEL_BANNER_ID = 'calendar-banner'
const CHANNEL_BANNER_NAME = '仅弹窗通知'

/**
 * Android/iOS implementation via @capacitor/local-notifications.
 * Swipe-away survival relies on the OS alarm/notification scheduler, not JS timers.
 *
 * Exact-alarm basis (@capacitor/local-notifications ^8.3 + Capacitor Android docs):
 * - Manifest: SCHEDULE_EXACT_ALARM (Android 12+)
 * - Runtime: requestPermissions() for POST_NOTIFICATIONS (Android 13+)
 * - schedule() uses isExactNotification: true; allowWhileIdle for Doze
 * See README "精确闹钟" section.
 *
 * N-reminder-kind: two Android channels; reminderKind selects channelId.
 */
export class CapacitorNotificationService implements NotificationService {
  private channelsReady = false

  async requestPermission(): Promise<boolean> {
    await this.ensureChannels()

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
    await this.ensureChannels()

    const kind = normalizeReminderKind(req.reminderKind)
    const channelId =
      kind === 'alarm' ? CHANNEL_ALARM_ID : CHANNEL_BANNER_ID

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: req.title,
          body: req.body,
          channelId,
          schedule: {
            at: req.triggerAt,
            allowWhileIdle: true,
          },
          // Exact wall-clock for both kinds; channel controls interruptiveness.
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
    // OEM: cancelAll alone may leave zombies; sweep getPending one-by-one.
    try {
      await LocalNotifications.cancelAll()
    } catch (err) {
      console.warn('[notif] cancelAll failed', err)
    }
    const leftover = await this.listPending()
    for (const item of leftover) {
      try {
        await this.cancel(item.id)
      } catch (err) {
        console.warn('[notif] cancel leftover failed', item.id, err)
      }
    }
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

  private async ensureChannels(): Promise<void> {
    if (this.channelsReady || Capacitor.getPlatform() !== 'android') {
      this.channelsReady = true
      return
    }

    const alarm: Channel = {
      id: CHANNEL_ALARM_ID,
      name: CHANNEL_ALARM_NAME,
      description: '高重要性：声音/震动，尽量打断（闹钟式）',
      // 5 = IMPORTANCE_HIGH → heads-up on Android 8+
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      sound: 'default',
    }

    const banner: Channel = {
      id: CHANNEL_BANNER_ID,
      name: CHANNEL_BANNER_NAME,
      description: '普通重要性：通知栏/横幅即可，不强调闹钟级打断',
      // 4 = IMPORTANCE_DEFAULT
      importance: 4,
      visibility: 1,
      vibration: false,
      lights: true,
    }

    await LocalNotifications.createChannel(alarm)
    await LocalNotifications.createChannel(banner)
    this.channelsReady = true
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

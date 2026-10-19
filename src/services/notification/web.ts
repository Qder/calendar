import type {
  NotificationService,
  PendingNotification,
  ScheduleRequest,
} from './types'
import { toNotificationId } from '@/domain/triggerAt'

interface TimedEntry {
  req: ScheduleRequest
  timer: ReturnType<typeof setTimeout>
}

/**
 * Browser / Vite-dev stub: in-memory timers + Notification API when permitted.
 * Does NOT survive tab close — only for local UI smoke; real swipe-away is Capacitor.
 */
export class WebNotificationService implements NotificationService {
  private pending = new Map<number, TimedEntry>()

  async requestPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  async schedule(req: ScheduleRequest): Promise<void> {
    const id = toNotificationId(req.id)
    await this.cancel(id)

    const delay = req.triggerAt.getTime() - Date.now()
    if (delay <= 0) {
      this.fire(req)
      return
    }

    const timer = setTimeout(() => {
      this.pending.delete(id)
      this.fire(req)
    }, delay)

    this.pending.set(id, { req: { ...req, id }, timer })
  }

  async cancel(id: number): Promise<void> {
    const entry = this.pending.get(toNotificationId(id))
    if (!entry) return
    clearTimeout(entry.timer)
    this.pending.delete(id)
  }

  async cancelAll(): Promise<void> {
    for (const id of [...this.pending.keys()]) {
      await this.cancel(id)
    }
  }

  async listPending(): Promise<PendingNotification[]> {
    return [...this.pending.values()].map(({ req }) => ({
      id: req.id,
      title: req.title,
      body: req.body,
      triggerAt: req.triggerAt,
    }))
  }

  private fire(req: ScheduleRequest): void {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(req.title, { body: req.body })
      return
    }
    // Fallback so the debug page still shows something in restricted browsers.
    console.info('[web-notification]', req.title, req.body, req.triggerAt.toISOString())
  }
}

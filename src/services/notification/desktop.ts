import { toNotificationId } from '@/domain/triggerAt'
import type {
  NotificationService,
  PendingNotification,
  ScheduleRequest,
} from './types'

interface TimedEntry {
  req: ScheduleRequest
  timer: ReturnType<typeof setTimeout> | null
}

const STORAGE_KEY = 'calendar.desktop.pendingNotifications'

/**
 * Tauri desktop: JS scheduler + plugin-notification for the toast.
 *
 * Acceptance for this phase (Architect/CR):
 * - Close window → tray keeps process alive → setTimeout still fires → OK
 * - Kill process / Task Manager end task → NOT expected to fire; do not claim that
 *
 * Sleep resume: visibilitychange / focus / online triggers a rescan of due items.
 */
export class DesktopNotificationService implements NotificationService {
  private pending = new Map<number, TimedEntry>()
  private wired = false

  async requestPermission(): Promise<boolean> {
    this.wireLifecycle()
    try {
      const { isPermissionGranted, requestPermission } = await import(
        '@tauri-apps/plugin-notification'
      )
      let granted = await isPermissionGranted()
      if (!granted) {
        const perm = await requestPermission()
        granted = perm === 'granted'
      }
      return granted
    } catch (err) {
      console.warn('[desktop-notification] permission via plugin failed', err)
      return false
    }
  }

  async schedule(req: ScheduleRequest): Promise<void> {
    this.wireLifecycle()
    const id = toNotificationId(req.id)
    await this.cancel(id)

    const entry: TimedEntry = { req: { ...req, id }, timer: null }
    this.pending.set(id, entry)
    this.persist()
    this.arm(entry)
  }

  async cancel(id: number): Promise<void> {
    const key = toNotificationId(id)
    const entry = this.pending.get(key)
    if (!entry) return
    if (entry.timer !== null) clearTimeout(entry.timer)
    this.pending.delete(key)
    this.persist()
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

  /** Re-arm nearest timers; fire anything already due (e.g. after sleep). */
  rescan(): void {
    const now = Date.now()
    for (const entry of this.pending.values()) {
      if (entry.req.triggerAt.getTime() <= now) {
        void this.deliver(entry.req)
        if (entry.timer !== null) clearTimeout(entry.timer)
        this.pending.delete(entry.req.id)
      } else {
        this.arm(entry)
      }
    }
    this.persist()
  }

  private arm(entry: TimedEntry): void {
    if (entry.timer !== null) clearTimeout(entry.timer)
    const delay = Math.max(0, entry.req.triggerAt.getTime() - Date.now())
    // setTimeout delay is clamped by browsers (~24.8d); fine for debug delays.
    entry.timer = setTimeout(() => {
      void this.deliver(entry.req)
      this.pending.delete(entry.req.id)
      this.persist()
    }, delay)
  }

  private async deliver(req: ScheduleRequest): Promise<void> {
    try {
      const { sendNotification } = await import('@tauri-apps/plugin-notification')
      sendNotification({ title: req.title, body: req.body })
    } catch (err) {
      console.warn('[desktop-notification] send failed, console fallback', err)
      console.info('[desktop-notification]', req.title, req.body)
    }
  }

  private wireLifecycle(): void {
    if (this.wired || typeof window === 'undefined') return
    this.wired = true
    this.restore()

    const onWake = () => this.rescan()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onWake()
    })
    window.addEventListener('focus', onWake)
    // Chromium fires this after some sleep/resume paths.
    window.addEventListener('online', onWake)
  }

  private persist(): void {
    try {
      const serializable = [...this.pending.values()].map(({ req }) => ({
        id: req.id,
        title: req.title,
        body: req.body,
        triggerAt: req.triggerAt.toISOString(),
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch {
      /* ignore quota / private mode */
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const list = JSON.parse(raw) as Array<{
        id: number
        title: string
        body: string
        triggerAt: string
      }>
      for (const item of list) {
        if (this.pending.has(item.id)) continue
        const entry: TimedEntry = {
          req: {
            id: item.id,
            title: item.title,
            body: item.body,
            triggerAt: new Date(item.triggerAt),
          },
          timer: null,
        }
        this.pending.set(item.id, entry)
      }
      this.rescan()
    } catch {
      /* corrupt storage */
    }
  }
}

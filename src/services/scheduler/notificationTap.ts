import { Capacitor } from '@capacitor/core'
import { getScheduledById } from '@/db/repos/scheduledNotifications'
import type { Router } from 'vue-router'

/**
 * Wire "tap notification → event edit" as far as the platform allows.
 * Capacitor: LocalNotifications action listener.
 * Desktop/Web: no reliable tap payload in stage 1 stubs — no-op.
 */
export async function wireNotificationTapNavigation(
  router: Router,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { LocalNotifications } = await import(
      '@capacitor/local-notifications'
    )
    await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      async (action) => {
        const id = action.notification.id
        if (typeof id !== 'number') return
        const row = await getScheduledById(id)
        if (!row) return
        await router.push({
          name: 'event-edit',
          params: { id: row.eventId },
        })
      },
    )
  } catch (err) {
    console.warn('[notification-tap] wire failed', err)
  }
}

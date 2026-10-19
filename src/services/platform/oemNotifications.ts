import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

/**
 * Best-effort jump into Android exact-alarm / notification related settings.
 * Returns whether a system UI was opened; otherwise caller should show in-app docs.
 */
export async function tryOpenAndroidReminderSettings(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false
  }
  try {
    await LocalNotifications.changeExactNotificationSetting()
    return true
  } catch {
    return false
  }
}

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export function isTauriDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

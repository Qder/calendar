import { Capacitor } from '@capacitor/core'
import { CapacitorNotificationService } from './capacitor'
import { DesktopNotificationService } from './desktop'
import type { NotificationService } from './types'
import { WebNotificationService } from './web'

export type { NotificationService, ScheduleRequest, PendingNotification } from './types'
export { CapacitorNotificationService } from './capacitor'
export { DesktopNotificationService } from './desktop'
export { WebNotificationService } from './web'

export type NotificationPlatform = 'capacitor' | 'desktop' | 'web'

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Platform selection lives ONLY in this module. */
export function detectNotificationPlatform(): NotificationPlatform {
  if (Capacitor.isNativePlatform()) return 'capacitor'
  if (isTauri()) return 'desktop'
  return 'web'
}

export function createNotificationService(): NotificationService {
  switch (detectNotificationPlatform()) {
    case 'capacitor':
      return new CapacitorNotificationService()
    case 'desktop':
      return new DesktopNotificationService()
    default:
      return new WebNotificationService()
  }
}

let singleton: NotificationService | null = null

export function getNotificationService(): NotificationService {
  if (!singleton) singleton = createNotificationService()
  return singleton
}

/** Human-readable label for the debug page. */
export function getNotificationPlatformLabel(): string {
  const kind = detectNotificationPlatform()
  if (kind === 'capacitor') {
    return `Capacitor (${Capacitor.getPlatform()})`
  }
  if (kind === 'desktop') return 'Tauri Desktop'
  return 'Web stub（关标签页即失效，仅 UI 冒烟）'
}

/** Test hook — reset singleton between vitest cases if needed. */
export function __resetNotificationServiceForTests(): void {
  singleton = null
}

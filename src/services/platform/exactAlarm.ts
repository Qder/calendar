import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import {
  setExactAlarmState,
  type ExactAlarmState,
} from '@/services/notification/scheduleHealth'
import { tryOpenAndroidReminderSettings } from './oemNotifications'

function mapExactState(raw: string | undefined): ExactAlarmState {
  if (raw === 'granted') return 'granted'
  if (raw === 'denied') return 'denied'
  if (raw === 'prompt') return 'prompt'
  return 'unknown'
}

/**
 * Read Android exact-alarm setting into scheduleHealth.
 * Non-Android → unsupported. API missing / error → unknown.
 */
export async function refreshExactAlarmStatus(): Promise<ExactAlarmState> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    setExactAlarmState('unsupported')
    return 'unsupported'
  }
  try {
    const status = await LocalNotifications.checkExactNotificationSetting()
    const state = mapExactState(status.exact_alarm)
    setExactAlarmState(state)
    return state
  } catch (err) {
    console.warn('[exact-alarm] check failed', err)
    setExactAlarmState('unknown')
    return 'unknown'
  }
}

/**
 * Cold start / save gate: refresh status; if not granted, open system
 * 「闹钟和提醒」page (reuse OEM entry) when openSettingsIfDenied.
 */
export async function ensureExactAlarmAccess(opts?: {
  openSettingsIfDenied?: boolean
}): Promise<ExactAlarmState> {
  const state = await refreshExactAlarmStatus()
  if (
    opts?.openSettingsIfDenied &&
    (state === 'denied' || state === 'prompt')
  ) {
    await tryOpenAndroidReminderSettings()
  }
  return state
}

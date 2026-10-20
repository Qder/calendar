import { registerPlugin } from '@capacitor/core'
import type { SystemAlarmTarget } from '@/domain/systemAlarm'
import { isAndroidNative } from './oemNotifications'

export interface SystemAlarmPlugin {
  setAlarm(options: {
    hour: number
    minutes: number
    message?: string
  }): Promise<{ ok: boolean }>
}

const SystemAlarm = registerPlugin<SystemAlarmPlugin>('SystemAlarm', {
  web: () => ({
    setAlarm: async () => {
      throw new Error('仅手机可用')
    },
  }),
})

export type OpenSystemAlarmResult =
  | { ok: true }
  | { ok: false; reason: string }

/**
 * Open system clock with prefilled alarm. LocalNotifications are untouched.
 * Non-Android → soft fail 「仅手机可用」.
 */
export async function openSystemAlarm(
  target: Pick<SystemAlarmTarget, 'hour' | 'minutes' | 'message'>,
): Promise<OpenSystemAlarmResult> {
  if (!isAndroidNative()) {
    return { ok: false, reason: '仅手机可用' }
  }
  try {
    await SystemAlarm.setAlarm({
      hour: target.hour,
      minutes: target.minutes,
      message: target.message,
    })
    return { ok: true }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    return { ok: false, reason: reason || '打开系统闹钟失败' }
  }
}

export function canUseSystemAlarm(): boolean {
  return isAndroidNative()
}

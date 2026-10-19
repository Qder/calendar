import { isTauriDesktop } from './oemNotifications'

export async function getAutostartEnabled(): Promise<boolean> {
  if (!isTauriDesktop()) return false
  const { isEnabled } = await import('@tauri-apps/plugin-autostart')
  return isEnabled()
}

export async function setAutostartEnabled(on: boolean): Promise<void> {
  if (!isTauriDesktop()) {
    throw new Error('开机自启仅支持桌面版')
  }
  const { enable, disable } = await import('@tauri-apps/plugin-autostart')
  if (on) await enable()
  else await disable()
}

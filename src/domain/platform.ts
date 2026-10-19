import { Capacitor } from '@capacitor/core'

/** App runtime surface for the home page (stage 0). */
export type AppPlatform = 'browser' | 'android' | 'desktop'

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Coarse platform label: browser / android / desktop.
 * Capacitor iOS would map to browser until an ios target exists.
 */
export function detectAppPlatform(): AppPlatform {
  if (isTauri()) return 'desktop'
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return 'android'
  }
  return 'browser'
}

import { rebuildAll } from './rebuildAll'

let wired = false

function onVisibility(): void {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    void rebuildAll()
  }
}

function onFocus(): void {
  void rebuildAll()
}

/** Wire start + visibility/focus refill of the rolling schedule window. */
export function wireScheduleResumeHooks(): void {
  if (wired) return
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  wired = true
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('focus', onFocus)
  void rebuildAll()
}

export function unwireScheduleResumeHooks(): void {
  if (!wired) return
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('focus', onFocus)
  wired = false
}

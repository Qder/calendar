import { rebuildAll } from './rebuildAll'

const DEBOUNCE_MS = 400

let wired = false
let timer: ReturnType<typeof setTimeout> | null = null

function scheduleRebuild(): void {
  if (timer != null) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void rebuildAll()
  }, DEBOUNCE_MS)
}

function onVisibility(): void {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    scheduleRebuild()
  }
}

function onFocus(): void {
  scheduleRebuild()
}

/** Wire start + debounced visibility/focus refill of the rolling schedule window. */
export function wireScheduleResumeHooks(): void {
  if (wired) return
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  wired = true
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('focus', onFocus)
  // Initial fill immediately (not debounced).
  void rebuildAll()
}

export function unwireScheduleResumeHooks(): void {
  if (!wired) return
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('focus', onFocus)
  if (timer != null) {
    clearTimeout(timer)
    timer = null
  }
  wired = false
}

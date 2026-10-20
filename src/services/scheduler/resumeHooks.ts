import { rebuildAll } from './rebuildAll'
import { purgeExpiredPending } from './purgeExpiredPending'
import { ensureExactAlarmAccess } from '@/services/platform/exactAlarm'

const DEBOUNCE_MS = 400

let wired = false
let timer: ReturnType<typeof setTimeout> | null = null
/** Only the first refill (cold start) auto-opens system exact-alarm settings. */
let coldStartGateDone = false

async function refillSchedule(): Promise<void> {
  const openSettings = !coldStartGateDone
  coldStartGateDone = true
  // N-exact-alarm: check on cold start; denied → guide system page.
  try {
    await ensureExactAlarmAccess({ openSettingsIfDenied: openSettings })
  } catch (err) {
    console.warn('[scheduler] exact-alarm gate failed', err)
  }
  // N-notif-miss: drop OS zombies (past still pending) before rolling rebuild.
  try {
    await purgeExpiredPending({ reissueMissed: true })
  } catch (err) {
    console.warn('[scheduler] purgeExpiredPending failed', err)
  }
  await rebuildAll()
}

function scheduleRebuild(): void {
  if (timer != null) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void refillSchedule()
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
  void refillSchedule()
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
  coldStartGateDone = false
}

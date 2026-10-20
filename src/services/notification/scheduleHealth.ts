/**
 * N-exact-alarm: surface exact-alarm denial / schedule() warning (inexact fallback).
 * Settings + Debug read this; scheduler/capacitor write it. Not persisted.
 */

export type ExactAlarmState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unknown'
  | 'unsupported'

export interface ScheduleWarningRecord {
  code: string
  message: string
  /** epoch ms when recorded */
  at: number
}

export interface ScheduleHealthSnapshot {
  exactAlarm: ExactAlarmState
  lastWarning: ScheduleWarningRecord | null
  checkedAt: number | null
}

type Listener = (snap: ScheduleHealthSnapshot) => void

let exactAlarm: ExactAlarmState = 'unknown'
let lastWarning: ScheduleWarningRecord | null = null
let checkedAt: number | null = null
const listeners = new Set<Listener>()

function emit(): void {
  const snap = getScheduleHealth()
  for (const fn of listeners) fn(snap)
}

export function getScheduleHealth(): ScheduleHealthSnapshot {
  return {
    exactAlarm,
    lastWarning,
    checkedAt,
  }
}

export function setExactAlarmState(state: ExactAlarmState): void {
  exactAlarm = state
  checkedAt = Date.now()
  if (state === 'granted') {
    // Exact again → drop stale inexact warning so UI can clear.
    lastWarning = null
  }
  emit()
}

export function recordScheduleWarning(w: {
  code: string
  message: string
}): void {
  lastWarning = {
    code: w.code,
    message: w.message,
    at: Date.now(),
  }
  emit()
}

export function clearScheduleWarning(): void {
  lastWarning = null
  emit()
}

export function subscribeScheduleHealth(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Human one-liner for Settings / Debug alerts. */
export function scheduleHealthAlertText(
  snap: ScheduleHealthSnapshot = getScheduleHealth(),
): string | null {
  if (snap.lastWarning) {
    return `日程提醒可能不准时：${snap.lastWarning.message}（${snap.lastWarning.code}）`
  }
  if (snap.exactAlarm === 'denied' || snap.exactAlarm === 'prompt') {
    return '未授权「闹钟和提醒／精确闹钟」：后台提醒可能推迟或丢掉。请到系统设置允许后重试。'
  }
  return null
}

/** Test hook. */
export function __resetScheduleHealthForTests(): void {
  exactAlarm = 'unknown'
  lastWarning = null
  checkedAt = null
  listeners.clear()
}

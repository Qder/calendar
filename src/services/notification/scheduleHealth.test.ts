import { describe, expect, it, beforeEach } from 'vitest'
import {
  __resetScheduleHealthForTests,
  clearScheduleWarning,
  getScheduleHealth,
  recordScheduleWarning,
  scheduleHealthAlertText,
  setExactAlarmState,
  subscribeScheduleHealth,
} from './scheduleHealth'

describe('scheduleHealth', () => {
  beforeEach(() => {
    __resetScheduleHealthForTests()
  })

  it('records warning and builds alert text', () => {
    recordScheduleWarning({
      code: 'OS-PLUG-LNOT-0005',
      message: 'Exact alarms not permitted; scheduled as inexact',
    })
    const snap = getScheduleHealth()
    expect(snap.lastWarning?.code).toBe('OS-PLUG-LNOT-0005')
    const text = scheduleHealthAlertText(snap)
    expect(text).toContain('不准时')
    expect(text).toContain('OS-PLUG-LNOT-0005')
  })

  it('denied without warning shows exact-alarm tip', () => {
    setExactAlarmState('denied')
    expect(scheduleHealthAlertText()).toContain('精确闹钟')
  })

  it('granted clears warning', () => {
    recordScheduleWarning({ code: 'X', message: 'm' })
    setExactAlarmState('granted')
    expect(getScheduleHealth().lastWarning).toBeNull()
    expect(scheduleHealthAlertText()).toBeNull()
  })

  it('subscribe fires on change', () => {
    const seen: string[] = []
    const off = subscribeScheduleHealth((s) => {
      seen.push(s.exactAlarm)
    })
    setExactAlarmState('denied')
    clearScheduleWarning()
    off()
    setExactAlarmState('granted')
    expect(seen).toContain('denied')
    expect(seen.at(-1)).not.toBe('granted')
  })
})

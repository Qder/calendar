import { describe, expect, it } from 'vitest'
import { pickSystemAlarmTarget } from './systemAlarm'

describe('pickSystemAlarmTarget', () => {
  const now = new Date(2026, 5, 1, 8, 0, 0, 0) // 2026-06-01 08:00

  it('returns null when no rules', () => {
    expect(
      pickSystemAlarmTarget({
        title: '吃饭',
        eventDate: '2026-06-10',
        rules: [],
        now,
      }),
    ).toBeNull()
  })

  it('maps remindTime hour/minutes; labels 当天', () => {
    const t = pickSystemAlarmTarget({
      title: '吃饭',
      eventDate: '2026-06-10',
      rules: [{ daysBefore: 0, time: '10:51' }],
      now,
    })
    expect(t).not.toBeNull()
    expect(t!.hour).toBe(10)
    expect(t!.minutes).toBe(51)
    expect(t!.message).toBe('吃饭（当天）')
    expect(t!.daysBefore).toBe(0)
    expect(t!.triggerAt!.getDate()).toBe(10)
    expect(t!.triggerAt!.getHours()).toBe(10)
  })

  it('picks soonest future among multiple offsets (same time)', () => {
    const t = pickSystemAlarmTarget({
      title: '考试',
      eventDate: '2026-06-10',
      rules: [
        { daysBefore: 7, time: '09:00' },
        { daysBefore: 1, time: '09:00' },
        { daysBefore: 0, time: '09:00' },
      ],
      now,
    })
    expect(t).not.toBeNull()
    // 前7天 6/3 09:00 is soonest after now
    expect(t!.daysBefore).toBe(7)
    expect(t!.hour).toBe(9)
    expect(t!.minutes).toBe(0)
    expect(t!.message).toBe('考试（前7天）')
  })

  it('when all past, falls back to smallest daysBefore', () => {
    const pastNow = new Date(2026, 5, 20, 12, 0, 0, 0)
    const t = pickSystemAlarmTarget({
      title: '旧事',
      eventDate: '2026-06-10',
      rules: [
        { daysBefore: 3, time: '08:00' },
        { daysBefore: 0, time: '08:00' },
      ],
      now: pastNow,
    })
    expect(t).not.toBeNull()
    expect(t!.daysBefore).toBe(0)
    expect(t!.triggerAt).toBeNull()
    expect(t!.hour).toBe(8)
    expect(t!.message).toBe('旧事（当天）')
  })

  it('empty title falls back to 日历提醒', () => {
    const t = pickSystemAlarmTarget({
      title: '   ',
      eventDate: '2026-06-10',
      rules: [{ daysBefore: 1, time: '07:30' }],
      now,
    })
    expect(t!.message).toBe('日历提醒（前1天）')
    expect(t!.hour).toBe(7)
    expect(t!.minutes).toBe(30)
  })
})

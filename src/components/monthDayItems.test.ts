import { describe, expect, it } from 'vitest'
import { buildItemsByDate } from './monthDayItems'
import type { CourseRow, PeriodRow } from '@/domain/schemas'
import type { EventOccurrence } from '@/stores/events'

const periods: PeriodRow[] = [
  { index: 1, start: '08:00', end: '08:45', label: '第1节' },
  { index: 2, start: '08:55', end: '09:40', label: '第2节' },
]

function course(partial: Partial<CourseRow> & Pick<CourseRow, 'id' | 'name' | 'weekday' | 'weeks'>): CourseRow {
  return {
    startPeriod: 1,
    endPeriod: 2,
    weeksRaw: '1-16',
    room: '',
    teacher: '',
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  }
}

describe('buildItemsByDate', () => {
  it('某日有课则聚合含 course（无事项时也列出）', () => {
    // 2026-09-07 是周一；学期从该日起共 16 周 → 2026-10-19 为第 7 周周一
    const semester = { startMonday: '2026-09-07', totalWeeks: 16 }
    const target = '2026-10-19'
    const rows = [
      course({
        id: 'c-os',
        name: '操作系统',
        weekday: 1,
        weeks: [7],
        room: '教1-101',
      }),
      course({
        id: 'c-other-day',
        name: '周二课',
        weekday: 2,
        weeks: [7],
      }),
    ]

    const map = buildItemsByDate({
      occurrences: [],
      courses: rows,
      periods,
      semester,
      dates: [target, '2026-10-20'],
    })

    const day = map[target] ?? []
    expect(day.some((i) => i.kind === 'course' && i.title === '操作系统')).toBe(
      true,
    )
    expect(day.every((i) => i.kind === 'course')).toBe(true)
    expect(map['2026-10-20']?.some((i) => i.title === '周二课')).toBe(true)
  })

  it('事项加载为空时仍保留课程；事项与课程可同日并存', () => {
    const semester = { startMonday: '2026-09-07', totalWeeks: 16 }
    const target = '2026-10-19'
    const occ: EventOccurrence = {
      occurrenceDate: target,
      event: {
        id: 'e1',
        title: '小组会',
        date: target,
        time: '14:00',
        note: '',
        recurrence: 'none',
        createdAt: 1,
        updatedAt: 1,
      },
    }
    const map = buildItemsByDate({
      occurrences: [occ],
      courses: [
        course({
          id: 'c1',
          name: '操作系统',
          weekday: 1,
          weeks: [7],
        }),
      ],
      periods,
      semester,
      dates: [target],
    })
    const kinds = (map[target] ?? []).map((i) => i.kind).sort()
    expect(kinds).toEqual(['course', 'event'])
  })

  it('无学期配置时不挂课程', () => {
    const map = buildItemsByDate({
      occurrences: [],
      courses: [
        course({ id: 'c1', name: 'X', weekday: 1, weeks: [1] }),
      ],
      periods,
      semester: null,
      dates: ['2026-10-19'],
    })
    expect(map['2026-10-19']).toBeUndefined()
  })
})

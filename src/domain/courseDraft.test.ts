import { describe, expect, it } from 'vitest'
import { buildCourseRow } from './courseDraft'

const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

describe('buildCourseRow', () => {
  it('zod + parseWeeks + 节次校验，写出可 structuredClone 的 POJO', () => {
    const row = buildCourseRow(
      {
        name: '操作系统',
        weekday: 1,
        startPeriod: 1,
        endPeriod: 2,
        weeksRaw: '1-16',
        room: '教1-101',
        teacher: '李四',
      },
      { totalWeeks: 18, periodIndices: periods, id: 'c1', now: 1000 },
    )
    expect(row.id).toBe('c1')
    expect(row.weeks).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ])
    expect(Object.getPrototypeOf(row.weeks)).toBe(Array.prototype)
    expect(() => structuredClone(row)).not.toThrow()
    expect(row.room).toBe('教1-101')
  })

  it('结束节不在节次表内则抛错', () => {
    expect(() =>
      buildCourseRow(
        {
          name: 'x',
          weekday: 1,
          startPeriod: 1,
          endPeriod: 12,
          weeksRaw: '1',
        },
        { totalWeeks: 16, periodIndices: periods },
      ),
    ).toThrow(/不在当前节次表内/)
  })

  it('结束节 < 开始节则 zod 失败', () => {
    expect(() =>
      buildCourseRow(
        {
          name: 'x',
          weekday: 1,
          startPeriod: 3,
          endPeriod: 1,
          weeksRaw: '1',
        },
        { totalWeeks: 16, periodIndices: periods },
      ),
    ).toThrow()
  })
})

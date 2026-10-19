import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import type { PreviewRowOk } from './preview'

vi.mock('@/db/repos/courses', () => ({
  clearCourses: vi.fn(async () => {}),
  putCourses: vi.fn(async () => {}),
}))

import { clearCourses, putCourses } from '@/db/repos/courses'
import { commitCoursePreview, previewRowsToCourses } from './commit'

function sampleOk(weeks: number[] = [1, 2, 6, 8, 15]): PreviewRowOk {
  return {
    rowNumber: 1,
    ok: true,
    draft: {
      name: '中国茶文化',
      weekday: 4,
      startPeriod: 9,
      endPeriod: 10,
      weeksRaw: '双6-8,15周',
      room: '教1-101',
      teacher: '张三',
    },
    weeks,
  }
}

describe('previewRowsToCourses / commitCoursePreview', () => {
  beforeEach(() => {
    vi.mocked(putCourses).mockClear()
    vi.mocked(clearCourses).mockClear()
  })

  it('展开 weeks 为真数组，可 structuredClone（reactive 预览不炸 IDB）', () => {
    const proxied = reactive(sampleOk([6, 8, 15]))
    const courses = previewRowsToCourses([proxied], 1_700_000_000_000)
    expect(courses).toHaveLength(1)
    const weeks = courses[0].weeks
    expect(Object.getPrototypeOf(weeks)).toBe(Array.prototype)
    expect(weeks).toEqual([6, 8, 15])
    expect(() => structuredClone(courses[0])).not.toThrow()
    expect(() => structuredClone(courses)).not.toThrow()
  })

  it('commit 写入 putCourses 的对象可克隆；overwrite 先 clear', async () => {
    const proxied = reactive(sampleOk())
    await commitCoursePreview([proxied], 'overwrite')
    expect(clearCourses).toHaveBeenCalledOnce()
    expect(putCourses).toHaveBeenCalledOnce()
    const written = vi.mocked(putCourses).mock.calls[0][0]
    expect(Object.getPrototypeOf(written[0].weeks)).toBe(Array.prototype)
    expect(() => structuredClone(written)).not.toThrow()
  })

  it('append 不 clear', async () => {
    await commitCoursePreview([sampleOk()], 'append')
    expect(clearCourses).not.toHaveBeenCalled()
    expect(putCourses).toHaveBeenCalledOnce()
  })
})

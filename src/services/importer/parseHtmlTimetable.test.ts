import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PERIODS } from '@/domain/periods'
import { parseWeeks } from '@/domain/parseWeeks'
import {
  decodeTimetableHtml,
  isHtmlTimetableBuffer,
  parseHtmlTimetableXls,
} from './parseHtmlTimetable'
import { parseCourseWorkbook } from './parseWorkbook'
import { previewCourseRows } from './preview'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(__dirname, '__fixtures__/yang-html-timetable.xls')

const PERIOD_IDX = DEFAULT_PERIODS.map((p) => p.index)
/** Fixture has weeks up to 17. */
const TOTAL = 18

function loadFixture(): ArrayBuffer {
  const file = readFileSync(FIXTURE)
  return file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  )
}

function enc(html: string): ArrayBuffer {
  return new TextEncoder().encode(html).buffer as ArrayBuffer
}

describe('parseHtmlTimetableXls (Yang fixture)', () => {
  const data = loadFixture()

  it('detects HTML and decodes GBK', () => {
    expect(isHtmlTimetableBuffer(data)).toBe(true)
    const html = decodeTimetableHtml(data)
    expect(html).toContain('数据库原理及应用A')
    expect(html).toContain('中国茶文化与茶健康')
    expect(/charset\s*=\s*GBK/i.test(html)).toBe(true)
  })

  it('parses grid: 连堂 rowspan、双课 ;;、双6-8,15', () => {
    const rows = parseHtmlTimetableXls(data)
    expect(rows.length).toBeGreaterThanOrEqual(18)

    const db = rows.find(
      (r) =>
        r.cells['课程名'] === '数据库原理及应用A' &&
        r.cells['星期'] === 1 &&
        r.cells['开始节'] === 1,
    )
    expect(db).toBeTruthy()
    expect(db!.cells['结束节']).toBe(2)
    expect(String(db!.cells['周次'])).toMatch(/1-10/)
    expect(parseWeeks(String(db!.cells['周次']), TOTAL)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])

    const tea = rows.find((r) => r.cells['课程名'] === '中国茶文化与茶健康')
    expect(tea).toBeTruthy()
    expect(tea!.cells['星期']).toBe(3)
    expect(tea!.cells['开始节']).toBe(10)
    expect(tea!.cells['结束节']).toBe(11)
    expect(String(tea!.cells['周次'])).toMatch(/双6-8,\s*15/)
    expect(parseWeeks(String(tea!.cells['周次']), TOTAL)).toEqual([6, 8, 15])

    // 同一格两门课（;;）
    const duo = rows.filter(
      (r) =>
        r.cells['星期'] === 3 &&
        r.cells['开始节'] === 5 &&
        (r.cells['课程名'] === '数据库原理及应用A' ||
          r.cells['课程名'] === '离散结构B'),
    )
    expect(duo.map((r) => r.cells['课程名']).sort()).toEqual(
      ['数据库原理及应用A', '离散结构B'].sort(),
    )
  })

  it('parseCourseWorkbook routes HTML fixture', () => {
    const rows = parseCourseWorkbook(data)
    expect(rows.some((r) => r.cells['课程名'] === '数据库原理及应用A')).toBe(
      true,
    )
  })

  it('preview ok for key rows with extended period table', () => {
    const idx = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    const preview = previewCourseRows(parseHtmlTimetableXls(data), TOTAL, idx)
    const okDb = preview.find(
      (p) =>
        p.ok &&
        p.draft.name === '数据库原理及应用A' &&
        p.draft.weekday === 1 &&
        p.draft.startPeriod === 1,
    )
    expect(okDb?.ok).toBe(true)
    if (okDb && okDb.ok) {
      expect(okDb.weeks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    }
    const okTea = preview.find(
      (p) => p.ok && p.draft.name === '中国茶文化与茶健康',
    )
    expect(okTea?.ok).toBe(true)
    if (okTea && okTea.ok) {
      expect(okTea.weeks).toEqual([6, 8, 15])
    }
  })
})

describe('parseHtmlTimetableXls fixtures (empty / illegal)', () => {
  it('empty table', () => {
    const html =
      '<html><body><table id="manualArrangeCourseTable"><tr><th>节次/周次</th><th>星期一</th></tr></table></body></html>'
    expect(() => parseHtmlTimetableXls(enc(html))).toThrow(/没有可解析/)
  })

  it('missing weekday header', () => {
    const html =
      '<html><table><tr><th>节次</th><th>其它</th></tr><tr><td>第一节</td><td>x</td></tr></table></html>'
    expect(() => parseHtmlTimetableXls(enc(html))).toThrow(/星期一/)
  })

  it('illegal weeks surface in preview', () => {
    const html = `<html><body><table id="manualArrangeCourseTable">
      <tr><th>节次/周次</th><th>星期一</th><th>星期二</th><th>星期三</th><th>星期四</th><th>星期五</th><th>星期六</th><th>星期日</th></tr>
      <tr><td>第一节</td>
        <td class="infoTitle" rowspan="2" title="测试课 ;教师：甲;周次：abc周;教室：A1">测试课<br/>教师：甲<br/>周次：abc周<br/>教室：A1</td>
        <td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
      <tr><td>第二节</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    </table></body></html>`
    const raw = parseHtmlTimetableXls(enc(html))
    expect(raw).toHaveLength(1)
    const preview = previewCourseRows(raw, 16, PERIOD_IDX)
    expect(preview[0].ok).toBe(false)
  })
})

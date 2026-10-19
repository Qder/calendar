import { parseWeeks } from '@/domain/parseWeeks'
import {
  CourseImportDraftSchema,
  type CourseImportDraft,
} from '@/domain/schemas'
import { parseWeekdayCell } from './weekday'
import type { RawCourseSheetRow } from './parseWorkbook'

export interface PreviewRowOk {
  rowNumber: number
  ok: true
  draft: CourseImportDraft
  weeks: number[]
}

export interface PreviewRowErr {
  rowNumber: number
  ok: false
  errors: string[]
  raw: Record<string, unknown>
}

export type PreviewRow = PreviewRowOk | PreviewRowErr

function toInt(v: unknown, label: string): number {
  if (typeof v === 'number' && Number.isInteger(v)) return v
  const s = String(v ?? '')
    .normalize('NFKC')
    .trim()
  if (!/^\d+$/.test(s)) throw new SyntaxError(`${label}须为整数`)
  return Number(s)
}

/** Validate each raw row with zod + parseWeeks; collect errors for red UI. */
export function previewCourseRows(
  rows: RawCourseSheetRow[],
  totalWeeks: number,
): PreviewRow[] {
  return rows.map((row) => {
    const errors: string[] = []
    let weekday = 1
    let startPeriod = 1
    let endPeriod = 1
    try {
      weekday = parseWeekdayCell(row.cells['星期'])
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
    }
    try {
      startPeriod = toInt(row.cells['开始节'], '开始节')
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
    }
    try {
      endPeriod = toInt(row.cells['结束节'], '结束节')
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
    }

    const candidate = {
      name: String(row.cells['课程名'] ?? '')
        .normalize('NFKC')
        .trim(),
      weekday,
      startPeriod,
      endPeriod,
      weeksRaw: String(row.cells['周次'] ?? '')
        .normalize('NFKC')
        .trim(),
      room: String(row.cells['教室'] ?? '')
        .normalize('NFKC')
        .trim(),
      teacher: String(row.cells['教师'] ?? '')
        .normalize('NFKC')
        .trim(),
    }

    const parsed = CourseImportDraftSchema.safeParse(candidate)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(issue.message)
      }
    }

    let weeks: number[] = []
    if (parsed.success) {
      try {
        weeks = parseWeeks(parsed.data.weeksRaw, totalWeeks)
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }

    if (errors.length > 0 || !parsed.success) {
      return {
        rowNumber: row.rowNumber,
        ok: false,
        errors: [...new Set(errors)],
        raw: row.cells,
      }
    }

    return {
      rowNumber: row.rowNumber,
      ok: true,
      draft: parsed.data,
      weeks,
    }
  })
}

import * as XLSX from 'xlsx'
import { COURSE_TEMPLATE_HEADERS } from '@/domain/schemas'
import {
  isHtmlTimetableBuffer,
  parseHtmlTimetableXls,
} from './parseHtmlTimetable'

export interface RawCourseSheetRow {
  /** 1-based spreadsheet row (header is row 1); HTML grid uses sequential ids. */
  rowNumber: number
  cells: Record<string, unknown>
}

const REQUIRED = [...COURSE_TEMPLATE_HEADERS]

function cellStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number' && Number.isFinite(v)) {
    // SheetJS may give numeric weeks like 1 — keep as int string when whole
    if (Number.isInteger(v)) return String(v)
    return String(v)
  }
  return String(v).trim()
}

function isRowEmpty(cells: Record<string, unknown>): boolean {
  return REQUIRED.every((h) => cellStr(cells[h]) === '')
}

/**
 * Parse workbook / 教务 HTML 课表 into raw row objects keyed by template headers.
 *
 * - HTML / 「.xls」个人课程表网格（含 rowspan、GBK）：走 parseHtmlTimetableXls
 * - 否则：官方 SheetJS 读模板列（课程名|星期|…）
 */
export function parseCourseWorkbook(data: ArrayBuffer): RawCourseSheetRow[] {
  if (isHtmlTimetableBuffer(data)) {
    try {
      return parseHtmlTimetableXls(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`教务 HTML 课表解析失败：${msg}`, { cause: e })
    }
  }
  return parseTemplateWorkbook(data)
}

function parseTemplateWorkbook(data: ArrayBuffer): RawCourseSheetRow[] {
  let book: XLSX.WorkBook
  try {
    book = XLSX.read(data, { type: 'array', cellDates: false })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(
      `无法读取 Excel（若是教务导出的 HTML/.xls，请确认文件未损坏）。${msg}`,
      { cause: e },
    )
  }
  const name = book.SheetNames[0]
  if (!name) throw new Error('工作簿没有工作表')
  const sheet = book.Sheets[name]
  const aoa = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  })
  if (aoa.length === 0) throw new Error('工作表为空')

  const headerRow = (aoa[0] ?? []).map((c) => cellStr(c))
  const indexOf: Record<string, number> = {}
  for (const h of REQUIRED) {
    const idx = headerRow.findIndex((c) => c === h)
    if (idx < 0) {
      throw new Error(
        `缺少列「${h}」。请使用模板列：${REQUIRED.join('|')}；或导入教务「个人课程表」HTML/.xls 网格。`,
      )
    }
    indexOf[h] = idx
  }

  const out: RawCourseSheetRow[] = []
  for (let i = 1; i < aoa.length; i++) {
    const line = aoa[i] ?? []
    const cells: Record<string, unknown> = {}
    for (const h of REQUIRED) {
      cells[h] = line[indexOf[h]] ?? ''
    }
    if (isRowEmpty(cells)) continue
    out.push({ rowNumber: i + 1, cells })
  }
  return out
}

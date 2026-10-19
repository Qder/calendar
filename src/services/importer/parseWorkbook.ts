import * as XLSX from 'xlsx'
import { COURSE_TEMPLATE_HEADERS } from '@/domain/schemas'

export interface RawCourseSheetRow {
  /** 1-based spreadsheet row (header is row 1). */
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
 * Parse first sheet into raw row objects keyed by template headers.
 * Does **not** support merged-cell 教务表 layouts.
 */
export function parseCourseWorkbook(data: ArrayBuffer): RawCourseSheetRow[] {
  const book = XLSX.read(data, { type: 'array', cellDates: false })
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
      throw new Error(`缺少列「${h}」。请使用模板列：${REQUIRED.join('|')}`)
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

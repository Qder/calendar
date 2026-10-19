/**
 * Parse 教务「个人课程表」HTML/.xls exports (charset GBK, rowspan grid).
 * Not a BIFF workbook — SheetJS sheet_to_json loses rowspan / garbles GBK.
 */

import type { RawCourseSheetRow } from './parseWorkbook'

const WEEKDAY_HEADER: Record<string, number> = {
  星期一: 1,
  星期二: 2,
  星期三: 3,
  星期四: 4,
  星期五: 5,
  星期六: 6,
  星期日: 7,
  星期天: 7,
  周一: 1,
  周二: 2,
  周三: 3,
  周四: 4,
  周五: 5,
  周六: 6,
  周日: 7,
  周天: 7,
}

const CN_NUM: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
}

export function isHtmlTimetableBuffer(data: ArrayBuffer): boolean {
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(data.byteLength > 512 ? data.slice(0, 512) : data)
    .replace(/^\uFEFF/, '')
    .trimStart()
    .slice(0, 256)
    .toLowerCase()
  return (
    head.startsWith('<html') ||
    head.startsWith('<!doctype html') ||
    head.includes('<table') ||
    head.startsWith('<div')
  )
}

/** Decode HTML timetable bytes: utf-8 first; if charset=GBK / replacement → gbk. */
export function decodeTimetableHtml(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data)
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  const metaGbk = /charset\s*=\s*["']?\s*(gbk|gb2312|gb18030)/i.test(utf8)
  const hasReplacement = utf8.includes('\uFFFD')
  if (metaGbk || hasReplacement) {
    try {
      return new TextDecoder('gbk').decode(bytes)
    } catch {
      try {
        return new TextDecoder('gb18030').decode(bytes)
      } catch {
        /* fall through */
      }
    }
  }
  return utf8
}

interface CellAttrs {
  rowspan: number
  colspan: number
  title: string
  className: string
}

interface RawCell {
  attrs: CellAttrs
  text: string
}

interface GridOrigin {
  text: string
  title: string
  className: string
  rowspan: number
  colspan: number
}

/**
 * Parse first grid table (个人课程表) into template-shaped raw rows.
 * Second 「课程清单」table is ignored.
 */
export function parseHtmlTimetableXls(data: ArrayBuffer): RawCourseSheetRow[] {
  if (!isHtmlTimetableBuffer(data)) {
    throw new Error('不是教务 HTML 课表（缺少 <html>/<table>）')
  }
  const html = decodeTimetableHtml(data)
  const tableHtml = extractFirstGridTable(html)
  if (!tableHtml) {
    throw new Error('未找到课表网格表（期望含「节次/周次」与星期一…日）')
  }
  const rows = parseTableRows(tableHtml)
  if (rows.length === 0) {
    throw new Error('课表网格表为空')
  }

  const { grid, rowCount, colCount } = buildOccupancyGrid(rows)
  const headerRow = 0
  const weekdayOfCol: (number | null)[] = Array.from({ length: colCount }, () => null)
  for (let c = 0; c < colCount; c++) {
    const origin = grid.get(key(headerRow, c))
    if (!origin) continue
    const label = cleanText(origin.text)
    const wd = WEEKDAY_HEADER[label]
    if (wd) weekdayOfCol[c] = wd
  }
  if (!weekdayOfCol.some((w) => w != null)) {
    throw new Error('课表表头缺少星期一…星期日列')
  }

  const periodOfRow: (number | null)[] = Array.from({ length: rowCount }, () => null)
  for (let r = 1; r < rowCount; r++) {
    const origin = grid.get(key(r, 0))
    if (!origin) continue
    const p = parsePeriodLabel(cleanText(origin.text))
    if (p != null) periodOfRow[r] = p
  }

  const out: RawCourseSheetRow[] = []
  let seq = 0
  for (let r = 1; r < rowCount; r++) {
    for (let c = 1; c < colCount; c++) {
      const origin = grid.get(key(r, c))
      if (!origin) continue
      const startPeriod = periodOfRow[r]
      if (startPeriod == null) continue
      const endPeriod = resolveEndPeriod(periodOfRow, r, origin.rowspan)
      const weekday = weekdayOfCol[c]
      if (weekday == null) continue

      const source =
        origin.title.trim() ||
        (origin.className.includes('infoTitle') ? origin.text : '') ||
        origin.text
      if (!looksLikeCourse(source) && !looksLikeCourse(origin.text)) continue

      const blocks = splitCourseBlocks(origin.title.trim() || origin.text)
      for (const block of blocks) {
        const fields = parseCourseFields(block)
        if (!fields.name) continue
        seq += 1
        out.push({
          rowNumber: seq,
          cells: {
            课程名: fields.name,
            星期: weekday,
            开始节: startPeriod,
            结束节: endPeriod,
            周次: fields.weeksRaw,
            教室: fields.room,
            教师: fields.teacher,
          },
        })
      }
    }
  }

  if (out.length === 0) {
    throw new Error('课表网格中没有可解析的课程单元格')
  }
  return out
}

function key(r: number, c: number): string {
  return `${r},${c}`
}

function extractFirstGridTable(html: string): string | null {
  const named = html.match(
    /<table\b[^>]*\bid\s*=\s*["']manualArrangeCourseTable["'][^>]*>[\s\S]*?<\/table>/i,
  )
  if (named) return named[0]
  const all = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)]
  for (const m of all) {
    if (/节次\s*\/\s*周次|星期一/.test(m[0])) return m[0]
  }
  return all[0]?.[0] ?? null
}

function parseTableRows(tableHtml: string): RawCell[][] {
  const rows: RawCell[][] = []
  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch: RegExpExecArray | null
  while ((trMatch = trRe.exec(tableHtml))) {
    const inner = trMatch[1]
    const cells: RawCell[] = []
    const cellRe = /<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi
    let cellMatch: RegExpExecArray | null
    while ((cellMatch = cellRe.exec(inner))) {
      const attrStr = cellMatch[2] ?? ''
      const rawBody = cellMatch[3] ?? ''
      cells.push({
        attrs: {
          rowspan: parseSpan(attrStr, 'rowspan'),
          colspan: parseSpan(attrStr, 'colspan'),
          title: getAttr(attrStr, 'title'),
          className: getAttr(attrStr, 'class'),
        },
        text: htmlCellToText(rawBody),
      })
    }
    if (cells.length > 0) rows.push(cells)
  }
  return rows
}

function parseSpan(attrs: string, name: string): number {
  const m = attrs.match(new RegExp(`${name}\\s*=\\s*["']?(\\d+)`, 'i'))
  const n = m ? Number(m[1]) : 1
  return Number.isFinite(n) && n >= 1 ? n : 1
}

function getAttr(attrs: string, name: string): string {
  const m = attrs.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
  if (!m) return ''
  return (m[2] ?? m[3] ?? '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")
}

function htmlCellToText(raw: string): string {
  let s = raw
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<[^>]+>/g, '')
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  return s
}

function buildOccupancyGrid(rows: RawCell[][]): {
  grid: Map<string, GridOrigin>
  rowCount: number
  colCount: number
} {
  const grid = new Map<string, GridOrigin>()
  const occupied = new Set<string>()
  let colCount = 0

  for (let r = 0; r < rows.length; r++) {
    let c = 0
    for (const cell of rows[r]) {
      while (occupied.has(key(r, c))) c += 1
      const { rowspan, colspan, title, className } = cell.attrs
      for (let dr = 0; dr < rowspan; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          const kk = key(r + dr, c + dc)
          occupied.add(kk)
          if (dr === 0 && dc === 0) {
            grid.set(kk, {
              text: cell.text,
              title,
              className,
              rowspan,
              colspan,
            })
          }
        }
      }
      colCount = Math.max(colCount, c + colspan)
      c += colspan
    }
  }

  return { grid, rowCount: rows.length, colCount }
}

function cleanText(s: string): string {
  return s.normalize('NFKC').replace(/[\s\u3000]+/g, '')
}

function parsePeriodLabel(label: string): number | null {
  const t = cleanText(label)
  const m = t.match(/^第([一二三四五六七八九十两零〇\d]+)节/)
  if (!m) return null
  const token = m[1]
  if (/^\d+$/.test(token)) return Number(token)
  return cnToInt(token)
}

function cnToInt(token: string): number | null {
  if (token in CN_NUM && token !== '十') return CN_NUM[token]
  if (token === '十') return 10
  const m = token.match(/^十([一二三四五六七八九])$/)
  if (m) return 10 + CN_NUM[m[1]]
  const m2 = token.match(/^([一二三四五六七八九])十([一二三四五六七八九])?$/)
  if (m2) return CN_NUM[m2[1]] * 10 + (m2[2] ? CN_NUM[m2[2]] : 0)
  return null
}

function resolveEndPeriod(
  periodOfRow: (number | null)[],
  startRow: number,
  rowspan: number,
): number {
  const start = periodOfRow[startRow]
  if (start == null) return 1
  let end = start
  for (let i = 0; i < rowspan; i++) {
    const p = periodOfRow[startRow + i]
    if (p != null) end = Math.max(end, p)
  }
  // If intermediate period rows missing labels (covered by rowspan elsewhere),
  // fall back to start + rowspan - 1
  if (end === start && rowspan > 1) {
    end = start + rowspan - 1
  }
  return end
}

function looksLikeCourse(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  return /周次|教师|教室/.test(t) || t.includes(';;')
}

function splitCourseBlocks(source: string): string[] {
  const s = source.trim()
  if (!s) return []
  if (s.includes(';;')) {
    return s.split(';;').map((x) => x.trim()).filter(Boolean)
  }
  // Body with two stacked courses sometimes repeats 教师/周次/教室 blocks
  // without ;; — split before a second name-like run after 教室 line.
  const byTeacher = s.split(/(?=\n(?!教师|周次|教室)[^\n]+(?:\n教师[:：]|\n周次[:：]))/)
  if (byTeacher.length > 1) return byTeacher.map((x) => x.trim()).filter(Boolean)
  return [s]
}

function parseCourseFields(block: string): {
  name: string
  teacher: string
  weeksRaw: string
  room: string
} {
  const s = block.replace(/\r/g, '').trim()
  // Title style uses `;` separators; normalize to newlines for field pick
  const teacher = matchField(s, /教师\s*[:：]\s*([^;；\n]*)/)
  const weeksRaw = matchField(s, /周次\s*[:：]\s*([^;；\n]*)/)
  const room = matchField(s, /教室\s*[:：]\s*([^;；\n]*)/)

  const nameCut = s.search(/[;；]?\s*教师\s*[:：]/)
  const nameRaw =
    nameCut >= 0 ? s.slice(0, nameCut) : (s.split(/\n|;|；/)[0] ?? '')
  const name = nameRaw
    .replace(/[;；]\s*$/, '')
    .trim()
    .replace(/^(课程名|课程)\s*[:：]\s*/, '')
    .trim()

  return {
    name,
    teacher: teacher.trim(),
    weeksRaw: weeksRaw.trim(),
    room: room.trim(),
  }
}

function matchField(s: string, re: RegExp): string {
  const m = s.match(re)
  return m?.[1]?.trim() ?? ''
}

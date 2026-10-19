import type { SchemaWeekday } from '@/domain/schemas'

const MAP: Record<string, SchemaWeekday> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  日: 7,
  天: 7,
  周一: 1,
  周二: 2,
  周三: 3,
  周四: 4,
  周五: 5,
  周六: 6,
  周日: 7,
  周天: 7,
  星期一: 1,
  星期二: 2,
  星期三: 3,
  星期四: 4,
  星期五: 5,
  星期六: 6,
  星期日: 7,
  星期天: 7,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
}

/** Parse weekday cell → 1=Mon…7=Sun. */
export function parseWeekdayCell(raw: unknown): SchemaWeekday {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= 7) {
    return raw as SchemaWeekday
  }
  const s = String(raw ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
  if (!s) throw new SyntaxError('星期不能为空')
  const hit = MAP[s]
  if (hit) return hit
  // 「周1」「星期1」
  const m = s.match(/^(?:星期|周)?([1-7一二三四五六日天])$/)
  if (m) {
    const again = MAP[m[1]]
    if (again) return again
  }
  throw new SyntaxError(`无法解析星期: ${raw}`)
}

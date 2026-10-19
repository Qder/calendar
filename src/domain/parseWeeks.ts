/**
 * Parse teaching-week expressions into sorted unique 1-based week numbers.
 *
 * ## Supported syntax (documented; pick one 单双 style)
 *
 * 1. Ranges / lists (ASCII or full-width):
 *    - `1-16` / `１－１６`
 *    - `1,3,5` / `1，3，5` / `1、3、5`
 *    - `1-8,10-16`
 * 2. Odd / even for the whole semester (`totalWeeks`):
 *    - `单周` or `单` → 1,3,5,… ≤ totalWeeks
 *    - `双周` or `双` → 2,4,6,… ≤ totalWeeks
 *
 * Optional trailing `周` on numeric forms is stripped (`1-16周`).
 *
 * **Not supported** (by design, one 单双 style only): `1-16单` / `1-16双`.
 * Use `单周`/`双周`, or an explicit list/range.
 *
 * Errors: empty, illegal tokens, week &lt; 1, week &gt; totalWeeks.
 */
export function parseWeeks(raw: string, totalWeeks: number): number[] {
  if (!Number.isInteger(totalWeeks) || totalWeeks < 1) {
    throw new RangeError(`totalWeeks must be a positive integer, got ${totalWeeks}`)
  }
  const normalized = normalizeWeeksInput(raw)
  if (!normalized) {
    throw new SyntaxError('周次不能为空')
  }

  if (normalized === '单' || normalized === '单周') {
    return oddsThrough(totalWeeks)
  }
  if (normalized === '双' || normalized === '双周') {
    return evensThrough(totalWeeks)
  }

  const parts = normalized.split(/[,，、]+/).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) {
    throw new SyntaxError(`无法解析周次: ${raw}`)
  }

  const set = new Set<number>()
  for (const part of parts) {
    const range = part.match(/^(\d+)\s*[-－–—~～]\s*(\d+)$/)
    if (range) {
      const a = Number(range[1])
      const b = Number(range[2])
      if (a > b) {
        throw new SyntaxError(`周次范围起止颠倒: ${part}`)
      }
      for (let w = a; w <= b; w++) addWeek(set, w, totalWeeks, raw)
      continue
    }
    if (/^\d+$/.test(part)) {
      addWeek(set, Number(part), totalWeeks, raw)
      continue
    }
    throw new SyntaxError(`非法周次片段: ${part}`)
  }

  return [...set].sort((x, y) => x - y)
}

function addWeek(
  set: Set<number>,
  w: number,
  totalWeeks: number,
  raw: string,
): void {
  if (!Number.isInteger(w) || w < 1) {
    throw new SyntaxError(`周次必须 ≥ 1: ${raw}`)
  }
  if (w > totalWeeks) {
    throw new RangeError(`周次 ${w} 超出总周数 ${totalWeeks}`)
  }
  set.add(w)
}

function oddsThrough(n: number): number[] {
  const out: number[] = []
  for (let i = 1; i <= n; i += 2) out.push(i)
  return out
}

function evensThrough(n: number): number[] {
  const out: number[] = []
  for (let i = 2; i <= n; i += 2) out.push(i)
  return out
}

/** NFKC + strip spaces + drop trailing 周 on the whole string when numeric-ish. */
export function normalizeWeeksInput(raw: string): string {
  let s = raw.normalize('NFKC').trim()
  s = s.replace(/[\s\u3000]+/g, '')
  // Strip a single trailing 周 for forms like 1-16周 (not for 单周/双周 — those keep 周)
  if (s !== '单周' && s !== '双周' && s.endsWith('周')) {
    s = s.slice(0, -1)
  }
  return s
}

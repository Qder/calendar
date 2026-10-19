import { addDaysYmd, addMonthsYmd } from './date'

/**
 * Recurrence frequency for a series (whole-series edit/delete only).
 *
 * Month-end / leap-day policy (**clamp to last day of target month**):
 * - Monthly from day 31: short months use the last valid day (Jan 31 → Feb 28/29 → Mar 31 …).
 * - Yearly from Feb 29: non-leap years clamp to Feb 28; leap years keep Feb 29.
 * Occurrences are always computed as `start + N periods` (not iteratively from the
 * previous clamped date), so the anchor day is preserved across long months.
 */
export type RecurrenceFreq = 'none' | 'weekly' | 'monthly' | 'yearly'

export const RECURRENCE_FREQS: RecurrenceFreq[] = [
  'none',
  'weekly',
  'monthly',
  'yearly',
]

function addYearsYmd(ymd: string, years: number): string {
  return addMonthsYmd(ymd, years * 12)
}

function nextOccurrence(startYmd: string, freq: RecurrenceFreq, index: number): string {
  switch (freq) {
    case 'none':
      return startYmd
    case 'weekly':
      return addDaysYmd(startYmd, 7 * index)
    case 'monthly':
      return addMonthsYmd(startYmd, index)
    case 'yearly':
      return addYearsYmd(startYmd, index)
    default: {
      const _exhaustive: never = freq
      return _exhaustive
    }
  }
}

/**
 * Expand occurrence dates in the inclusive window [fromYmd, toYmd].
 * Only dates on/after `startYmd` are produced.
 */
export function expandOccurrences(
  startYmd: string,
  freq: RecurrenceFreq,
  fromYmd: string,
  toYmd: string,
): string[] {
  if (fromYmd > toYmd) return []
  if (startYmd > toYmd) return []

  if (freq === 'none') {
    if (startYmd >= fromYmd && startYmd <= toYmd) return [startYmd]
    return []
  }

  const out: string[] = []
  // Hard safety cap so a bad caller cannot infinite-loop.
  const hardMax = 400
  for (let i = 0; i < hardMax; i++) {
    const occ = nextOccurrence(startYmd, freq, i)
    if (occ > toYmd) break
    if (occ >= fromYmd) out.push(occ)
    // none already returned; weekly/monthly/yearly always advance
    if (freq === 'weekly' || freq === 'monthly' || freq === 'yearly') {
      // continue
    }
  }
  return out
}

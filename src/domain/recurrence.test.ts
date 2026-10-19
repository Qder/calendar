import { describe, expect, it } from 'vitest'
import { expandOccurrences } from './recurrence'

describe('expandOccurrences', () => {
  it('none: only start when inside window', () => {
    expect(expandOccurrences('2026-06-10', 'none', '2026-06-01', '2026-06-30')).toEqual([
      '2026-06-10',
    ])
    expect(expandOccurrences('2026-07-01', 'none', '2026-06-01', '2026-06-30')).toEqual([])
  })

  it('weekly: same weekday inside window', () => {
    // 2026-06-01 is Monday
    expect(
      expandOccurrences('2026-06-01', 'weekly', '2026-06-01', '2026-06-30'),
    ).toEqual([
      '2026-06-01',
      '2026-06-08',
      '2026-06-15',
      '2026-06-22',
      '2026-06-29',
    ])
  })

  it('weekly: series started before window still expands into it', () => {
    expect(
      expandOccurrences('2026-05-18', 'weekly', '2026-06-01', '2026-06-14'),
    ).toEqual(['2026-06-01', '2026-06-08'])
  })

  it('monthly: end-of-month 31 clamps to short months (anchor from start)', () => {
    // Jan 31 → Feb 28 (2026 non-leap) → Mar 31 → Apr 30
    expect(
      expandOccurrences('2026-01-31', 'monthly', '2026-01-01', '2026-04-30'),
    ).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('monthly: Jan 31 in leap year clamps Feb to 29', () => {
    expect(
      expandOccurrences('2024-01-31', 'monthly', '2024-01-01', '2024-03-31'),
    ).toEqual(['2024-01-31', '2024-02-29', '2024-03-31'])
  })

  it('yearly: Feb 29 leap keeps 29; non-leap clamps to 28', () => {
    // Policy: clamp to last day of February in non-leap years.
    expect(
      expandOccurrences('2024-02-29', 'yearly', '2024-01-01', '2028-12-31'),
    ).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ])
  })

  it('empty when start after window', () => {
    expect(expandOccurrences('2026-08-01', 'weekly', '2026-06-01', '2026-06-30')).toEqual(
      [],
    )
  })

  it('empty when from > to', () => {
    expect(expandOccurrences('2026-06-01', 'weekly', '2026-06-30', '2026-06-01')).toEqual(
      [],
    )
  })
})

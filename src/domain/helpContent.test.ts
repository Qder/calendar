import { describe, expect, it } from 'vitest'
import { HELP_SECTIONS, filterHelpSections } from './helpContent'

describe('filterHelpSections', () => {
  it('empty query returns all sections', () => {
    expect(filterHelpSections('')).toHaveLength(HELP_SECTIONS.length)
    expect(filterHelpSections('   ')).toHaveLength(HELP_SECTIONS.length)
  })

  it('matches title', () => {
    const hit = filterHelpSections('月视图')
    expect(hit.some((s) => s.id === 'month-week')).toBe(true)
  })

  it('matches keywords case-insensitively', () => {
    const hit = filterHelpSections('ALARM')
    expect(hit.some((s) => s.id === 'reminder-kind')).toBe(true)
  })

  it('matches body substring', () => {
    const hit = filterHelpSections('VALARM')
    expect(hit.some((s) => s.id === 'backup')).toBe(true)
  })

  it('no match yields empty', () => {
    expect(filterHelpSections('zzzz-not-a-topic-zzzz')).toEqual([])
  })
})

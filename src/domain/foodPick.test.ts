import { describe, expect, it, vi } from 'vitest'
import { normalizeFoodName, pickRandomFood } from './foodPick'

describe('normalizeFoodName', () => {
  it('trims and collapses inner spaces', () => {
    expect(normalizeFoodName('  番茄  炒蛋  ')).toBe('番茄 炒蛋')
  })

  it('empty after trim stays empty', () => {
    expect(normalizeFoodName('   ')).toBe('')
  })
})

describe('pickRandomFood', () => {
  it('returns null for empty', () => {
    expect(pickRandomFood([])).toBeNull()
  })

  it('returns the only item', () => {
    expect(pickRandomFood(['只有这个'])).toBe('只有这个')
  })

  it('picks within range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    expect(pickRandomFood(['a', 'b', 'c'])).toBe('c')
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(pickRandomFood(['a', 'b', 'c'])).toBe('a')
    vi.restoreAllMocks()
  })
})

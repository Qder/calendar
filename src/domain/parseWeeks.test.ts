import { describe, expect, it } from 'vitest'
import { parseWeeks } from './parseWeeks'

const T = 16

describe('parseWeeks', () => {
  it('1-16', () => {
    expect(parseWeeks('1-16', T)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ])
  })

  it('1,3,5', () => {
    expect(parseWeeks('1,3,5', T)).toEqual([1, 3, 5])
  })

  it('1-8,10-16', () => {
    expect(parseWeeks('1-8,10-16', T)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16,
    ])
  })

  it('单周 / 双周', () => {
    expect(parseWeeks('单周', T)).toEqual([1, 3, 5, 7, 9, 11, 13, 15])
    expect(parseWeeks('双', T)).toEqual([2, 4, 6, 8, 10, 12, 14, 16])
  })

  it('prefix 双6-8,15周 / 单1-16', () => {
    expect(parseWeeks('双6-8,15周', T)).toEqual([6, 8, 15])
    expect(parseWeeks('单1-16', T)).toEqual([1, 3, 5, 7, 9, 11, 13, 15])
    expect(parseWeeks('双周6-8,15', T)).toEqual([6, 8, 15])
  })

  it('full-width digits and separators', () => {
    expect(parseWeeks('１－３，５', T)).toEqual([1, 2, 3, 5])
    expect(parseWeeks('1、3、5', T)).toEqual([1, 3, 5])
  })

  it('trailing 周 on numeric', () => {
    expect(parseWeeks('1-4周', T)).toEqual([1, 2, 3, 4])
  })

  it('rejects empty', () => {
    expect(() => parseWeeks('  ', T)).toThrow(/空/)
  })

  it('rejects illegal and suffix 单双', () => {
    expect(() => parseWeeks('abc', T)).toThrow(/非法/)
    expect(() => parseWeeks('1-16单', T)).toThrow(/非法/)
    expect(() => parseWeeks('1-16双', T)).toThrow(/非法/)
  })

  it('rejects over totalWeeks', () => {
    expect(() => parseWeeks('1-20', T)).toThrow(/超出总周数/)
    expect(() => parseWeeks('17', T)).toThrow(/超出总周数/)
  })

  it('rejects inverted range', () => {
    expect(() => parseWeeks('5-2', T)).toThrow(/颠倒/)
  })
})

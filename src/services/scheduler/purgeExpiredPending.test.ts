import { describe, expect, it } from 'vitest'
import type { PendingNotification } from '@/services/notification/types'
import { selectExpiredPending } from './purgeExpiredPending'

function p(
  id: number,
  triggerAt: Date | null,
  title = 'x',
): PendingNotification {
  return { id, title, body: 'b', triggerAt }
}

describe('selectExpiredPending', () => {
  const now = Date.parse('2026-10-20T12:44:00+08:00')

  it('keeps future triggers', () => {
    const future = p(1, new Date(now + 60_000))
    expect(selectExpiredPending([future], now)).toEqual([])
  })

  it('selects past triggers', () => {
    const past = p(2, new Date(now - 60_000))
    expect(selectExpiredPending([past], now).map((x) => x.id)).toEqual([2])
  })

  it('selects triggerAt equal to now', () => {
    const eq = p(3, new Date(now))
    expect(selectExpiredPending([eq], now).map((x) => x.id)).toEqual([3])
  })

  it('skips null triggerAt', () => {
    expect(selectExpiredPending([p(4, null)], now)).toEqual([])
  })

  it('mixed list only returns expired', () => {
    const list = [
      p(1, new Date(now - 1)),
      p(2, new Date(now + 1)),
      p(3, null),
    ]
    expect(selectExpiredPending(list, now).map((x) => x.id)).toEqual([1])
  })
})

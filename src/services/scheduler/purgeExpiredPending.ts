import { deleteScheduledById } from '@/db/repos/scheduledNotifications'
import { toNotificationId } from '@/domain/triggerAt'
import { getNotificationService } from '@/services/notification'
import type { PendingNotification } from '@/services/notification/types'

/** Grace: treat triggerAt within this many ms of now as still due (clock skew). */
export const EXPIRED_GRACE_MS = 0

export interface PurgeExpiredResult {
  cancelledIds: number[]
  reissuedIds: number[]
}

/** Pure: pending entries whose triggerAt is at or before now (+ grace). */
export function selectExpiredPending(
  pending: readonly PendingNotification[],
  nowMs: number,
  graceMs: number = EXPIRED_GRACE_MS,
): PendingNotification[] {
  const cutoff = nowMs + graceMs
  return pending.filter((p) => {
    if (!p.triggerAt) return false
    return p.triggerAt.getTime() <= cutoff
  })
}

/**
 * Scan OS pending notifications; cancel those already past; drop matching Dexie rows.
 * Optional Nice: re-fire a near-immediate "错过的提醒" so the miss is not silent.
 *
 * Idempotent: future pending untouched. Safe to call on cold start / foreground.
 */
export async function purgeExpiredPending(opts?: {
  now?: Date
  reissueMissed?: boolean
}): Promise<PurgeExpiredResult> {
  const now = opts?.now ?? new Date()
  const nowMs = now.getTime()
  const reissue = opts?.reissueMissed !== false
  const svc = getNotificationService()

  const pending = await svc.listPending()
  const expired = selectExpiredPending(pending, nowMs)

  const cancelledIds: number[] = []
  const reissuedIds: number[] = []

  for (const item of expired) {
    const id = toNotificationId(item.id)
    try {
      await svc.cancel(id)
    } catch (err) {
      console.warn('[scheduler] purge cancel failed', id, err)
      continue
    }
    cancelledIds.push(id)

    try {
      await deleteScheduledById(id)
    } catch (err) {
      console.warn('[scheduler] purge Dexie delete failed', id, err)
    }

    if (!reissue) continue
    if (isDebugPending(item)) continue

    // OS-only catch-up id space (avoids Dexie autoincrement clash).
    const missId = toNotificationId(600_000_000 + (id % 100_000_000))
    const triggerAt = new Date(nowMs + 1500)
    try {
      await svc.schedule({
        id: missId,
        title: item.title || '错过的提醒',
        body: prefixMissed(item.body),
        triggerAt,
      })
      reissuedIds.push(missId)
    } catch (err) {
      console.warn('[scheduler] purge reissue failed', id, err)
    }
  }

  return { cancelledIds, reissuedIds }
}

function isDebugPending(item: PendingNotification): boolean {
  const t = `${item.title}\n${item.body}`.toLowerCase()
  return t.includes('调试') || /\d+\s*秒后提醒/.test(item.title)
}

function prefixMissed(body: string): string {
  const b = (body || '').trim()
  if (b.startsWith('错过')) return b
  return b ? `错过的提醒 · ${b}` : '错过的提醒'
}

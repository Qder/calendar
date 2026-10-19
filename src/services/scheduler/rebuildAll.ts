import { rebuildAllScheduled } from './rebuildForEvent'

/** Start / foreground: idempotent refill of the WINDOW_DAYS schedule window. */
export async function rebuildAll(): Promise<void> {
  await rebuildAllScheduled()
}

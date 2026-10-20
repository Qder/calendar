import { db } from '@/db'
import { rebuildAll } from '@/services/scheduler/rebuildAll'
import {
  BackupPayloadSchema,
  type BackupImportMode,
  type BackupPayload,
} from './backupSchema'

export function parseBackupJson(text: string): BackupPayload {
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    throw new Error('备份文件不是合法 JSON')
  }
  const parsed = BackupPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || '根'}: ${i.message}`)
      .join('；')
    throw new Error(`备份校验失败：${msg}`)
  }
  return parsed.data
}

/**
 * Import backup into Dexie then rebuildAll OS schedules.
 * - overwrite: clear events/rules/courses/periods/semester/settings/foods then put
 * - merge: upsert by primary key (settings by key; semester always put if present)
 * Scheduled notifications are always cleared and rebuilt (not stored in backup).
 */
export async function importBackupPayload(
  payload: BackupPayload,
  mode: BackupImportMode,
): Promise<{ events: number; rules: number; courses: number; foods: number }> {
  const data = BackupPayloadSchema.parse(payload)

  await db.transaction(
    'rw',
    [
      db.events,
      db.reminder_rules,
      db.scheduled_notifications,
      db.settings,
      db.courses,
      db.periods,
      db.semester,
      db.foods,
    ],
    async () => {
      await db.scheduled_notifications.clear()

      if (mode === 'overwrite') {
        await db.events.clear()
        await db.reminder_rules.clear()
        await db.courses.clear()
        await db.periods.clear()
        await db.semester.clear()
        await db.settings.clear()
        await db.foods.clear()
      }

      if (data.events.length) await db.events.bulkPut(data.events)
      if (data.reminderRules.length) {
        await db.reminder_rules.bulkPut(data.reminderRules)
      }
      if (data.settings.length) await db.settings.bulkPut(data.settings)
      if (data.courses.length) await db.courses.bulkPut(data.courses)
      if (data.periods.length) await db.periods.bulkPut(data.periods)
      if (data.semester) await db.semester.put(data.semester)
      if (data.foods.length) await db.foods.bulkPut(data.foods)
    },
  )

  await rebuildAll()

  return {
    events: data.events.length,
    rules: data.reminderRules.length,
    courses: data.courses.length,
    foods: data.foods.length,
  }
}

export async function importBackupJsonText(
  text: string,
  mode: BackupImportMode,
): Promise<{ events: number; rules: number; courses: number; foods: number }> {
  return importBackupPayload(parseBackupJson(text), mode)
}

import { db } from '@/db'
import { BACKUP_VERSION, type BackupPayload } from './backupSchema'

/** Snapshot Dexie tables into a versioned backup payload (no scheduled rows). */
export async function buildBackupPayload(): Promise<BackupPayload> {
  const [events, reminderRules, settings, courses, periods, semester, foods] =
    await Promise.all([
      db.events.toArray(),
      db.reminder_rules.toArray(),
      db.settings.toArray(),
      db.courses.toArray(),
      db.periods.toArray(),
      db.semester.get('current'),
      db.foods.toArray(),
    ])

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    events,
    reminderRules,
    settings,
    courses,
    periods,
    semester: semester ?? null,
    foods,
  }
}

export function backupToJsonString(payload: BackupPayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`
}

/** Trigger a browser download of the JSON backup. */
export async function downloadBackupJson(
  filename = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`,
): Promise<BackupPayload> {
  const payload = await buildBackupPayload()
  const blob = new Blob([backupToJsonString(payload)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return payload
}

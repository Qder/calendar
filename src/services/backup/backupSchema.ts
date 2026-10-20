import { z } from 'zod'
import {
  CourseRowSchema,
  EventSchema,
  FoodRowSchema,
  PeriodSchema,
  ReminderRuleSchema,
  SemesterSchema,
  SettingsSchema,
} from '@/domain/schemas'

/** Backup file format version (bump when payload shape breaks). */
export const BACKUP_VERSION = 1 as const

export const BackupPayloadSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string().min(1),
  events: z.array(EventSchema),
  reminderRules: z.array(ReminderRuleSchema),
  settings: z.array(SettingsSchema),
  courses: z.array(CourseRowSchema),
  periods: z.array(PeriodSchema),
  semester: SemesterSchema.nullable(),
  /** N-food-pick; absent in older backups → []. */
  foods: z.array(FoodRowSchema).default([]),
})

export type BackupPayload = z.infer<typeof BackupPayloadSchema>

export type BackupImportMode = 'overwrite' | 'merge'

import { z } from 'zod'

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
const hm = z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm')

export const RecurrenceSchema = z.enum(['none', 'weekly', 'monthly', 'yearly'])
export type RecurrenceFreq = z.infer<typeof RecurrenceSchema>

export const EventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  /** Series start date (YYYY-MM-DD). For recurrence, occurrences expand from this day. */
  date: ymd,
  /** Optional local time HH:mm; all-day when omitted/null. */
  time: hm.nullable().optional(),
  note: z.string().max(2000).optional().default(''),
  recurrence: RecurrenceSchema.default('none'),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
})

export type CalendarEvent = z.infer<typeof EventSchema>

export const ReminderRuleInputSchema = z.object({
  daysBefore: z.number().int().min(0).max(365),
  time: hm,
})

export const ReminderRuleSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  /** Days before the occurrence date (0 = same day). */
  daysBefore: z.number().int().min(0).max(365),
  /** Local HH:mm. */
  time: hm,
})

export type ReminderRule = z.infer<typeof ReminderRuleSchema>

export const ScheduledNotificationSchema = z.object({
  /** Auto-increment primary key; also used as OS notification id (32-bit). */
  id: z.number().int(),
  eventId: z.string().min(1),
  ruleId: z.string().min(1),
  /** Occurrence date (YYYY-MM-DD) this notification belongs to. */
  occurrenceDate: ymd,
  triggerAt: z.number().int(),
})

export type ScheduledNotification = z.infer<typeof ScheduledNotificationSchema>

export const SettingsSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export type SettingsRow = z.infer<typeof SettingsSchema>

export const DEFAULT_REMIND_TIME_KEY = 'defaultRemindTime'
export const DEFAULT_REMIND_TIME = '09:00'

export const DEVELOPER_MODE_KEY = 'developerMode'
/** Default off — debug routes/UI stay hidden until enabled in settings. */
export const DEVELOPER_MODE_DEFAULT = false

export const EventInputSchema = z.object({
  title: z.string().min(1).max(200),
  date: ymd,
  time: hm.nullable().optional(),
  note: z.string().max(2000).optional().default(''),
  recurrence: RecurrenceSchema.default('none'),
  /**
   * Multiple reminders for stage 3.
   * - `undefined`: use one default rule (daysBefore=1 + settings default time)
   * - `[]` / empty after filter: no reminders
   */
  reminders: z.array(ReminderRuleInputSchema).max(20).optional(),
})

export type EventInput = z.infer<typeof EventInputSchema>

// —— Stage 4: semester / periods / courses ——

export const WeekdaySchema = z.number().int().min(1).max(7)
export type SchemaWeekday = z.infer<typeof WeekdaySchema>

export const SemesterSchema = z.object({
  /** Singleton id. */
  id: z.literal('current'),
  startMonday: ymd,
  totalWeeks: z.number().int().min(1).max(60),
  updatedAt: z.number().int(),
})
export type SemesterRow = z.infer<typeof SemesterSchema>

export const PeriodSchema = z
  .object({
    index: z.number().int().min(1).max(24),
    start: hm,
    end: hm,
    label: z.string().max(40).optional(),
  })
  .refine((r) => r.start < r.end, {
    message: '开始时刻须早于结束时刻',
    path: ['end'],
  })
export type PeriodRow = z.infer<typeof PeriodSchema>

/** Template / import column headers (fixed order). */
export const COURSE_TEMPLATE_HEADERS = [
  '课程名',
  '星期',
  '开始节',
  '结束节',
  '周次',
  '教室',
  '教师',
] as const

export const CourseRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  /** 1=Mon … 7=Sun */
  weekday: WeekdaySchema,
  startPeriod: z.number().int().min(1).max(24),
  endPeriod: z.number().int().min(1).max(24),
  /** Expanded week indices. */
  weeks: z.array(z.number().int().min(1)).min(1),
  /** Original weeks cell text. */
  weeksRaw: z.string().max(200),
  room: z.string().max(100).optional().default(''),
  teacher: z.string().max(100).optional().default(''),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
})
export type CourseRow = z.infer<typeof CourseRowSchema>

/** One raw import line before persistence (weeks still string). */
export const CourseImportDraftSchema = z
  .object({
    name: z.string().min(1, '课程名不能为空').max(200),
    weekday: WeekdaySchema,
    startPeriod: z.number().int().min(1).max(24),
    endPeriod: z.number().int().min(1).max(24),
    weeksRaw: z.string().min(1, '周次不能为空').max(200),
    room: z.string().max(100).optional().default(''),
    teacher: z.string().max(100).optional().default(''),
  })
  .refine((r) => r.endPeriod >= r.startPeriod, {
    message: '结束节须 ≥ 开始节',
    path: ['endPeriod'],
  })
export type CourseImportDraft = z.infer<typeof CourseImportDraftSchema>

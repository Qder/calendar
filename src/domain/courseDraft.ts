import { parseWeeks } from '@/domain/parseWeeks'
import {
  CourseImportDraftSchema,
  type CourseImportDraft,
  type CourseRow,
} from '@/domain/schemas'

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export type CourseDraftInput = {
  name: string
  weekday: number
  startPeriod: number
  endPeriod: number
  weeksRaw: string
  room?: string
  teacher?: string
}

/**
 * Validate draft (zod + parseWeeks + 节次表) and build an IDB-safe CourseRow POJO.
 */
export function buildCourseRow(
  input: CourseDraftInput,
  opts: {
    totalWeeks: number
    periodIndices: Iterable<number>
    id?: string
    createdAt?: number
    now?: number
  },
): CourseRow {
  const draft: CourseImportDraft = CourseImportDraftSchema.parse({
    name: String(input.name ?? '')
      .normalize('NFKC')
      .trim(),
    weekday: Number(input.weekday),
    startPeriod: Number(input.startPeriod),
    endPeriod: Number(input.endPeriod),
    weeksRaw: String(input.weeksRaw ?? '')
      .normalize('NFKC')
      .trim(),
    room: String(input.room ?? '')
      .normalize('NFKC')
      .trim(),
    teacher: String(input.teacher ?? '')
      .normalize('NFKC')
      .trim(),
  })

  const indices =
    opts.periodIndices instanceof Set
      ? opts.periodIndices
      : new Set(opts.periodIndices)
  if (!indices.has(draft.startPeriod)) {
    throw new RangeError(`开始节 ${draft.startPeriod} 不在当前节次表内`)
  }
  if (!indices.has(draft.endPeriod)) {
    throw new RangeError(`结束节 ${draft.endPeriod} 不在当前节次表内`)
  }

  const weeks = parseWeeks(draft.weeksRaw, opts.totalWeeks)
  const now = opts.now ?? Date.now()
  const createdAt = opts.createdAt ?? now

  return {
    id: opts.id ?? newId(),
    name: draft.name,
    weekday: draft.weekday,
    startPeriod: draft.startPeriod,
    endPeriod: draft.endPeriod,
    weeks: Array.from(weeks),
    weeksRaw: draft.weeksRaw,
    room: draft.room ?? '',
    teacher: draft.teacher ?? '',
    createdAt: Number(createdAt),
    updatedAt: Number(now),
  }
}

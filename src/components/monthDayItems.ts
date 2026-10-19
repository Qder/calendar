/**
 * 月视图「当天」时间线条目：只读组装，不写库。
 */
import { courseColorForName } from '@/components/courseColors'
import type { EventOccurrence } from '@/stores/events'
import type { CourseRow, PeriodRow } from '@/domain/schemas'

export type MonthDayItemKind = 'event' | 'course'

export interface MonthDayItem {
  key: string
  kind: MonthDayItemKind
  title: string
  subtitle: string
  /** HH:mm 排序键；全天用空串排最前 */
  sortKey: string
  /** 指示点/胶囊色：课程走 courseColors；事项用 CSS 变量名（由视图解析） */
  color: string
  colorIsCssVar: boolean
  routeName: 'event-edit' | 'course-edit'
  routeId: string
}

export function eventToDayItem(occ: EventOccurrence): MonthDayItem {
  const time = occ.event.time ?? ''
  const subtitle = time
    ? time
    : occ.event.recurrence && occ.event.recurrence !== 'none'
      ? '全天 · 重复'
      : '全天'
  return {
    key: `e-${occ.event.id}-${occ.occurrenceDate}`,
    kind: 'event',
    title: occ.event.title,
    subtitle:
      time && occ.event.recurrence && occ.event.recurrence !== 'none'
        ? `${time} · 重复`
        : subtitle,
    sortKey: time || '00:00',
    color: '--v-theme-primary',
    colorIsCssVar: true,
    routeName: 'event-edit',
    routeId: occ.event.id,
  }
}

export function courseToDayItem(
  course: CourseRow,
  periods: PeriodRow[],
): MonthDayItem {
  const start = periods.find((p) => p.index === course.startPeriod)
  const end = periods.find((p) => p.index === course.endPeriod)
  const timeLabel =
    start && end
      ? `${start.start}-${end.end}`
      : `${course.startPeriod}-${course.endPeriod}节`
  const room = course.room ? ` · @${course.room}` : ''
  return {
    key: `c-${course.id}`,
    kind: 'course',
    title: course.name,
    subtitle: `${timeLabel}${room}`,
    sortKey: start?.start ?? `p${String(course.startPeriod).padStart(2, '0')}`,
    color: courseColorForName(course.name),
    colorIsCssVar: false,
    routeName: 'course-edit',
    routeId: course.id,
  }
}

export function sortDayItems(items: MonthDayItem[]): MonthDayItem[] {
  return items.slice().sort((a, b) => {
    const t = a.sortKey.localeCompare(b.sortKey)
    if (t !== 0) return t
    return a.title.localeCompare(b.title, 'zh')
  })
}

/** 格内胶囊/圆点：最多 take 条，其余用 +N */
export function takeWithOverflow<T>(
  items: T[],
  take: number,
): { shown: T[]; overflow: number } {
  if (items.length <= take) return { shown: items, overflow: 0 }
  return { shown: items.slice(0, take), overflow: items.length - take }
}

/**
 * 事项列表分组（今天 / 明天 / 本周 / 之后）——纯 UI 派生，不改 domain。
 */
import { addDaysYmd, parseYmd, todayYmd, weekdayMon0 } from '@/domain/date'
import { expandOccurrences, type RecurrenceFreq } from '@/domain/recurrence'
import type { CalendarEvent, ReminderRule } from '@/domain/schemas'

export type EventListGroupKey = 'today' | 'tomorrow' | 'week' | 'later'

export interface EventListRow {
  key: string
  eventId: string
  title: string
  occurrenceDate: string
  dateLabel: string
  timeLabel: string
  reminderSummary: string
}

export interface EventListGroup {
  key: EventListGroupKey
  label: string
  items: EventListRow[]
}

const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'] as const

const GROUP_ORDER: { key: EventListGroupKey; label: string }[] = [
  { key: 'today', label: '今天' },
  { key: 'tomorrow', label: '明天' },
  { key: 'week', label: '本周' },
  { key: 'later', label: '之后' },
]

/** 向前展开窗口（天），覆盖「之后」分组。 */
export const EVENT_LIST_HORIZON_DAYS = 120

export function formatOccurrenceDateLabel(ymd: string): string {
  const d = parseYmd(ymd)
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAY_CN[d.getDay()]}`
}

export function formatEventTimeLabel(time: string | null | undefined): string {
  if (!time) return '全天'
  return time
}

export function formatReminderSummary(rules: ReminderRule[]): string {
  if (!rules.length) return '无提醒'
  const sorted = [...rules].sort(
    (a, b) => a.daysBefore - b.daysBefore || a.time.localeCompare(b.time),
  )
  return sorted
    .map((r) =>
      r.daysBefore === 0 ? `当天 ${r.time}` : `提前${r.daysBefore}天 ${r.time}`,
    )
    .join(' · ')
}

/** 本周周日（周一为一周起点）。 */
export function endOfWeekSundayYmd(today: string): string {
  const mon0 = weekdayMon0(today)
  return addDaysYmd(today, 6 - mon0)
}

export function classifyOccurrence(
  occurrenceDate: string,
  today: string,
): EventListGroupKey | null {
  if (occurrenceDate < today) return null
  const tomorrow = addDaysYmd(today, 1)
  if (occurrenceDate === today) return 'today'
  if (occurrenceDate === tomorrow) return 'tomorrow'
  const weekEnd = endOfWeekSundayYmd(today)
  if (occurrenceDate <= weekEnd) return 'week'
  return 'later'
}

/**
 * 将事件展开为分组列表。仅含 today 起 horizon 内的 occurrence。
 */
export function buildEventListGroups(
  events: CalendarEvent[],
  rulesByEventId: Map<string, ReminderRule[]>,
  now: Date = new Date(),
  horizonDays: number = EVENT_LIST_HORIZON_DAYS,
): EventListGroup[] {
  const today = todayYmd(now)
  const to = addDaysYmd(today, horizonDays)
  const buckets: Record<EventListGroupKey, EventListRow[]> = {
    today: [],
    tomorrow: [],
    week: [],
    later: [],
  }

  for (const event of events) {
    const freq = (event.recurrence ?? 'none') as RecurrenceFreq
    const dates = expandOccurrences(event.date, freq, today, to)
    const rules = rulesByEventId.get(event.id) ?? []
    const reminderSummary = formatReminderSummary(rules)
    const timeLabel = formatEventTimeLabel(event.time)

    for (const occurrenceDate of dates) {
      const group = classifyOccurrence(occurrenceDate, today)
      if (!group) continue
      buckets[group].push({
        key: `${event.id}:${occurrenceDate}`,
        eventId: event.id,
        title: event.title,
        occurrenceDate,
        dateLabel: formatOccurrenceDateLabel(occurrenceDate),
        timeLabel,
        reminderSummary,
      })
    }
  }

  for (const g of GROUP_ORDER) {
    buckets[g.key].sort((a, b) => {
      if (a.occurrenceDate !== b.occurrenceDate) {
        return a.occurrenceDate.localeCompare(b.occurrenceDate)
      }
      if (a.timeLabel !== b.timeLabel) {
        // 全天靠前
        if (a.timeLabel === '全天') return -1
        if (b.timeLabel === '全天') return 1
        return a.timeLabel.localeCompare(b.timeLabel)
      }
      return a.title.localeCompare(b.title, 'zh')
    })
  }

  return GROUP_ORDER.map((g) => ({
    key: g.key,
    label: g.label,
    items: buckets[g.key],
  }))
}

export function countGroupedItems(groups: EventListGroup[]): number {
  return groups.reduce((n, g) => n + g.items.length, 0)
}

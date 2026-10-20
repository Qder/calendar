import { parseHm } from './date'
import { computeTriggerAt } from './reminders'

export interface SystemAlarmRuleInput {
  daysBefore: number
  time: string
}

export interface SystemAlarmTarget {
  /** AlarmClock.EXTRA_HOUR */
  hour: number
  /** AlarmClock.EXTRA_MINUTES */
  minutes: number
  /** AlarmClock.EXTRA_MESSAGE */
  message: string
  daysBefore: number
  /** Local trigger used for selection; SET_ALARM Intent itself has no date. */
  triggerAt: Date | null
}

function offsetLabel(daysBefore: number): string {
  if (daysBefore === 0) return '当天'
  return `前${daysBefore}天`
}

/**
 * N-sys-alarm MVP：多条提醒规则只开 **一条** 系统闹钟。
 * 优先选「最近一次未来触发」；若全部已过期，退回 daysBefore 最小的那条（仍带提醒时刻）。
 * 时刻取自规则的 time（编辑页共用「提醒时刻」）；全天事项同样走该字段。
 */
export function pickSystemAlarmTarget(args: {
  title: string
  eventDate: string
  rules: SystemAlarmRuleInput[]
  now?: Date
}): SystemAlarmTarget | null {
  const rules = args.rules.filter(
    (r) => Number.isInteger(r.daysBefore) && r.daysBefore >= 0,
  )
  if (rules.length === 0) return null

  const now = args.now ?? new Date()
  const title = args.title.trim() || '日历提醒'

  type Cand = {
    rule: SystemAlarmRuleInput
    triggerAt: Date | null
  }
  const cands: Cand[] = rules.map((rule) => ({
    rule,
    triggerAt: computeTriggerAt(
      args.eventDate,
      rule.daysBefore,
      rule.time,
      now,
    ),
  }))

  const future = cands
    .filter((c): c is Cand & { triggerAt: Date } => c.triggerAt != null)
    .sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime())

  const chosen =
    future[0] ??
    [...cands].sort((a, b) => a.rule.daysBefore - b.rule.daysBefore)[0]!

  const { hours, minutes } = parseHm(chosen.rule.time)
  return {
    hour: hours,
    minutes,
    message: `${title}（${offsetLabel(chosen.rule.daysBefore)}）`,
    daysBefore: chosen.rule.daysBefore,
    triggerAt: chosen.triggerAt,
  }
}

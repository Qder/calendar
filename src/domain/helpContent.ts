/**
 * In-app help sections for N-help (static; searchable locally).
 */

export interface HelpSection {
  id: string
  title: string
  keywords: string[]
  body: string
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'month-week',
    title: '月视图与周视图',
    keywords: ['月历', '课表', '周视图', '时间轴', '今天', '导航'],
    body: [
      '底部或侧栏可在「月」「周」之间切换。',
      '月视图：点某一天查看当日事项与课程；有课/有事项的日期会有标记。手机上当日详情在下方面板，桌面多为左右分栏。',
      '周视图：按学期周次展示课表格子；连堂课会跨多节合并。顶栏可切换上一周/下一周，并显示「第 N 周」与日期范围。',
      '点「今天」可回到当前日期/本周。',
    ].join('\n'),
  },
  {
    id: 'events',
    title: '创建与编辑事项',
    keywords: ['事件', '待办', '提醒', '重复', '系列', '全天'],
    body: [
      '在月视图或首页用「+」新建事项；点已有事项进入编辑。',
      '可设标题、日期、是否全天、备注，以及重复（无/每周/每月/每年）。',
      '重复事项编辑时可改「整系列」；删除也可选删整系列。',
      '提醒可多条：当天、前 1/3/7 天或自定义天数 + 时刻。保存后应用会按窗口重建本地通知。',
    ].join('\n'),
  },
  {
    id: 'reminder-kind',
    title: '提醒方式（强提醒 / 仅弹窗）',
    keywords: ['闹钟', 'banner', 'alarm', '渠道', '打断', '重要性', 'reminderKind'],
    body: [
      '编辑事项时，在提醒区选择「提醒方式」：',
      '· 闹钟式强提醒：走高重要性通知渠道（calendar-alarm），需通知与精确闹钟等权限，更易在锁屏/勿扰下引起注意。',
      '· 仅弹窗通知：走普通渠道（calendar-banner），默认同横幅提示，打断较弱。',
      '新建默认「仅弹窗」；旧事项未选过的按仅弹窗处理。',
      '「当天 / 前 N 天」规则不变，只是通知渠道强度不同。不会打开系统时钟 App。',
    ].join('\n'),
  },
  {
    id: 'course-import',
    title: '课表导入与手改',
    keywords: ['教务', 'Excel', 'HTML', 'xls', '导入', '学期', '节次', '课程'],
    body: [
      '设置里可配置学期开始周一、总周数与节次时段。',
      '「导入课表」支持教务 HTML / .xls 网格，以及模板 Excel；导入后出现在周视图。',
      '也可在周视图手动添加/编辑单门课（星期、节次、周次、教室等）。',
      '导入前建议先设好学期与节次，避免周次或上课时间对不齐。',
    ].join('\n'),
  },
  {
    id: 'backup',
    title: '备份与导出',
    keywords: ['JSON', 'ICS', '导出', '导入', '迁移', '备份'],
    body: [
      '设置 → 数据：可导出 JSON 备份（事件、提醒规则、设置、课表与学期）。',
      '「导入备份」进入备份页，选择 JSON 后导入并重建通知窗口。',
      'ICS 仅导出事件与提醒（VALARM），不含课表；适合拷到其他日历软件。',
    ].join('\n'),
  },
  {
    id: 'permissions',
    title: '通知权限与收不到提醒',
    keywords: ['权限', 'OEM', '精确闹钟', '自启动', '电池', '勿扰', '国产'],
    body: [
      '设置 → 提醒：可查看并请求通知权限。',
      'Android 上准时提醒还常需「精确闹钟」；国产机还需自启动、后台耗电白名单等。',
      '点「尝试打开系统设置」或「查看引导摘要」按机型排查。',
      '强提醒依赖高重要性渠道；若系统把该渠道静音，体感会变弱，可在系统通知设置里分别调整两个渠道。',
    ].join('\n'),
  },
]

/** Case-insensitive substring filter over title, keywords, and body. */
export function filterHelpSections(
  query: string,
  sections: readonly HelpSection[] = HELP_SECTIONS,
): HelpSection[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...sections]
  return sections.filter((s) => {
    const hay = [s.title, s.body, ...s.keywords].join('\n').toLowerCase()
    return hay.includes(q)
  })
}

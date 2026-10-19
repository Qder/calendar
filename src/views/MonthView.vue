<template>
  <div
    class="month-page"
    :class="{ 'month-page--desktop': isDesktop }"
  >
    <section class="month-main">
      <!-- 页头：大号年月 + 翻月 + 今天 -->
      <header class="month-header">
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          size="large"
          class="month-header__nav"
          aria-label="上一月"
          @click="shiftMonth(-1)"
        />

        <v-menu
          v-model="pickerOpen"
          :close-on-content-click="false"
          location="bottom"
        >
          <template #activator="{ props: menuProps }">
            <button
              v-bind="menuProps"
              type="button"
              class="month-header__title"
              aria-label="选择年月"
            >
              <span class="month-header__ym tabular-nums">
                {{ year }} 年 {{ month }} 月
              </span>
              <v-icon
                icon="mdi-menu-down"
                size="small"
                class="ms-1"
              />
            </button>
          </template>
          <v-card
            min-width="260"
            class="pa-3"
          >
            <div class="d-flex ga-2 mb-2">
              <v-select
                v-model="pickerYear"
                :items="yearOptions"
                label="年"
                density="compact"
                hide-details
                aria-label="选择年份"
              />
              <v-select
                v-model="pickerMonth"
                :items="monthOptions"
                label="月"
                density="compact"
                hide-details
                aria-label="选择月份"
              />
            </div>
            <v-btn
              block
              color="primary"
              variant="flat"
              @click="applyPicker"
            >
              确定
            </v-btn>
          </v-card>
        </v-menu>

        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          size="large"
          class="month-header__nav"
          aria-label="下一月"
          @click="shiftMonth(1)"
        />

        <v-btn
          class="month-header__today"
          variant="tonal"
          color="primary"
          aria-label="回到今天"
          @click="goToday"
        >
          今天
        </v-btn>
      </header>

      <v-skeleton-loader
        v-if="bootLoading"
        type="ossein, article"
        class="mb-4"
      />

      <v-alert
        v-else-if="loadError"
        type="error"
        variant="tonal"
        class="mb-4"
        :text="loadError"
      >
        <template #append>
          <v-btn
            variant="text"
            size="small"
            aria-label="重试加载月数据"
            @click="reloadAll"
          >
            重试
          </v-btn>
        </template>
      </v-alert>

      <template v-else>
        <!-- 星期表头 -->
        <div
          class="weekday-row"
          role="row"
        >
          <div
            v-for="(w, i) in weekLabels"
            :key="w"
            class="weekday-cell"
            :class="{ 'weekday-cell--weekend': i >= 5 }"
            role="columnheader"
          >
            {{ w }}
          </div>
        </div>

        <!-- 日期格 -->
        <div
          class="month-grid"
          :class="{ 'month-grid--desktop': isDesktop }"
          role="grid"
          aria-label="月历"
        >
          <button
            v-for="cell in cells"
            :key="cell.key"
            type="button"
            class="day-cell"
            :class="{
              'day-cell--muted': !cell.inMonth,
              'day-cell--selected': cell.ymd === selectedDate && cell.ymd !== today,
              'day-cell--today': cell.ymd === today,
            }"
            :aria-label="cellAriaLabel(cell)"
            :aria-pressed="cell.ymd === selectedDate"
            @click="selectedDate = cell.ymd"
          >
            <span
              class="day-num"
              :class="{
                'day-num--today': cell.ymd === today,
                'day-num--selected': cell.ymd === selectedDate && cell.ymd !== today,
              }"
            >
              {{ cell.day }}
            </span>

            <!-- 桌面：最多 2 条标题胶囊 +N -->
            <div
              v-if="isDesktop"
              class="day-capsules"
            >
              <span
                v-for="item in cellPreview(cell.ymd).shown"
                :key="item.key"
                class="day-capsule"
                :style="capsuleStyle(item)"
              >
                {{ item.title }}
              </span>
              <span
                v-if="cellPreview(cell.ymd).overflow > 0"
                class="day-capsule-more"
              >
                +{{ cellPreview(cell.ymd).overflow }}
              </span>
            </div>

            <!-- 手机：最多 3 个彩色小点 -->
            <div
              v-else
              class="day-dots"
              aria-hidden="true"
            >
              <span
                v-for="item in cellPreview(cell.ymd).shown"
                :key="item.key"
                class="day-dot"
                :style="dotStyle(item)"
              />
            </div>
          </button>
        </div>
      </template>
    </section>

    <!-- 当天面板：手机在下，桌面在右 -->
    <aside class="month-aside">
      <DayTimelinePanel
        :title="dayPanelTitle"
        :date-ymd="selectedDate"
        :items="selectedDayItems"
        :loading="monthLoading"
        :error="loadError"
        @retry="reloadAll"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import DayTimelinePanel from '@/components/DayTimelinePanel.vue'
import {
  courseToDayItem,
  eventToDayItem,
  sortDayItems,
  takeWithOverflow,
  type MonthDayItem,
} from '@/components/monthDayItems'
import {
  addMonthsYmd,
  endOfMonthYmd,
  formatYmd,
  startOfMonthYmd,
  todayYmd,
  weekdayMon0,
} from '@/domain/date'
import {
  dateToWeekIndex,
  weekdayOfYmd,
  type SemesterConfig,
} from '@/domain/semester'
import {
  useEventsStore,
  type EventOccurrence,
} from '@/stores/events'
import { useCoursesStore } from '@/stores/courses'
import { useSemesterStore } from '@/stores/semester'

const weekLabels = ['一', '二', '三', '四', '五', '六', '日']
const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const display = useDisplay()
/** 沿用壳断点：≥960 桌面左右分栏 */
const isDesktop = computed(() => display.mdAndUp.value)

const eventsStore = useEventsStore()
const coursesStore = useCoursesStore()
const semesterStore = useSemesterStore()

const today = todayYmd()
const cursor = ref(startOfMonthYmd(today))
const selectedDate = ref(today)
const monthOccurrences = ref<EventOccurrence[]>([])
const bootLoading = ref(true)
const monthLoading = ref(false)
const loadError = ref<string | null>(null)

const pickerOpen = ref(false)
const pickerYear = ref(Number(today.slice(0, 4)))
const pickerMonth = ref(Number(today.slice(5, 7)))

const year = computed(() => Number(cursor.value.slice(0, 4)))
const month = computed(() => Number(cursor.value.slice(5, 7)))

const yearOptions = computed(() => {
  const y = year.value
  const out: number[] = []
  for (let i = y - 5; i <= y + 5; i++) out.push(i)
  return out
})
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  title: `${i + 1} 月`,
  value: i + 1,
}))

const semesterConfig = computed((): SemesterConfig | null => {
  const s = semesterStore.semester
  if (!s?.startMonday || !s.totalWeeks) return null
  return { startMonday: s.startMonday, totalWeeks: s.totalWeeks }
})

interface Cell {
  key: string
  ymd: string
  day: number
  inMonth: boolean
}

const cells = computed((): Cell[] => {
  const start = startOfMonthYmd(cursor.value)
  const end = endOfMonthYmd(cursor.value)
  const lead = weekdayMon0(start)
  const startDate = new Date(
    Number(start.slice(0, 4)),
    Number(start.slice(5, 7)) - 1,
    Number(start.slice(8, 10)),
  )
  startDate.setDate(startDate.getDate() - lead)

  const out: Cell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const ymd = formatYmd(d)
    out.push({
      key: ymd,
      ymd,
      day: d.getDate(),
      inMonth: ymd >= start && ymd <= end,
    })
  }
  return out
})

/** 按日汇总的只读条目（事项 + 课程） */
const itemsByDate = computed((): Record<string, MonthDayItem[]> => {
  const map: Record<string, MonthDayItem[]> = {}
  const periods = semesterStore.periods
  const cfg = semesterConfig.value

  for (const occ of monthOccurrences.value) {
    const item = eventToDayItem(occ)
    ;(map[occ.occurrenceDate] ??= []).push(item)
  }

  if (cfg) {
    const start = cells.value[0]?.ymd
    const end = cells.value[cells.value.length - 1]?.ymd
    if (start && end) {
      // 遍历网格日期，挂上当日课程
      for (const cell of cells.value) {
        const wi = dateToWeekIndex(cfg, cell.ymd)
        const wd = weekdayOfYmd(cell.ymd)
        const courses = coursesStore.meetingOn(wi, wd)
        for (const c of courses) {
          ;(map[cell.ymd] ??= []).push(courseToDayItem(c, periods))
        }
      }
    }
  }

  for (const ymd of Object.keys(map)) {
    map[ymd] = sortDayItems(map[ymd]!)
  }
  return map
})

function cellPreview(ymd: string): { shown: MonthDayItem[]; overflow: number } {
  const items = itemsByDate.value[ymd] ?? []
  const take = isDesktop.value ? 2 : 3
  return takeWithOverflow(items, take)
}

function capsuleStyle(item: MonthDayItem): Record<string, string> {
  if (item.colorIsCssVar) {
    return {
      backgroundColor: 'rgb(var(--v-theme-primary-container))',
      color: 'rgb(var(--v-theme-on-primary-container))',
      borderInlineStart: '3px solid rgb(var(--v-theme-primary))',
    }
  }
  // 课程色仅作左侧色条（来自 courseColors）；底与字走主题变量
  return {
    backgroundColor: 'rgb(var(--v-theme-surface-variant))',
    color: 'rgb(var(--v-theme-on-surface))',
    borderInlineStart: `3px solid ${item.color}`,
  }
}

function dotStyle(item: MonthDayItem): Record<string, string> {
  const color = item.colorIsCssVar
    ? `rgb(var(${item.color}))`
    : item.color
  return { backgroundColor: color }
}

const selectedDayItems = computed(
  () => itemsByDate.value[selectedDate.value] ?? [],
)

const dayPanelTitle = computed(() => {
  const ymd = selectedDate.value
  const m = Number(ymd.slice(5, 7))
  const d = Number(ymd.slice(8, 10))
  const wd = weekdayNames[weekdayMon0(ymd)] ?? ''
  const cfg = semesterConfig.value
  const wi = cfg ? dateToWeekIndex(cfg, ymd) : null
  const weekPart = wi != null ? ` · 第 ${wi} 周` : ''
  return `${m} 月 ${d} 日 ${wd}${weekPart}`
})

function cellAriaLabel(cell: Cell): string {
  const n = (itemsByDate.value[cell.ymd] ?? []).length
  const base = `${cell.ymd}${cell.inMonth ? '' : '（非本月）'}`
  if (cell.ymd === today) return `${base}，今天，${n} 条`
  if (cell.ymd === selectedDate.value) return `${base}，已选中，${n} 条`
  return `${base}，${n} 条`
}

async function loadMonth(): Promise<void> {
  monthLoading.value = true
  loadError.value = null
  try {
    monthOccurrences.value = await eventsStore.occurrencesInMonth(cursor.value)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载月数据失败'
  } finally {
    monthLoading.value = false
  }
}

async function reloadAll(): Promise<void> {
  loadError.value = null
  try {
    await semesterStore.load()
    await coursesStore.refresh()
    await loadMonth()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败'
  }
}

function shiftMonth(delta: number): void {
  cursor.value = startOfMonthYmd(addMonthsYmd(cursor.value, delta))
  const start = startOfMonthYmd(cursor.value)
  const end = endOfMonthYmd(cursor.value)
  if (selectedDate.value < start || selectedDate.value > end) {
    selectedDate.value = start
  }
}

function goToday(): void {
  cursor.value = startOfMonthYmd(today)
  selectedDate.value = today
}

function applyPicker(): void {
  const mm = String(pickerMonth.value).padStart(2, '0')
  const ymd = `${pickerYear.value}-${mm}-01`
  cursor.value = startOfMonthYmd(ymd)
  const start = startOfMonthYmd(cursor.value)
  const end = endOfMonthYmd(cursor.value)
  if (selectedDate.value < start || selectedDate.value > end) {
    selectedDate.value = start
  }
  pickerOpen.value = false
}

watch(cursor, () => {
  void loadMonth()
})

watch(pickerOpen, (open) => {
  if (open) {
    pickerYear.value = year.value
    pickerMonth.value = month.value
  }
})

onMounted(async () => {
  bootLoading.value = true
  try {
    await semesterStore.load()
    await coursesStore.refresh()
    await loadMonth()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '初始化失败'
  } finally {
    bootLoading.value = false
  }
})
</script>

<style scoped>
.month-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-width: 720px;
  margin-inline: auto;
  box-sizing: border-box;
}

.month-page--desktop {
  max-width: 1200px;
  flex-direction: row;
  align-items: flex-start;
  gap: 20px;
}

.month-main {
  flex: 1 1 auto;
  min-width: 0;
}

.month-page--desktop .month-aside {
  flex: 0 0 340px;
  width: 340px;
  position: sticky;
  top: 72px;
  max-height: calc(100vh - 96px);
  overflow: auto;
}

.month-header {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2px;
  margin-bottom: 12px;
}

.month-header__nav {
  min-width: 44px !important;
  min-height: 44px !important;
}

.month-header__title {
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-control);
  background: transparent;
  color: rgb(var(--v-theme-on-background));
  cursor: pointer;
  font: inherit;
}

.month-header__title:hover {
  background: rgb(var(--v-theme-primary-container));
}

.month-header__ym {
  font-size: clamp(1.15rem, 4.5vw, 1.5rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  white-space: nowrap;
}

.month-header__today {
  min-height: 44px;
  margin-inline-start: 4px;
  flex-shrink: 0;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.weekday-cell {
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 8px 0;
  color: rgb(var(--v-theme-on-surface-variant));
}

.weekday-cell--weekend {
  color: rgb(var(--v-theme-weekend));
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding: 6px 2px 4px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: transparent;
  color: rgb(var(--v-theme-on-background));
  cursor: pointer;
  min-height: 44px;
  transition:
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease;
}

.month-grid--desktop .day-cell {
  aspect-ratio: auto;
  min-height: 88px;
  align-items: stretch;
}

.day-cell--muted {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.45;
}

.day-cell--selected {
  background: rgb(var(--v-theme-primary-container));
}

.day-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 9999px;
  flex-shrink: 0;
}

.month-grid--desktop .day-num {
  align-self: center;
}

.day-num--today {
  width: 36px;
  height: 36px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
}

.day-num--selected {
  background: transparent;
  /* 选中态由格子浅底圆角方块表达 */
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.day-dots {
  display: flex;
  gap: 3px;
  justify-content: center;
  min-height: 6px;
}

.day-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.day-capsules {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding-inline: 2px;
  overflow: hidden;
}

.day-capsule {
  display: block;
  font-size: 0.65rem;
  line-height: 1.25;
  padding: 2px 4px;
  border-radius: var(--radius-tag);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: start;
}

.day-capsule-more {
  font-size: 0.65rem;
  color: rgb(var(--v-theme-on-surface-variant));
  padding-inline: 4px;
  text-align: start;
}

@media (prefers-reduced-motion: reduce) {
  .day-cell {
    transition: none;
  }
}
</style>

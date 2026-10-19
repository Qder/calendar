<template>
  <div class="week-page">
    <header class="week-header">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        size="large"
        class="week-header__nav"
        aria-label="上一周"
        :disabled="!semesterReady || weekIndex <= 1"
        @click="shiftWeek(-1)"
      />

      <div class="week-header__title">
        <template v-if="semesterReady">
          <span class="week-header__week tabular-nums">
            第 {{ weekIndex }} 周
          </span>
          <span class="week-header__range text-medium-emphasis">
            {{ weekRangeLabel }}
            <template v-if="totalWeeks">
              · 共 {{ totalWeeks }} 周
            </template>
          </span>
        </template>
        <template v-else>
          <span class="week-header__week">
            课表
          </span>
          <span class="week-header__range text-medium-emphasis">
            请先配置学期
          </span>
        </template>
      </div>

      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        size="large"
        class="week-header__nav"
        aria-label="下一周"
        :disabled="!semesterReady || weekIndex >= totalWeeks"
        @click="shiftWeek(1)"
      />

      <v-btn
        v-if="showThisWeekBtn"
        class="week-header__this"
        variant="tonal"
        color="primary"
        aria-label="回到本周"
        @click="goThisWeek"
      >
        本周
      </v-btn>

      <div class="week-header__actions">
        <v-btn
          color="primary"
          variant="flat"
          class="d-none d-sm-inline-flex"
          :disabled="!semesterReady"
          :to="{ name: 'course-new' }"
        >
          添加课程
        </v-btn>
        <v-btn
          variant="tonal"
          class="d-none d-sm-inline-flex"
          :to="{ name: 'course-import' }"
        >
          导入
        </v-btn>
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-vertical"
              variant="text"
              class="d-sm-none"
              aria-label="更多"
            />
          </template>
          <v-list density="compact">
            <v-list-item
              :disabled="!semesterReady"
              :to="{ name: 'course-new' }"
              title="添加课程"
              prepend-icon="mdi-plus"
            />
            <v-list-item
              :to="{ name: 'course-import' }"
              title="导入课表"
              prepend-icon="mdi-upload"
            />
            <v-list-item
              :to="{ name: 'settings' }"
              title="编辑节次时间"
              prepend-icon="mdi-clock-outline"
            />
          </v-list>
        </v-menu>
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-vertical"
              variant="text"
              class="d-none d-sm-inline-flex"
              aria-label="更多"
            />
          </template>
          <v-list density="compact">
            <v-list-item
              :to="{ name: 'settings' }"
              title="编辑节次时间"
              prepend-icon="mdi-clock-outline"
            />
          </v-list>
        </v-menu>
      </div>
    </header>

    <v-alert
      v-if="!semesterReady"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      请先在
      <router-link :to="{ name: 'settings' }">
        设置
      </router-link>
      填写「第一周周一」与总周数。
    </v-alert>

    <v-alert
      v-else-if="currentWeek == null"
      type="info"
      variant="tonal"
      class="mb-4"
      text="今天不在本学期教学周内；可手动切周查看。"
    />

    <div
      v-if="semesterReady && periods.length"
      class="week-grid-wrap"
    >
      <div
        class="week-grid"
        :style="gridStyle"
      >
        <div
          class="corner text-caption text-medium-emphasis"
          style="grid-column: 1; grid-row: 1"
        >
          节次
        </div>
        <div
          v-for="d in 7"
          :key="`h-${d}`"
          class="day-head text-caption text-center"
          :class="{ 'day-head--today': isTodayCol(d) }"
          :style="{ gridColumn: d + 1, gridRow: 1 }"
        >
          {{ dayLabels[d - 1] }}
          <div class="text-medium-emphasis">
            {{ dayDates[d - 1]?.slice(5) }}
          </div>
        </div>

        <template
          v-for="(p, i) in periods"
          :key="`p-${p.index}`"
        >
          <div
            class="period-label text-caption"
            :style="{ gridColumn: 1, gridRow: i + 2 }"
          >
            <div class="font-weight-medium period-label__name">
              {{ p.label || `第${p.index}节` }}
            </div>
            <div class="text-medium-emphasis period-time">
              {{ p.start }}-{{ p.end }}
            </div>
          </div>
          <div
            v-for="d in 7"
            :key="`slot-${p.index}-${d}`"
            class="slot"
            :class="{ 'slot--today': isTodayCol(d) }"
            :style="{ gridColumn: d + 1, gridRow: i + 2 }"
          />
        </template>

        <button
          v-for="c in weekCourses"
          :key="c.id"
          type="button"
          class="course-block"
          :style="courseBlockStyle(c)"
          :title="courseTitle(c)"
          @click="goEdit(c.id)"
        >
          <div class="course-name">
            {{ c.name }}
          </div>
          <div
            v-if="c.room"
            class="course-room"
          >
            {{ c.room }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  courseAccent,
  courseSoftBackground,
} from '@/components/courseColors'
import { weekIndexToDate, type Weekday } from '@/domain/semester'
import type { CourseRow } from '@/domain/schemas'
import { useCoursesStore } from '@/stores/courses'
import { useSemesterStore } from '@/stores/semester'

const dayLabels = ['一', '二', '三', '四', '五', '六', '日']
const courses = useCoursesStore()
const semesterStore = useSemesterStore()
const router = useRouter()

const weekIndex = ref(1)

const semesterReady = computed(
  () => Boolean(semesterStore.semester?.startMonday && semesterStore.semester.totalWeeks),
)
const totalWeeks = computed(() => semesterStore.totalWeeks)
const periods = computed(() => semesterStore.periods)
const currentWeek = computed(() => semesterStore.weekIndexToday())

const showThisWeekBtn = computed(
  () =>
    semesterReady.value &&
    currentWeek.value != null &&
    weekIndex.value !== currentWeek.value,
)

const gridStyle = computed(() => ({
  gridTemplateColumns: '76px repeat(7, minmax(72px, 1fr))',
  gridTemplateRows: `auto repeat(${periods.value.length}, minmax(52px, auto))`,
}))

const dayDates = computed(() => {
  if (!semesterReady.value) return [] as string[]
  const cfg = {
    startMonday: semesterStore.semester!.startMonday,
    totalWeeks: semesterStore.semester!.totalWeeks,
  }
  return ([1, 2, 3, 4, 5, 6, 7] as Weekday[]).map((wd) =>
    weekIndexToDate(cfg, weekIndex.value, wd),
  )
})

const weekRangeLabel = computed(() => {
  if (!dayDates.value.length) return ''
  return `${dayDates.value[0]} ~ ${dayDates.value[6]}`
})

/** Courses meeting this week, each rendered once at startPeriod (span endPeriod). */
const weekCourses = computed(() =>
  courses
    .inWeek(weekIndex.value)
    .slice()
    .sort((a, b) => a.weekday - b.weekday || a.startPeriod - b.startPeriod),
)

function todayYmd(): string {
  const n = new Date()
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isTodayCol(weekday: number): boolean {
  const date = dayDates.value[weekday - 1]
  return Boolean(date && date === todayYmd())
}

function periodOrdinal(periodIndex: number): number {
  const i = periods.value.findIndex((p) => p.index === periodIndex)
  return i >= 0 ? i + 1 : periodIndex
}

function courseBlockStyle(c: CourseRow): Record<string, string> {
  const startOrd = periodOrdinal(c.startPeriod)
  const endOrd = periodOrdinal(c.endPeriod)
  const span = Math.max(1, endOrd - startOrd + 1)
  const gridRowStart = startOrd + 1
  const accent = courseAccent(c.name)
  return {
    gridColumn: String(c.weekday + 1),
    gridRow: `${gridRowStart} / span ${span}`,
    background: courseSoftBackground(c.name),
    borderLeftColor: accent,
  }
}

function courseTitle(c: CourseRow): string {
  const parts = [c.name, `${c.startPeriod}-${c.endPeriod}节`]
  if (c.room) parts.push(c.room)
  if (c.teacher) parts.push(c.teacher)
  return parts.join(' · ')
}

function goEdit(id: string): void {
  void router.push({ name: 'course-edit', params: { id } })
}

function shiftWeek(delta: number): void {
  weekIndex.value = Math.min(
    totalWeeks.value,
    Math.max(1, weekIndex.value + delta),
  )
}

function goThisWeek(): void {
  if (currentWeek.value != null) weekIndex.value = currentWeek.value
}

onMounted(async () => {
  await semesterStore.load()
  await courses.refresh()
  weekIndex.value = currentWeek.value ?? 1
})

watch(
  () => semesterStore.semester?.startMonday,
  () => {
    weekIndex.value = currentWeek.value ?? 1
  },
)
</script>

<style scoped>
.week-page {
  padding: 16px;
  max-width: 1100px;
  margin-inline: auto;
}

.week-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.week-header__nav {
  min-width: 44px !important;
  min-height: 44px !important;
}

.week-header__title {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 4px 8px;
  min-width: 0;
}

.week-header__week {
  font-size: clamp(1.15rem, 4.5vw, 1.5rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-background));
}

.week-header__range {
  font-size: 0.8rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.week-header__this {
  min-height: 44px;
  flex-shrink: 0;
}

.week-header__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-inline-start: 4px;
}

.week-grid-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.week-grid {
  display: grid;
  gap: 2px;
  position: relative;
  min-width: 640px;
}

.corner,
.day-head,
.period-label,
.slot {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 4px;
  min-height: 52px;
  background: rgb(var(--v-theme-surface));
}

.day-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.day-head--today,
.slot--today {
  background: rgb(var(--v-theme-primary-container));
}

.period-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.25;
}

.period-label__name,
.period-time {
  white-space: nowrap;
}

.period-time {
  font-size: 0.7rem;
}

.course-block {
  z-index: 1;
  margin: 1px;
  border: none;
  border-left: 4px solid;
  border-radius: var(--radius-tag);
  padding: 6px 8px;
  color: rgb(var(--v-theme-on-surface));
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 1px 2px rgba(var(--v-theme-on-surface), 0.08);
}

.course-block:hover {
  filter: brightness(1.04);
}

.course-name {
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
}

.course-room {
  font-size: 0.72rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

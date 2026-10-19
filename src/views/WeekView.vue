<template>
  <v-container
    class="py-4"
    style="max-width: 1100px"
  >
    <div class="d-flex align-center mb-4 flex-wrap ga-2">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        aria-label="上一周"
        :disabled="!semesterReady || weekIndex <= 1"
        @click="shiftWeek(-1)"
      />
      <div class="text-h6 flex-grow-1 text-center">
        <template v-if="semesterReady">
          第 {{ weekIndex }} / {{ totalWeeks }} 周
          <span class="text-body-2 text-medium-emphasis ms-2">
            {{ weekRangeLabel }}
          </span>
        </template>
        <template v-else>
          课表周视图
        </template>
      </div>
      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        aria-label="下一周"
        :disabled="!semesterReady || weekIndex >= totalWeeks"
        @click="shiftWeek(1)"
      />
      <v-btn
        variant="tonal"
        :disabled="!semesterReady || currentWeek == null"
        @click="goThisWeek"
      >
        本周
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :disabled="!semesterReady"
        :to="{ name: 'course-new' }"
      >
        添加课程
      </v-btn>
      <v-btn
        variant="tonal"
        :to="{ name: 'course-import' }"
      >
        导入课表
      </v-btn>
    </div>

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
          <div class="font-weight-medium">
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
          @{{ c.room }}
        </div>
        <div
          v-if="c.teacher"
          class="course-teacher"
        >
          {{ c.teacher }}
        </div>
      </button>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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

/** Courses meeting this week, each rendered once at startPeriod. */
const weekCourses = computed(() =>
  courses
    .inWeek(weekIndex.value)
    .slice()
    .sort((a, b) => a.weekday - b.weekday || a.startPeriod - b.startPeriod),
)

function periodOrdinal(periodIndex: number): number {
  const i = periods.value.findIndex((p) => p.index === periodIndex)
  return i >= 0 ? i + 1 : periodIndex
}

function courseBlockStyle(c: CourseRow): Record<string, string> {
  const startOrd = periodOrdinal(c.startPeriod)
  const endOrd = periodOrdinal(c.endPeriod)
  const span = Math.max(1, endOrd - startOrd + 1)
  // header is row 1 → period rows start at 2
  const gridRowStart = startOrd + 1
  return {
    gridColumn: String(c.weekday + 1),
    gridRow: `${gridRowStart} / span ${span}`,
    background: colorFor(c),
  }
}

function colorFor(c: CourseRow): string {
  let h = 0
  for (const ch of c.id || c.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const hue = h % 360
  return `hsla(${hue}, 55%, 42%, 0.88)`
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
.week-grid {
  display: grid;
  gap: 2px;
  overflow-x: auto;
  position: relative;
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
.period-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.25;
}
.period-time {
  font-size: 0.7rem;
  white-space: nowrap;
}
.course-block {
  z-index: 1;
  margin: 1px;
  border: none;
  border-radius: 6px;
  padding: 6px 8px;
  color: #fff;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
.course-block:hover {
  filter: brightness(1.06);
}
.course-name {
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.25;
  word-break: break-word;
}
.course-room {
  font-size: 0.72rem;
  opacity: 0.95;
  line-height: 1.2;
}
.course-teacher {
  font-size: 0.68rem;
  opacity: 0.85;
  line-height: 1.2;
  /* Prefer name + room when space is tight */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

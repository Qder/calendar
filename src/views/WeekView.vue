<template>
  <v-container
    class="py-4"
    style="max-width: 960px"
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
      v-if="semesterReady"
      class="week-grid"
    >
      <div class="corner text-caption text-medium-emphasis">
        节次
      </div>
      <div
        v-for="d in 7"
        :key="`h-${d}`"
        class="day-head text-caption text-center"
      >
        {{ dayLabels[d - 1] }}
        <div class="text-medium-emphasis">
          {{ dayDates[d - 1]?.slice(5) }}
        </div>
      </div>

      <template
        v-for="p in periods"
        :key="`p-${p.index}`"
      >
        <div class="period-label text-caption">
          <div>{{ p.label || `第${p.index}节` }}</div>
          <div class="text-medium-emphasis">
            {{ p.start }}-{{ p.end }}
          </div>
        </div>
        <div
          v-for="d in 7"
          :key="`c-${p.index}-${d}`"
          class="slot"
        >
          <div
            v-for="c in cellCourses(d, p.index)"
            :key="c.id"
            class="course-chip"
          >
            <div class="font-weight-medium">
              {{ c.name }}
            </div>
            <div class="text-caption">
              {{ c.room || '—' }}
              <span v-if="c.teacher"> · {{ c.teacher }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { weekIndexToDate, type Weekday } from '@/domain/semester'
import type { CourseRow } from '@/domain/schemas'
import { useCoursesStore } from '@/stores/courses'
import { useSemesterStore } from '@/stores/semester'

const dayLabels = ['一', '二', '三', '四', '五', '六', '日']
const courses = useCoursesStore()
const semesterStore = useSemesterStore()

const weekIndex = ref(1)

const semesterReady = computed(
  () => Boolean(semesterStore.semester?.startMonday && semesterStore.semester.totalWeeks),
)
const totalWeeks = computed(() => semesterStore.totalWeeks)
const periods = computed(() => semesterStore.periods)
const currentWeek = computed(() => semesterStore.weekIndexToday())

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

function cellCourses(weekday: number, periodIndex: number): CourseRow[] {
  return courses
    .inWeek(weekIndex.value)
    .filter(
      (c) =>
        c.weekday === weekday &&
        c.startPeriod <= periodIndex &&
        c.endPeriod >= periodIndex,
    )
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

// silence unused import if tree shakes oddly
</script>

<style scoped>
.week-grid {
  display: grid;
  grid-template-columns: 72px repeat(7, 1fr);
  gap: 2px;
  overflow-x: auto;
}
.corner,
.day-head,
.period-label,
.slot {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 4px;
  min-height: 48px;
}
.course-chip {
  background: rgba(var(--v-theme-primary), 0.12);
  border-radius: 6px;
  padding: 4px 6px;
  margin-bottom: 4px;
  font-size: 0.75rem;
}
</style>

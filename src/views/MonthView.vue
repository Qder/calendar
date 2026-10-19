<template>
  <v-container
    class="py-4"
    style="max-width: 720px"
  >
    <div class="d-flex align-center mb-4 flex-wrap ga-2">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        aria-label="上一月"
        @click="shiftMonth(-1)"
      />
      <div class="text-h6 flex-grow-1 text-center">
        {{ year }} 年 {{ month }} 月
      </div>
      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        aria-label="下一月"
        @click="shiftMonth(1)"
      />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        :to="{ name: 'event-new', query: { date: selectedDate } }"
      >
        新建
      </v-btn>
    </div>

    <div class="weekday-row text-caption text-medium-emphasis mb-1">
      <div
        v-for="w in weekLabels"
        :key="w"
        class="day-cell text-center"
      >
        {{ w }}
      </div>
    </div>

    <div class="month-grid mb-4">
      <button
        v-for="cell in cells"
        :key="cell.key"
        type="button"
        class="day-cell day-btn"
        :class="{
          'day-btn--muted': !cell.inMonth,
          'day-btn--selected': cell.ymd === selectedDate,
          'day-btn--today': cell.ymd === today,
        }"
        @click="selectedDate = cell.ymd"
      >
        <span class="day-num">{{ cell.day }}</span>
        <span
          v-if="counts[cell.ymd]"
          class="day-dot"
        />
      </button>
    </div>

    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1">
        {{ selectedDate }} 的事件
      </v-card-title>
      <v-list
        v-if="dayOccurrences.length"
        lines="two"
      >
        <v-list-item
          v-for="occ in dayOccurrences"
          :key="`${occ.event.id}-${occ.occurrenceDate}`"
          :title="occ.event.title"
          :subtitle="occurrenceSubtitle(occ)"
          :to="{ name: 'event-edit', params: { id: occ.event.id } }"
        >
          <template #prepend>
            <v-icon icon="mdi-calendar" />
          </template>
        </v-list-item>
      </v-list>
      <v-card-text
        v-else
        class="text-medium-emphasis"
      >
        暂无事件
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  addMonthsYmd,
  endOfMonthYmd,
  formatYmd,
  startOfMonthYmd,
  todayYmd,
  weekdayMon0,
} from '@/domain/date'
import {
  useEventsStore,
  type EventOccurrence,
} from '@/stores/events'

const weekLabels = ['一', '二', '三', '四', '五', '六', '日']
const store = useEventsStore()

const today = todayYmd()
const cursor = ref(startOfMonthYmd(today))
const selectedDate = ref(today)
const monthOccurrences = ref<EventOccurrence[]>([])

const year = computed(() => Number(cursor.value.slice(0, 4)))
const month = computed(() => Number(cursor.value.slice(5, 7)))

const counts = computed(() => {
  const map: Record<string, number> = {}
  for (const occ of monthOccurrences.value) {
    map[occ.occurrenceDate] = (map[occ.occurrenceDate] ?? 0) + 1
  }
  return map
})

const dayOccurrences = computed(() =>
  monthOccurrences.value
    .filter((o) => o.occurrenceDate === selectedDate.value)
    .sort((a, b) => (a.event.time ?? '').localeCompare(b.event.time ?? '')),
)

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

function occurrenceSubtitle(occ: EventOccurrence): string {
  const time = occ.event.time ? occ.event.time : '全天'
  const rec = occ.event.recurrence && occ.event.recurrence !== 'none'
    ? ` · 重复`
    : ''
  return `${time}${rec}`
}

async function loadMonth(): Promise<void> {
  monthOccurrences.value = await store.occurrencesInMonth(cursor.value)
}

function shiftMonth(delta: number): void {
  cursor.value = startOfMonthYmd(addMonthsYmd(cursor.value, delta))
  const start = startOfMonthYmd(cursor.value)
  const end = endOfMonthYmd(cursor.value)
  if (selectedDate.value < start || selectedDate.value > end) {
    selectedDate.value = start
  }
}

watch(cursor, () => {
  void loadMonth()
})

onMounted(() => {
  void loadMonth()
})
</script>

<style scoped>
.weekday-row,
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
  justify-content: center;
  position: relative;
}
.day-btn {
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  padding: 0;
}
.day-btn--muted {
  opacity: 0.35;
}
.day-btn--today {
  border-color: rgb(var(--v-theme-primary));
}
.day-btn--selected {
  background: rgba(var(--v-theme-primary), 0.12);
}
.day-num {
  font-size: 0.9rem;
}
.day-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  margin-top: 2px;
}
</style>

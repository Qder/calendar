<template>
  <v-container
    class="py-4"
    style="max-width: 640px"
  >
    <div class="d-flex align-center mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :to="{ name: 'week' }"
      />
      <div class="text-h6 ms-2">
        {{ isNew ? '添加课程' : '编辑课程' }}
      </div>
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
      配置学期与节次表。
    </v-alert>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      :text="error"
    />

    <v-form
      v-if="semesterReady"
      @submit.prevent="onSave"
    >
      <v-text-field
        v-model="name"
        label="课程名"
        required
        class="mb-2"
        :disabled="saving"
      />
      <v-select
        v-model="weekday"
        :items="weekdayItems"
        item-title="title"
        item-value="value"
        label="星期"
        class="mb-2"
        :disabled="saving"
      />
      <div class="d-flex ga-2 mb-2">
        <v-select
          v-model="startPeriod"
          :items="periodItems"
          item-title="title"
          item-value="value"
          label="开始节"
          :disabled="saving"
        />
        <v-select
          v-model="endPeriod"
          :items="periodItems"
          item-title="title"
          item-value="value"
          label="结束节"
          :disabled="saving"
        />
      </div>
      <v-text-field
        v-model="weeksRaw"
        label="周次"
        hint="如 1-16、单周、双6-8,15周"
        persistent-hint
        required
        class="mb-2"
        :disabled="saving"
      />
      <v-text-field
        v-model="room"
        label="教室"
        class="mb-2"
        :disabled="saving"
      />
      <v-text-field
        v-model="teacher"
        label="教师"
        class="mb-2"
        :disabled="saving"
      />

      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!semesterReady"
        >
          保存
        </v-btn>
        <v-btn
          v-if="!isNew"
          color="error"
          variant="outlined"
          :loading="saving"
          @click="onDelete"
        >
          删除
        </v-btn>
        <v-btn
          variant="text"
          :to="{ name: 'week' }"
        >
          取消
        </v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useSemesterStore } from '@/stores/semester'

const route = useRoute()
const router = useRouter()
const courses = useCoursesStore()
const semesterStore = useSemesterStore()

const isNew = computed(() => route.name === 'course-new')

const name = ref('')
const weekday = ref(1)
const startPeriod = ref(1)
const endPeriod = ref(2)
const weeksRaw = ref('1-16')
const room = ref('')
const teacher = ref('')
const saving = ref(false)
const error = ref('')

const semesterReady = computed(
  () =>
    Boolean(
      semesterStore.semester?.startMonday &&
        semesterStore.semester.totalWeeks &&
        semesterStore.periods.length,
    ),
)

const weekdayItems = [
  { title: '周一', value: 1 },
  { title: '周二', value: 2 },
  { title: '周三', value: 3 },
  { title: '周四', value: 4 },
  { title: '周五', value: 5 },
  { title: '周六', value: 6 },
  { title: '周日', value: 7 },
]

const periodItems = computed(() =>
  semesterStore.periods.map((p) => ({
    title: p.label || `第${p.index}节（${p.start}-${p.end}）`,
    value: p.index,
  })),
)

watch(startPeriod, (s) => {
  if (endPeriod.value < s) endPeriod.value = s
})

onMounted(async () => {
  await semesterStore.load()
  const first = semesterStore.periods[0]?.index ?? 1
  const second = semesterStore.periods[1]?.index ?? first

  if (typeof route.query.weekday === 'string' && /^\d+$/.test(route.query.weekday)) {
    const w = Number(route.query.weekday)
    if (w >= 1 && w <= 7) weekday.value = w
  }
  if (
    typeof route.query.startPeriod === 'string' &&
    /^\d+$/.test(route.query.startPeriod)
  ) {
    startPeriod.value = Number(route.query.startPeriod)
  } else {
    startPeriod.value = first
  }
  if (
    typeof route.query.endPeriod === 'string' &&
    /^\d+$/.test(route.query.endPeriod)
  ) {
    endPeriod.value = Number(route.query.endPeriod)
  } else {
    endPeriod.value = Math.max(startPeriod.value, second)
  }

  if (!isNew.value && typeof route.params.id === 'string') {
    const row = await courses.load(route.params.id)
    if (!row) {
      error.value = '课程不存在'
      return
    }
    name.value = row.name
    weekday.value = row.weekday
    startPeriod.value = row.startPeriod
    endPeriod.value = row.endPeriod
    weeksRaw.value = row.weeksRaw
    room.value = row.room ?? ''
    teacher.value = row.teacher ?? ''
  } else if (semesterStore.semester?.totalWeeks) {
    weeksRaw.value = `1-${semesterStore.semester.totalWeeks}`
  }
})

async function onSave(): Promise<void> {
  error.value = ''
  saving.value = true
  try {
    await courses.save(
      {
        name: name.value,
        weekday: weekday.value,
        startPeriod: startPeriod.value,
        endPeriod: endPeriod.value,
        weeksRaw: weeksRaw.value,
        room: room.value,
        teacher: teacher.value,
      },
      {
        totalWeeks: semesterStore.totalWeeks,
        periodIndices: semesterStore.periods.map((p) => p.index),
        id: isNew.value ? undefined : String(route.params.id),
      },
    )
    await router.push({ name: 'week' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    saving.value = false
  }
}

async function onDelete(): Promise<void> {
  if (isNew.value) return
  if (!globalThis.confirm('确定删除这门课程？')) return
  saving.value = true
  try {
    await courses.remove(String(route.params.id))
    await router.push({ name: 'week' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container
    class="py-4"
    style="max-width: 720px"
  >
    <div class="d-flex align-center mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :to="{ name: 'month' }"
      />
      <div class="text-h6 ms-2">
        设置
      </div>
    </div>

    <v-card
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>默认提醒时刻</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-4">
          新建事件未指定提醒时，默认「事件前 1 天」的此时刻。
        </p>
        <v-text-field
          v-model="time"
          label="默认提醒时刻"
          type="time"
          class="mb-2"
        />
        <v-btn
          color="primary"
          variant="flat"
          :loading="savingRemind"
          @click="onSaveRemind"
        >
          保存
        </v-btn>
        <div
          v-if="remindMsg"
          class="text-caption mt-2"
        >
          {{ remindMsg }}
        </div>
      </v-card-text>
    </v-card>

    <v-card
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>学期</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-4">
          「第一周周一」必须是周一；总周数用于校验课表周次上界与周视图切周。
        </p>
        <v-text-field
          v-model="startMonday"
          label="第一周周一"
          type="date"
          class="mb-2"
        />
        <v-text-field
          v-model.number="totalWeeks"
          label="总周数"
          type="number"
          min="1"
          max="60"
          class="mb-2"
        />
        <v-btn
          color="primary"
          variant="flat"
          :loading="savingSem"
          @click="onSaveSemester"
        >
          保存学期
        </v-btn>
        <div
          v-if="semMsg"
          class="text-caption mt-2"
        >
          {{ semMsg }}
        </div>
      </v-card-text>
    </v-card>

    <v-card variant="outlined">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>节次时间表</span>
        <v-btn
          size="small"
          variant="text"
          @click="onResetPeriods"
        >
          恢复默认
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div
          v-for="(p, idx) in periodDraft"
          :key="p.index"
          class="d-flex flex-wrap ga-2 mb-2 align-center"
        >
          <span
            class="text-caption"
            style="width: 48px"
          >第{{ p.index }}节</span>
          <v-text-field
            v-model="periodDraft[idx].start"
            label="开始"
            type="time"
            density="compact"
            hide-details
            style="max-width: 140px"
          />
          <v-text-field
            v-model="periodDraft[idx].end"
            label="结束"
            type="time"
            density="compact"
            hide-details
            style="max-width: 140px"
          />
        </div>
        <v-btn
          color="primary"
          variant="flat"
          class="mt-2"
          :loading="savingPeriods"
          @click="onSavePeriods"
        >
          保存节次
        </v-btn>
        <div
          v-if="periodMsg"
          class="text-caption mt-2"
        >
          {{ periodMsg }}
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { PeriodRow } from '@/domain/schemas'
import { useSemesterStore } from '@/stores/semester'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const semesterStore = useSemesterStore()

const time = ref('09:00')
const savingRemind = ref(false)
const remindMsg = ref('')

const startMonday = ref('')
const totalWeeks = ref(16)
const savingSem = ref(false)
const semMsg = ref('')

const periodDraft = ref<PeriodRow[]>([])
const savingPeriods = ref(false)
const periodMsg = ref('')

onMounted(async () => {
  await settings.load()
  time.value = settings.defaultRemindTime
  await semesterStore.load()
  if (semesterStore.semester) {
    startMonday.value = semesterStore.semester.startMonday
    totalWeeks.value = semesterStore.semester.totalWeeks
  }
  periodDraft.value = semesterStore.periods.map((p) => ({ ...p }))
})

async function onSaveRemind(): Promise<void> {
  savingRemind.value = true
  remindMsg.value = ''
  try {
    await settings.saveDefaultRemindTime(time.value)
    remindMsg.value = '已保存'
  } catch (err) {
    remindMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    savingRemind.value = false
  }
}

async function onSaveSemester(): Promise<void> {
  savingSem.value = true
  semMsg.value = ''
  try {
    await semesterStore.saveSemester(startMonday.value, Number(totalWeeks.value))
    semMsg.value = '学期已保存'
  } catch (err) {
    semMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    savingSem.value = false
  }
}

async function onSavePeriods(): Promise<void> {
  savingPeriods.value = true
  periodMsg.value = ''
  try {
    await semesterStore.savePeriodTable(periodDraft.value.map((p) => ({ ...p })))
    periodMsg.value = '节次已保存'
  } catch (err) {
    periodMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    savingPeriods.value = false
  }
}

async function onResetPeriods(): Promise<void> {
  await semesterStore.resetPeriods()
  periodDraft.value = semesterStore.periods.map((p) => ({ ...p }))
  periodMsg.value = '已恢复默认节次（尚未点保存也会写入）'
}
</script>

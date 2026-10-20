<template>
  <!-- 手机/平板：全高底部 sheet -->
  <v-bottom-sheet
    v-if="!isDesktop"
    v-model="panelOpen"
    fullscreen
    :scrim="true"
    class="event-edit-sheet"
  >
    <v-card
      class="event-edit-panel d-flex flex-column"
      height="100%"
      rounded="0"
      :aria-label="heading"
    >
      <v-toolbar
        density="comfortable"
        color="surface"
        class="border-b flex-shrink-0"
      >
        <v-btn
          icon="mdi-close"
          variant="text"
          aria-label="关闭"
          class="touch-target"
          @click="onCancel"
        />
        <v-toolbar-title class="text-subtitle-1">
          {{ heading }}
        </v-toolbar-title>
      </v-toolbar>

      <div class="event-edit-body flex-grow-1 overflow-y-auto">
        <EventEditFormBody
          v-if="!bootLoading"
          v-model:title="title"
          v-model:date="date"
          v-model:all-day="allDay"
          v-model:time="time"
          v-model:note="note"
          v-model:recurrence="recurrence"
          v-model:selected-offsets="selectedOffsets"
          v-model:custom-enabled="customEnabled"
          v-model:custom-days="customDays"
          v-model:remind-time="remindTime"
          :is-new="isNew"
          :error="error"
          :recurrence-items="recurrenceItems"
          :show-system-alarm="showSystemAlarm"
          :system-alarm-busy="systemAlarmBusy"
          @add-system-alarm="onAddSystemAlarm"
        />
        <div
          v-else
          class="pa-4"
          aria-busy="true"
          aria-label="加载中"
        >
          <v-skeleton-loader type="article, actions" />
        </div>
      </div>

      <div class="event-edit-footer flex-shrink-0 border-t pa-3">
        <EventEditActions
          :is-new="isNew"
          :saving="saving"
          :disabled="bootLoading"
          @save="onSave"
          @delete="askDelete"
          @cancel="onCancel"
        />
      </div>
    </v-card>
  </v-bottom-sheet>

  <!-- 桌面：居中对话框 -->
  <v-dialog
    v-else
    v-model="panelOpen"
    max-width="560"
    persistent
    scrollable
    class="event-edit-dialog"
  >
    <v-card
      class="event-edit-panel d-flex flex-column"
      :aria-label="heading"
    >
      <v-toolbar
        density="comfortable"
        color="surface"
        class="border-b flex-shrink-0"
      >
        <v-toolbar-title class="text-subtitle-1">
          {{ heading }}
        </v-toolbar-title>
        <template #append>
          <v-btn
            icon="mdi-close"
            variant="text"
            aria-label="关闭"
            class="touch-target"
            @click="onCancel"
          />
        </template>
      </v-toolbar>

      <v-card-text class="event-edit-body pa-0">
        <EventEditFormBody
          v-if="!bootLoading"
          v-model:title="title"
          v-model:date="date"
          v-model:all-day="allDay"
          v-model:time="time"
          v-model:note="note"
          v-model:recurrence="recurrence"
          v-model:selected-offsets="selectedOffsets"
          v-model:custom-enabled="customEnabled"
          v-model:custom-days="customDays"
          v-model:remind-time="remindTime"
          :is-new="isNew"
          :error="error"
          :recurrence-items="recurrenceItems"
          :show-system-alarm="showSystemAlarm"
          :system-alarm-busy="systemAlarmBusy"
          @add-system-alarm="onAddSystemAlarm"
        />
        <div
          v-else
          class="pa-4"
          aria-busy="true"
          aria-label="加载中"
        >
          <v-skeleton-loader type="article, actions" />
        </div>
      </v-card-text>

      <div class="event-edit-footer flex-shrink-0 border-t pa-3">
        <EventEditActions
          :is-new="isNew"
          :saving="saving"
          :disabled="bootLoading"
          @save="onSave"
          @delete="askDelete"
          @cancel="onCancel"
        />
      </div>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="deleteConfirmOpen"
    max-width="400"
    persistent
  >
    <v-card>
      <v-card-title class="text-subtitle-1">
        删除整系列？
      </v-card-title>
      <v-card-text>
        确定删除整个事件系列及其全部提醒？此操作不可撤销。
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          class="touch-target"
          aria-label="取消删除"
          @click="deleteConfirmOpen = false"
        >
          取消
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          class="touch-target"
          :loading="saving"
          aria-label="确认删除整系列"
          @click="onDeleteConfirmed"
        >
          删除
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar
    v-model="snackOpen"
    :color="snackColor"
    timeout="3500"
    location="bottom"
  >
    {{ snackText }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import EventEditActions from '@/components/EventEditActions.vue'
import EventEditFormBody from '@/components/EventEditFormBody.vue'
import { todayYmd } from '@/domain/date'
import type { RecurrenceFreq } from '@/domain/recurrence'
import { pickSystemAlarmTarget } from '@/domain/systemAlarm'
import { detectAppPlatform } from '@/domain/platform'
import {
  canUseSystemAlarm,
  openSystemAlarm,
} from '@/services/platform/systemAlarm'
import { useEventsStore } from '@/stores/events'
import { useSettingsStore } from '@/stores/settings'

const PRESET_OFFSETS = [0, 1, 3, 7] as const

const route = useRoute()
const router = useRouter()
const events = useEventsStore()
const settings = useSettingsStore()
const display = useDisplay()

const isDesktop = computed(() => display.mdAndUp.value)
const isNew = computed(() => route.name === 'event-new')
const heading = computed(() =>
  isNew.value ? '新建事件' : '编辑事件（整系列）',
)

const panelOpen = ref(true)
const bootLoading = ref(true)
const title = ref('')
const date = ref(todayYmd())
const allDay = ref(true)
const time = ref('09:00')
const note = ref('')
const recurrence = ref<RecurrenceFreq>('none')
const selectedOffsets = ref<number[]>([1])
const customEnabled = ref(false)
const customDays = ref(2)
/** 加载时多余的非预设 daysBefore（UI 只展示第一个自定义） */
const extraCustomDays = ref<number[]>([])
const remindTime = ref('09:00')
const saving = ref(false)
const error = ref('')
const deleteConfirmOpen = ref(false)
const showSystemAlarm = canUseSystemAlarm()
const systemAlarmBusy = ref(false)
const snackOpen = ref(false)
const snackText = ref('')
const snackColor = ref<'success' | 'error' | 'info'>('info')

function showSnack(
  message: string,
  color: 'success' | 'error' | 'info' = 'info',
): void {
  snackText.value = message
  snackColor.value = color
  snackOpen.value = true
}

async function onAddSystemAlarm(): Promise<void> {
  if (detectAppPlatform() !== 'android') {
    showSnack('仅手机可用', 'info')
    return
  }
  const reminders = buildReminders()
  if (reminders.length === 0) {
    showSnack('请先启用提醒并设置提醒时刻', 'error')
    return
  }
  const target = pickSystemAlarmTarget({
    title: title.value.trim() || '日历提醒',
    eventDate: date.value,
    rules: reminders,
  })
  if (!target) {
    showSnack('无法计算系统闹钟时刻', 'error')
    return
  }
  systemAlarmBusy.value = true
  try {
    const result = await openSystemAlarm(target)
    if (result.ok) {
      showSnack('已打开系统时钟，请确认闹钟', 'success')
    } else {
      showSnack(result.reason, 'error')
    }
  } finally {
    systemAlarmBusy.value = false
  }
}

const recurrenceItems = [
  { title: '不重复', value: 'none' },
  { title: '每周', value: 'weekly' },
  { title: '每月', value: 'monthly' },
  { title: '每年', value: 'yearly' },
]

function isPreset(days: number): boolean {
  return (PRESET_OFFSETS as readonly number[]).includes(days)
}

function applyRemindersFromRules(
  rules: { daysBefore: number; time: string }[],
): void {
  if (rules.length === 0) {
    selectedOffsets.value = []
    customEnabled.value = false
    customDays.value = 2
    extraCustomDays.value = []
    remindTime.value = settings.defaultRemindTime || '09:00'
    return
  }
  remindTime.value = rules[0]!.time
  const presets = [
    ...new Set(rules.map((r) => r.daysBefore).filter(isPreset)),
  ].sort((a, b) => a - b)
  const nonPreset = [
    ...new Set(rules.map((r) => r.daysBefore).filter((d) => !isPreset(d))),
  ]
  selectedOffsets.value = presets
  if (nonPreset.length > 0) {
    customEnabled.value = true
    customDays.value = nonPreset[0]!
    extraCustomDays.value = nonPreset.slice(1)
  } else {
    customEnabled.value = false
    customDays.value = 2
    extraCustomDays.value = []
  }
}

function buildReminders(): { daysBefore: number; time: string }[] {
  const t = remindTime.value || '09:00'
  const out: { daysBefore: number; time: string }[] = []
  const seen = new Set<number>()
  for (const d of selectedOffsets.value) {
    const n = Number(d)
    if (!Number.isFinite(n) || n < 0 || n > 365 || seen.has(n)) continue
    seen.add(n)
    out.push({ daysBefore: n, time: t })
  }
  if (customEnabled.value) {
    const n = Number(customDays.value)
    if (Number.isFinite(n) && n >= 0 && n <= 365 && !seen.has(n)) {
      seen.add(n)
      out.push({ daysBefore: n, time: t })
    }
  }
  for (const d of extraCustomDays.value) {
    if (!seen.has(d) && d >= 0 && d <= 365) {
      seen.add(d)
      out.push({ daysBefore: d, time: t })
    }
  }
  return out
}

watch([customEnabled, customDays], () => {
  if (extraCustomDays.value.length) extraCustomDays.value = []
})

onMounted(async () => {
  bootLoading.value = true
  panelOpen.value = true
  try {
    await settings.load()
    remindTime.value = settings.defaultRemindTime || '09:00'

    if (typeof route.query.date === 'string' && route.query.date) {
      date.value = route.query.date
    }

    if (!isNew.value && typeof route.params.id === 'string') {
      const ev = await events.load(route.params.id)
      if (!ev) {
        error.value = '事件不存在'
        return
      }
      title.value = ev.title
      date.value = ev.date
      allDay.value = !ev.time
      time.value = ev.time ?? '09:00'
      note.value = ev.note ?? ''
      recurrence.value = (ev.recurrence ?? 'none') as RecurrenceFreq
      const rules = await events.loadRules(ev.id)
      applyRemindersFromRules(
        rules.map((r) => ({ daysBefore: r.daysBefore, time: r.time })),
      )
    } else {
      selectedOffsets.value = [1]
      customEnabled.value = false
      extraCustomDays.value = []
      remindTime.value = settings.defaultRemindTime || '09:00'
    }
  } finally {
    bootLoading.value = false
  }
})

watch(panelOpen, (open) => {
  if (!open && !saving.value && !deleteConfirmOpen.value) {
    void leave()
  }
})

async function leave(): Promise<void> {
  if (globalThis.history.length > 1) {
    router.back()
  } else {
    await router.push({ name: 'month' })
  }
}

function onCancel(): void {
  panelOpen.value = false
}

async function onSave(): Promise<void> {
  error.value = ''
  if (!title.value.trim()) {
    error.value = '请填写标题'
    return
  }
  saving.value = true
  try {
    const id = isNew.value ? undefined : String(route.params.id)
    await events.save(
      {
        title: title.value.trim(),
        date: date.value,
        time: allDay.value ? null : time.value,
        note: note.value,
        recurrence: recurrence.value,
        reminders: buildReminders(),
      },
      id,
    )
    panelOpen.value = false
    await router.push({ name: 'month' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    saving.value = false
  }
}

function askDelete(): void {
  if (isNew.value) return
  deleteConfirmOpen.value = true
}

async function onDeleteConfirmed(): Promise<void> {
  if (isNew.value) return
  saving.value = true
  try {
    await events.remove(String(route.params.id))
    deleteConfirmOpen.value = false
    panelOpen.value = false
    await router.push({ name: 'month' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    deleteConfirmOpen.value = false
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.event-edit-body {
  padding: 16px;
  min-height: 0;
}

.event-edit-footer {
  background: rgb(var(--v-theme-surface));
}

.touch-target {
  min-width: 44px !important;
  min-height: 44px !important;
}

.event-edit-panel {
  max-height: 100%;
}
</style>

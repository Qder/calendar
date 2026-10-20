<template>
  <div class="event-edit-form">
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      :text="error"
    />

    <v-alert
      v-if="!isNew"
      type="info"
      variant="tonal"
      class="mb-4"
      text="修改与删除作用于整个重复系列，不支持「仅此一次」。"
    />

    <v-text-field
      :model-value="title"
      label="标题"
      required
      class="mb-2"
      hide-details="auto"
      aria-label="标题"
      @update:model-value="$emit('update:title', String($event ?? ''))"
    />

    <v-text-field
      :model-value="date"
      label="日期"
      type="date"
      required
      class="mb-2"
      hide-details="auto"
      aria-label="日期"
      @update:model-value="$emit('update:date', String($event ?? ''))"
    />

    <v-switch
      :model-value="allDay"
      label="全天"
      color="primary"
      hide-details
      class="mb-2 touch-row"
      aria-label="全天"
      @update:model-value="$emit('update:allDay', Boolean($event))"
    />
    <v-text-field
      v-if="!allDay"
      :model-value="time"
      label="时间"
      type="time"
      class="mb-2"
      hide-details="auto"
      aria-label="时间"
      @update:model-value="$emit('update:time', String($event ?? ''))"
    />

    <div class="text-subtitle-2 mb-2 mt-2">
      提醒
    </div>
    <div
      class="d-flex flex-wrap ga-2 mb-3"
      role="group"
      aria-label="提醒快捷选项"
    >
      <v-chip
        v-for="opt in presetOptions"
        :key="opt.days"
        :variant="isPresetOn(opt.days) ? 'flat' : 'outlined'"
        :color="isPresetOn(opt.days) ? 'primary' : undefined"
        class="touch-chip"
        :aria-pressed="isPresetOn(opt.days)"
        :aria-label="opt.label"
        @click="togglePreset(opt.days)"
      >
        {{ opt.label }}
      </v-chip>
      <v-chip
        :variant="customEnabled ? 'flat' : 'outlined'"
        :color="customEnabled ? 'primary' : undefined"
        class="touch-chip"
        :aria-pressed="customEnabled"
        aria-label="自定义提醒"
        @click="$emit('update:customEnabled', !customEnabled)"
      >
        自定义
      </v-chip>
    </div>

    <v-text-field
      v-if="customEnabled"
      :model-value="customDays"
      label="自定义：事件前 N 天"
      type="number"
      min="0"
      max="365"
      class="mb-2"
      hide-details="auto"
      aria-label="自定义事件前几天"
      @update:model-value="onCustomDays($event)"
    />

    <v-text-field
      v-if="hasAnyReminder"
      :model-value="remindTime"
      label="提醒时刻"
      type="time"
      class="mb-2"
      hide-details="auto"
      aria-label="提醒时刻"
      @update:model-value="$emit('update:remindTime', String($event ?? ''))"
    />
    <div
      v-else
      class="text-medium-emphasis text-body-2 mb-2"
    >
      未启用提醒（保存后不会调度通知）
    </div>

    <v-btn
      v-if="showSystemAlarm && hasAnyReminder"
      variant="outlined"
      color="primary"
      class="mb-3 touch-row"
      prepend-icon="mdi-alarm"
      block
      :loading="systemAlarmBusy"
      aria-label="添加到系统闹钟"
      @click="$emit('add-system-alarm')"
    >
      添加到系统闹钟
    </v-btn>
    <div
      v-if="showSystemAlarm && hasAnyReminder"
      class="text-medium-emphasis text-caption mb-3"
    >
      仅打开系统时钟预填时刻与标题，需在时钟里确认；不替代 App 本地通知。多条提醒只同步最近一条。
    </div>

    <v-textarea
      :model-value="note"
      label="备注"
      rows="3"
      class="mb-2"
      hide-details="auto"
      aria-label="备注"
      @update:model-value="$emit('update:note', String($event ?? ''))"
    />

    <v-select
      :model-value="recurrence"
      :items="recurrenceItems"
      item-title="title"
      item-value="value"
      label="重复"
      class="mb-2"
      hide-details="auto"
      aria-label="重复"
      @update:model-value="$emit('update:recurrence', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RecurrenceFreq } from '@/domain/recurrence'

const props = defineProps<{
  title: string
  date: string
  allDay: boolean
  time: string
  note: string
  recurrence: RecurrenceFreq
  selectedOffsets: number[]
  customEnabled: boolean
  customDays: number
  remindTime: string
  isNew: boolean
  error: string
  recurrenceItems: { title: string; value: string }[]
  /** Android only — hide on Web/Tauri */
  showSystemAlarm?: boolean
  systemAlarmBusy?: boolean
}>()

const emit = defineEmits<{
  'update:title': [string]
  'update:date': [string]
  'update:allDay': [boolean]
  'update:time': [string]
  'update:note': [string]
  'update:recurrence': [RecurrenceFreq]
  'update:selectedOffsets': [number[]]
  'update:customEnabled': [boolean]
  'update:customDays': [number]
  'update:remindTime': [string]
  'add-system-alarm': []
}>()

const presetOptions = [
  { days: 0, label: '当天' },
  { days: 1, label: '前1天' },
  { days: 3, label: '前3天' },
  { days: 7, label: '前7天' },
]

const hasAnyReminder = computed(
  () => props.selectedOffsets.length > 0 || props.customEnabled,
)

function isPresetOn(days: number): boolean {
  return props.selectedOffsets.includes(days)
}

function togglePreset(days: number): void {
  const set = new Set(props.selectedOffsets)
  if (set.has(days)) set.delete(days)
  else set.add(days)
  emit('update:selectedOffsets', [...set].sort((a, b) => a - b))
}

function onCustomDays(v: unknown): void {
  const n = Number(v)
  emit('update:customDays', Number.isFinite(n) ? n : 0)
}
</script>

<style scoped>
.touch-chip {
  min-height: 44px !important;
  padding-inline: 14px !important;
}
.touch-row {
  min-height: 44px;
}
</style>

<template>
  <v-container
    class="py-4"
    style="max-width: 640px"
  >
    <div class="d-flex align-center mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :to="{ name: 'month' }"
      />
      <div class="text-h6 ms-2">
        {{ isNew ? '新建事件' : '编辑事件（整系列）' }}
      </div>
    </div>

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

    <v-form @submit.prevent="onSave">
      <v-text-field
        v-model="title"
        label="标题"
        required
        class="mb-2"
      />
      <v-text-field
        v-model="date"
        label="开始日期（系列锚点）"
        type="date"
        required
        class="mb-2"
      />
      <v-select
        v-model="recurrence"
        :items="recurrenceItems"
        item-title="title"
        item-value="value"
        label="重复"
        class="mb-2"
      />
      <v-switch
        v-model="hasTime"
        label="指定时刻"
        color="primary"
        hide-details
        class="mb-2"
      />
      <v-text-field
        v-if="hasTime"
        v-model="time"
        label="时刻"
        type="time"
        class="mb-2"
      />
      <v-textarea
        v-model="note"
        label="备注"
        rows="3"
        class="mb-2"
      />

      <v-divider class="my-4" />
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-2">
          提醒（可多条）
        </div>
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="addReminder"
        >
          添加
        </v-btn>
      </div>

      <v-card
        v-for="(r, idx) in reminders"
        :key="idx"
        variant="outlined"
        class="mb-2 pa-3"
      >
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-caption">提醒 {{ idx + 1 }}</span>
          <v-btn
            icon="mdi-delete-outline"
            size="small"
            variant="text"
            aria-label="删除提醒"
            @click="reminders.splice(idx, 1)"
          />
        </div>
        <v-text-field
          v-model.number="r.daysBefore"
          label="事件前 N 天"
          type="number"
          min="0"
          max="365"
          class="mb-2"
          hide-details
        />
        <v-text-field
          v-model="r.time"
          label="提醒时刻"
          type="time"
          hide-details
        />
      </v-card>
      <div
        v-if="reminders.length === 0"
        class="text-medium-emphasis text-body-2 mb-2"
      >
        未启用提醒（保存后不会调度通知）
      </div>

      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          :loading="saving"
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
          删除整系列
        </v-btn>
        <v-btn
          variant="text"
          :to="{ name: 'month' }"
        >
          取消
        </v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { todayYmd } from '@/domain/date'
import type { RecurrenceFreq } from '@/domain/recurrence'
import { useEventsStore } from '@/stores/events'
import { useSettingsStore } from '@/stores/settings'

interface ReminderDraft {
  daysBefore: number
  time: string
}

const route = useRoute()
const router = useRouter()
const events = useEventsStore()
const settings = useSettingsStore()

const isNew = computed(() => route.name === 'event-new')

const title = ref('')
const date = ref(todayYmd())
const hasTime = ref(false)
const time = ref('09:00')
const note = ref('')
const recurrence = ref<RecurrenceFreq>('none')
const reminders = ref<ReminderDraft[]>([])
const saving = ref(false)
const error = ref('')

const recurrenceItems = [
  { title: '不重复', value: 'none' },
  { title: '每周', value: 'weekly' },
  { title: '每月', value: 'monthly' },
  { title: '每年', value: 'yearly' },
]

function addReminder(): void {
  reminders.value.push({
    daysBefore: 1,
    time: settings.defaultRemindTime || '09:00',
  })
}

onMounted(async () => {
  await settings.load()

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
    hasTime.value = Boolean(ev.time)
    time.value = ev.time ?? '09:00'
    note.value = ev.note ?? ''
    recurrence.value = (ev.recurrence ?? 'none') as RecurrenceFreq
    const rules = await events.loadRules(ev.id)
    reminders.value = rules.map((r) => ({
      daysBefore: r.daysBefore,
      time: r.time,
    }))
  } else {
    reminders.value = [
      { daysBefore: 1, time: settings.defaultRemindTime || '09:00' },
    ]
  }
})

async function onSave(): Promise<void> {
  error.value = ''
  saving.value = true
  try {
    const id = isNew.value ? undefined : String(route.params.id)
    await events.save(
      {
        title: title.value.trim(),
        date: date.value,
        time: hasTime.value ? time.value : null,
        note: note.value,
        recurrence: recurrence.value,
        reminders: reminders.value.map((r) => ({
          daysBefore: Number(r.daysBefore),
          time: r.time,
        })),
      },
      id,
    )
    await router.push({ name: 'month' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    saving.value = false
  }
}

async function onDelete(): Promise<void> {
  if (isNew.value) return
  if (!globalThis.confirm('确定删除整个事件系列及其全部提醒？')) return
  saving.value = true
  try {
    await events.remove(String(route.params.id))
    await router.push({ name: 'month' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    saving.value = false
  }
}
</script>

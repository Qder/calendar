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
        {{ isNew ? '新建事件' : '编辑事件' }}
      </div>
    </div>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      :text="error"
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
        label="日期"
        type="date"
        required
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
      <div class="text-subtitle-2 mb-2">
        提醒（单条）
      </div>
      <v-switch
        v-model="remindEnabled"
        label="启用提醒"
        color="primary"
        hide-details
        class="mb-2"
      />
      <template v-if="remindEnabled">
        <v-text-field
          v-model.number="daysBefore"
          label="事件前 N 天"
          type="number"
          min="0"
          max="365"
          class="mb-2"
        />
        <v-text-field
          v-model="remindTime"
          label="提醒时刻"
          type="time"
          class="mb-2"
        />
      </template>

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
          删除
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
import { useEventsStore } from '@/stores/events'
import { useSettingsStore } from '@/stores/settings'

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
const remindEnabled = ref(true)
const daysBefore = ref(1)
const remindTime = ref('09:00')
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  await settings.load()
  remindTime.value = settings.defaultRemindTime

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
    const rule = await events.loadRule(ev.id)
    if (rule) {
      remindEnabled.value = true
      daysBefore.value = rule.daysBefore
      remindTime.value = rule.time
    } else {
      remindEnabled.value = false
    }
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
        reminder: remindEnabled.value
          ? {
              daysBefore: Number(daysBefore.value),
              time: remindTime.value,
            }
          : null,
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
  if (!globalThis.confirm('确定删除该事件及其提醒？')) return
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

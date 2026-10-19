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
        设置
      </div>
    </div>

    <v-card variant="outlined">
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
          :loading="saving"
          @click="onSave"
        >
          保存
        </v-btn>
        <div
          v-if="msg"
          class="text-caption mt-2"
        >
          {{ msg }}
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const time = ref('09:00')
const saving = ref(false)
const msg = ref('')

onMounted(async () => {
  await settings.load()
  time.value = settings.defaultRemindTime
})

async function onSave(): Promise<void> {
  saving.value = true
  msg.value = ''
  try {
    await settings.saveDefaultRemindTime(time.value)
    msg.value = '已保存'
  } catch (err) {
    msg.value = err instanceof Error ? err.message : String(err)
  } finally {
    saving.value = false
  }
}
</script>

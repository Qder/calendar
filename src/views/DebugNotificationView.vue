<template>
  <v-container
    class="py-6"
    style="max-width: 640px"
  >
    <v-alert
      type="info"
      variant="tonal"
      class="mb-4"
      title="本阶段只验证通知"
    >
      调试页：手动调度系统通知（与月视图事件独立）。Android：划掉后靠系统 Local Notifications。
      Windows：关窗口靠托盘保活；杀进程不保证弹出。
    </v-alert>

    <v-card
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>权限与平台</v-card-title>
      <v-card-text>
        <div class="text-body-2 mb-2">
          当前实现：<strong>{{ platformLabel }}</strong>
        </div>
        <v-btn
          color="primary"
          variant="flat"
          class="me-2 mb-2"
          :loading="busy"
          @click="onRequestPermission"
        >
          申请通知权限
        </v-btn>
        <div
          v-if="permissionMsg"
          class="text-caption mt-1"
        >
          {{ permissionMsg }}
        </div>
      </v-card-text>
    </v-card>

    <v-card
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>调度调试</v-card-title>
      <v-card-text class="d-flex flex-wrap ga-2">
        <v-btn
          color="primary"
          variant="tonal"
          :disabled="busy"
          @click="scheduleIn(30, '30 秒后提醒')"
        >
          30 秒后提醒
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :disabled="busy"
          @click="scheduleIn(120, '2 分钟后提醒')"
        >
          2 分钟后提醒
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :disabled="busy"
          @click="scheduleIn(300, '5 分钟后提醒')"
        >
          5 分钟后提醒
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          :disabled="busy"
          @click="onCancelAll"
        >
          取消全部
        </v-btn>
        <v-btn
          color="secondary"
          variant="outlined"
          :disabled="busy"
          @click="onListPending"
        >
          列出待触发
        </v-btn>
      </v-card-text>
      <v-card-text v-if="statusMsg">
        <v-alert
          density="compact"
          type="success"
          variant="tonal"
        >
          {{ statusMsg }}
        </v-alert>
      </v-card-text>
      <v-card-text v-if="errorMsg">
        <v-alert
          density="compact"
          type="error"
          variant="tonal"
        >
          {{ errorMsg }}
        </v-alert>
      </v-card-text>
    </v-card>

    <v-card
      v-if="pending.length"
      variant="outlined"
    >
      <v-card-title>待触发列表</v-card-title>
      <v-list density="compact">
        <v-list-item
          v-for="item in pending"
          :key="item.id"
          :title="`#${item.id} ${item.title}`"
          :subtitle="formatTrigger(item.triggerAt)"
        />
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { addMs } from '@/domain/triggerAt'
import { clearAllScheduled } from '@/db/repos/scheduledNotifications'
import {
  getNotificationPlatformLabel,
  getNotificationService,
  type PendingNotification,
} from '@/services/notification'

const svc = getNotificationService()

const busy = ref(false)
const permissionMsg = ref('')
const statusMsg = ref('')
const errorMsg = ref('')
const pending = ref<PendingNotification[]>([])
/** Monotonic-ish id counter within signed 32-bit; debug-only, not persisted. */
const nextId = ref(1000)

const platformLabel = computed(() => getNotificationPlatformLabel())

onMounted(() => {
  void onListPending()
})

async function withBusy(fn: () => Promise<void>): Promise<void> {
  busy.value = true
  errorMsg.value = ''
  try {
    await fn()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    busy.value = false
  }
}

async function onRequestPermission(): Promise<void> {
  await withBusy(async () => {
    const ok = await svc.requestPermission()
    permissionMsg.value = ok ? '已授权' : '未授权或被拒绝'
  })
}

async function scheduleIn(seconds: number, label: string): Promise<void> {
  await withBusy(async () => {
    const id = nextId.value++
    const triggerAt = addMs(new Date(), seconds * 1000)
    await svc.schedule({
      id,
      title: label,
      body: `调试通知 #${id} · ${dayjs(triggerAt).format('HH:mm:ss')}`,
      triggerAt,
    })
    statusMsg.value = `已调度 #${id} → ${dayjs(triggerAt).format('YYYY-MM-DD HH:mm:ss')}`
    await refreshPending()
  })
}

async function onCancelAll(): Promise<void> {
  await withBusy(async () => {
    await svc.cancelAll()
    await clearAllScheduled()
    await refreshPending()
    const left = pending.value.length
    statusMsg.value =
      left === 0
        ? '已取消全部待触发（OS+本地）'
        : `已尝试取消；OS 仍剩 ${left} 条（OEM 可能拦 cancel）`
  })
}

async function onListPending(): Promise<void> {
  await withBusy(async () => {
    await refreshPending()
    statusMsg.value = `待触发 ${pending.value.length} 条`
  })
}

async function refreshPending(): Promise<void> {
  pending.value = await svc.listPending()
}

function formatTrigger(at: Date | null): string {
  if (!at) return '（无触发时间）'
  return dayjs(at).format('YYYY-MM-DD HH:mm:ss')
}
</script>

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

    <v-card
      variant="outlined"
      class="mb-4"
    >
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

    <v-card
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>备份 / ICS</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-3">
          JSON 覆盖或合并导入；ICS 仅含事件提醒（不含课表）。
        </p>
        <v-btn
          color="primary"
          variant="tonal"
          :to="{ name: 'backup' }"
        >
          打开备份与导出
        </v-btn>
      </v-card-text>
    </v-card>

    <v-card
      v-if="showAutostart"
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>开机自启（桌面）</v-card-title>
      <v-card-text>
        <v-switch
          v-model="autostartOn"
          color="primary"
          label="登录系统后自动启动（托盘保活）"
          :loading="autostartBusy"
          @update:model-value="onToggleAutostart"
        />
        <div
          v-if="autostartMsg"
          class="text-caption"
        >
          {{ autostartMsg }}
        </div>
      </v-card-text>
    </v-card>

    <v-card
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>提醒收不到？</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-3">
          国产 Android 常需允许通知、精确闹钟、自启动与后台耗电白名单。详见
          <code>docs/android-oem-notifications.md</code>。
        </p>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!androidNative"
            @click="onOpenOemSettings"
          >
            尝试打开系统设置
          </v-btn>
          <v-btn
            variant="tonal"
            @click="oemExpanded = !oemExpanded"
          >
            {{ oemExpanded ? '收起说明' : '查看引导摘要' }}
          </v-btn>
        </div>
        <div
          v-if="oemMsg"
          class="text-caption mt-2"
        >
          {{ oemMsg }}
        </div>
        <v-expand-transition>
          <div
            v-if="oemExpanded"
            class="text-body-2 mt-3"
          >
            <ol class="ps-4">
              <li>系统设置 → 应用 → 日历 → 通知：全部允许</li>
              <li>「闹钟和提醒」/精确闹钟：允许</li>
              <li>自启动 / 后台运行：允许（各厂商名称不同）</li>
              <li>电池优化：不优化 / 无限制</li>
              <li>锁屏通知：允许显示</li>
            </ol>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>

    <v-card
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>外观</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-3">
          浅色 / 深色 / 跟随系统。完整设置分组将在后续步骤整理。
        </p>
        <v-btn-toggle
          v-model="themeMode"
          color="primary"
          rounded="lg"
          group
          mandatory
          @update:model-value="onThemeMode"
        >
          <v-btn
            value="system"
            variant="outlined"
          >
            跟随系统
          </v-btn>
          <v-btn
            value="light"
            variant="outlined"
          >
            浅色
          </v-btn>
          <v-btn
            value="dark"
            variant="outlined"
          >
            深色
          </v-btn>
        </v-btn-toggle>
      </v-card-text>
    </v-card>

    <v-card variant="outlined">
      <v-card-title>开发者选项</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-3">
          默认关闭。开启后可进入通知调试页（不在主导航展示）。
        </p>
        <v-switch
          v-model="devOn"
          color="primary"
          label="启用开发者选项"
          @update:model-value="onToggleDev"
        />
        <v-btn
          v-if="devOn"
          class="mt-2"
          variant="tonal"
          color="primary"
          :to="{ name: 'debug-notifications' }"
        >
          打开通知调试
        </v-btn>
        <div
          v-if="devMsg"
          class="text-caption mt-2"
        >
          {{ devMsg }}
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import {
  readThemeMode,
  resolveThemeName,
  writeThemeMode,
  type ThemeMode,
} from '@/components/themeMode'
import type { PeriodRow } from '@/domain/schemas'
import {
  getAutostartEnabled,
  setAutostartEnabled,
} from '@/services/platform/autostart'
import {
  isAndroidNative,
  isTauriDesktop,
  tryOpenAndroidReminderSettings,
} from '@/services/platform/oemNotifications'
import { useSemesterStore } from '@/stores/semester'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const semesterStore = useSemesterStore()
const theme = useTheme()
const themeMode = ref<ThemeMode>(readThemeMode())

function applyThemeFromMode(): void {
  theme.change(resolveThemeName(themeMode.value))
}

function onThemeMode(v: unknown): void {
  if (v !== 'system' && v !== 'light' && v !== 'dark') return
  themeMode.value = v
  writeThemeMode(v)
  applyThemeFromMode()
}

watch(themeMode, () => applyThemeFromMode())

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

const showAutostart = ref(false)
const autostartOn = ref(false)
const autostartBusy = ref(false)
const autostartMsg = ref('')

const androidNative = computed(() => isAndroidNative())
const oemExpanded = ref(false)
const oemMsg = ref('')

const devOn = ref(false)
const devMsg = ref('')

onMounted(async () => {
  await settings.load()
  themeMode.value = readThemeMode()
  applyThemeFromMode()
  time.value = settings.defaultRemindTime
  devOn.value = settings.developerMode
  await semesterStore.load()
  if (semesterStore.semester) {
    startMonday.value = semesterStore.semester.startMonday
    totalWeeks.value = semesterStore.semester.totalWeeks
  }
  periodDraft.value = semesterStore.periods.map((p) => ({ ...p }))

  showAutostart.value = isTauriDesktop()
  if (showAutostart.value) {
    try {
      autostartOn.value = await getAutostartEnabled()
    } catch {
      autostartOn.value = false
    }
  }
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

async function onToggleAutostart(v: boolean | null): Promise<void> {
  const on = Boolean(v)
  autostartBusy.value = true
  autostartMsg.value = ''
  try {
    await setAutostartEnabled(on)
    autostartMsg.value = on ? '已开启开机自启' : '已关闭开机自启'
  } catch (err) {
    autostartOn.value = !on
    autostartMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    autostartBusy.value = false
  }
}

async function onOpenOemSettings(): Promise<void> {
  oemMsg.value = ''
  const opened = await tryOpenAndroidReminderSettings()
  oemMsg.value = opened
    ? '已尝试打开系统「精确闹钟/通知」相关页'
    : '无法自动跳转，请按下方摘要或 docs/android-oem-notifications.md 手动设置'
  if (!opened) oemExpanded.value = true
}

async function onToggleDev(v: boolean | null): Promise<void> {
  const on = Boolean(v)
  try {
    await settings.saveDeveloperMode(on)
    devMsg.value = on ? '已开启：可通过下方入口进入调试页' : '已关闭开发者选项'
  } catch (err) {
    devOn.value = !on
    devMsg.value = err instanceof Error ? err.message : String(err)
  }
}
</script>

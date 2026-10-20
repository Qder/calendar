<template>
  <v-container
    class="settings-page py-4"
    style="max-width: 720px"
  >
    <header
      v-if="!isDesktop"
      class="mb-4"
    >
      <h1 class="text-h6 font-weight-bold mb-0">
        设置
      </h1>
    </header>

    <!-- 帮助 -->
    <section class="mb-4">
      <h2 class="settings-section__title">
        帮助
      </h2>
      <v-card
        variant="outlined"
        class="bg-surface"
      >
        <v-card-title class="text-subtitle-1">
          使用说明
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            月周视图、事项提醒、课表导入、备份与通知权限等，可在页内搜索。
          </p>
          <v-btn
            color="primary"
            variant="tonal"
            :to="{ name: 'help' }"
          >
            打开使用说明
          </v-btn>
        </v-card-text>
      </v-card>
    </section>

    <!-- 今天吃什么 -->
    <section class="mb-4">
      <h2 class="settings-section__title">
        今天吃什么
      </h2>
      <v-card
        variant="outlined"
        class="bg-surface"
      >
        <v-card-title class="text-subtitle-1">
          自建食物库
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            自己添加食物，再随机抽一个（本地存储，随备份导出）。
          </p>
          <v-btn
            color="primary"
            variant="tonal"
            :to="{ name: 'food' }"
          >
            打开「今天吃什么」
          </v-btn>
        </v-card-text>
      </v-card>
    </section>

    <!-- 提醒 -->
    <section class="mb-4">
      <h2 class="settings-section__title">
        提醒
      </h2>
      <v-card
        variant="outlined"
        class="bg-surface mb-3"
      >
        <v-card-title class="text-subtitle-1">
          默认提醒时刻
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            新建事件未指定提醒时，默认「事件前 1 天」的此时刻。
          </p>
          <v-text-field
            v-model="time"
            label="默认提醒时刻"
            type="time"
            class="mb-2"
            hide-details="auto"
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
        class="bg-surface mb-3"
      >
        <v-card-title class="text-subtitle-1">
          通知权限
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-3">
            当前状态：
            <span class="font-weight-medium">{{ permissionLabel }}</span>
          </p>
          <v-btn
            color="primary"
            variant="tonal"
            :loading="permissionBusy"
            @click="onRequestPermission"
          >
            请求通知权限
          </v-btn>
          <div
            v-if="permissionMsg"
            class="text-caption mt-2"
          >
            {{ permissionMsg }}
          </div>
        </v-card-text>
      </v-card>

      <v-card
        variant="outlined"
       class="bg-surface">
        <v-card-title class="text-subtitle-1">
          收不到提醒？
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            国产 Android 常需允许通知、精确闹钟、自启动与后台耗电白名单。详见
            <code>docs/android-oem-notifications.md</code>。
          </p>
          <v-alert
            v-if="scheduleAlert"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3"
            :title="'精确闹钟 / 调度提示'"
          >
            {{ scheduleAlert }}
            <div class="text-caption mt-1">
              精确闹钟状态：{{ exactAlarmLabel }}
            </div>
          </v-alert>
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
    </section>

    <!-- 学期 / 节次 -->
    <section class="mb-4">
      <h2 class="settings-section__title">
        学期与节次
      </h2>
      <v-card
        variant="outlined"
        class="bg-surface mb-3"
      >
        <v-card-title class="text-subtitle-1">
          学期
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            「第一周周一」必须是周一；总周数用于校验课表周次上界与周视图切周。
          </p>
          <v-text-field
            v-model="startMonday"
            label="第一周周一"
            type="date"
            class="mb-2"
            hide-details="auto"
          />
          <v-text-field
            v-model.number="totalWeeks"
            label="总周数"
            type="number"
            min="1"
            max="60"
            class="mb-2"
            hide-details="auto"
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
       class="bg-surface">
        <v-card-title class="d-flex align-center justify-space-between text-subtitle-1">
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
          <p class="text-body-2 text-medium-emphasis mb-3">
            只需改每节时长与各节开始时刻；结束时间自动计算（不允许跨天）。
          </p>
          <v-text-field
            v-model.number="periodDurationMin"
            label="每节时长（分钟）"
            type="number"
            min="1"
            max="180"
            class="mb-3"
            hide-details="auto"
            style="max-width: 220px"
            @update:model-value="onDurationChange"
          />
          <div
            v-for="(p, idx) in periodDraft"
            :key="p.index"
            class="d-flex flex-wrap ga-2 mb-2 align-center"
          >
            <span
              class="text-caption tabular-nums"
              style="width: 48px"
            >第{{ p.index }}节</span>
            <v-text-field
              v-model="periodDraft[idx].start"
              label="开始"
              type="time"
              density="compact"
              hide-details
              style="max-width: 140px"
              @update:model-value="() => onPeriodStartChange(idx)"
            />
            <v-text-field
              :model-value="periodDraft[idx].end"
              label="结束（自动）"
              type="time"
              density="compact"
              hide-details
              readonly
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
    </section>

    <!-- 数据 -->
    <section class="mb-4">
      <h2 class="settings-section__title">
        数据
      </h2>
      <v-card
        variant="outlined"
       class="bg-surface">
        <v-card-title class="text-subtitle-1">
          备份与导出
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            JSON 覆盖或合并导入；ICS 仅含事件提醒（不含课表）。
          </p>
          <div class="d-flex flex-wrap ga-2 mb-3">
            <v-btn
              color="primary"
              variant="flat"
              :loading="exportingJson"
              @click="onExportJson"
            >
              导出备份
            </v-btn>
            <v-btn
              variant="tonal"
              :to="{ name: 'backup' }"
            >
              导入备份
            </v-btn>
            <v-btn
              variant="tonal"
              :loading="exportingIcs"
              @click="onExportIcs"
            >
              导出 ICS
            </v-btn>
            <v-btn
              variant="tonal"
              @click="onDownloadTemplate"
            >
              下载模板
            </v-btn>
          </div>
          <div
            v-if="dataMsg"
            class="text-caption"
          >
            {{ dataMsg }}
          </div>
        </v-card-text>
      </v-card>
    </section>

    <!-- 外观 -->
    <section class="mb-4">
      <h2 class="settings-section__title">
        外观
      </h2>
      <v-card
        variant="outlined"
       class="bg-surface">
        <v-card-title class="text-subtitle-1">
          主题
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            浅色 / 深色 / 跟随系统。
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
    </section>

    <!-- 桌面自启（条件） -->
    <section
      v-if="showAutostart"
      class="mb-4"
    >
      <h2 class="settings-section__title">
        桌面
      </h2>
      <v-card
        variant="outlined"
       class="bg-surface">
        <v-card-title class="text-subtitle-1">
          开机自启
        </v-card-title>
        <v-card-text>
          <v-switch
            v-model="autostartOn"
            color="primary"
            label="登录系统后自动启动（托盘保活）"
            :loading="autostartBusy"
            hide-details
            @update:model-value="onToggleAutostart"
          />
          <div
            v-if="autostartMsg"
            class="text-caption mt-2"
          >
            {{ autostartMsg }}
          </div>
        </v-card-text>
      </v-card>
    </section>

    <!-- 关于 -->
    <section class="mb-4">
      <h2 class="settings-section__title">
        关于
      </h2>
      <v-card
        variant="outlined"
        class="bg-surface mb-3"
      >
        <v-card-title class="text-subtitle-1">
          日历
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-1">
            版本 {{ appVersion }}
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            本地课表与事项提醒（课设）
          </p>
        </v-card-text>
      </v-card>

      <v-card
        variant="outlined"
       class="bg-surface">
        <v-card-title class="text-subtitle-1">
          开发者选项
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            默认关闭。开启后可进入通知调试页（不在主导航展示）。
          </p>
          <v-switch
            v-model="devOn"
            color="primary"
            label="启用开发者选项"
            hide-details
            @update:model-value="onToggleDev"
          />
          <v-btn
            v-if="devOn"
            class="mt-3"
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
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import {
  readThemeMode,
  resolveThemeName,
  writeThemeMode,
  type ThemeMode,
} from '@/components/themeMode'
import {
  applyPeriodDuration,
  DEFAULT_PERIOD_DURATION_MIN,
  endHmFromStart,
  inferPeriodDurationMinutes,
} from '@/domain/periods'
import type { PeriodRow } from '@/domain/schemas'
import { downloadBackupJson } from '@/services/backup'
import { downloadIcs } from '@/services/backup/exportIcs'
import { downloadCourseTemplate } from '@/services/importer/template'
import { getNotificationService } from '@/services/notification'
import {
  getAutostartEnabled,
  setAutostartEnabled,
} from '@/services/platform/autostart'
import {
  isAndroidNative,
  isTauriDesktop,
  tryOpenAndroidReminderSettings,
} from '@/services/platform/oemNotifications'
import { refreshExactAlarmStatus } from '@/services/platform/exactAlarm'
import {
  getScheduleHealth,
  scheduleHealthAlertText,
  subscribeScheduleHealth,
  type ExactAlarmState,
} from '@/services/notification/scheduleHealth'
import { useSemesterStore } from '@/stores/semester'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const semesterStore = useSemesterStore()
const theme = useTheme()
const display = useDisplay()
const isDesktop = computed(() => display.mdAndUp.value)

const appVersion = '0.1.0'
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
const periodDurationMin = ref(DEFAULT_PERIOD_DURATION_MIN)
const savingPeriods = ref(false)
const periodMsg = ref('')

function recomputeAllEnds(): void {
  try {
    periodDraft.value = applyPeriodDuration(
      periodDraft.value,
      Number(periodDurationMin.value),
    ) as PeriodRow[]
    periodMsg.value = ''
  } catch (err) {
    periodMsg.value = err instanceof Error ? err.message : String(err)
  }
}

function onDurationChange(): void {
  recomputeAllEnds()
}

function onPeriodStartChange(idx: number): void {
  const row = periodDraft.value[idx]
  if (!row) return
  try {
    row.end = endHmFromStart(row.start, Number(periodDurationMin.value))
    periodMsg.value = ''
  } catch (err) {
    periodMsg.value = err instanceof Error ? err.message : String(err)
  }
}

const showAutostart = ref(false)
const autostartOn = ref(false)
const autostartBusy = ref(false)
const autostartMsg = ref('')

const androidNative = computed(() => isAndroidNative())
const oemExpanded = ref(false)
const oemMsg = ref('')
const exactAlarm = ref<ExactAlarmState>('unknown')
const scheduleAlert = ref<string | null>(null)

function syncScheduleHealth(): void {
  const snap = getScheduleHealth()
  exactAlarm.value = snap.exactAlarm
  scheduleAlert.value = scheduleHealthAlertText(snap)
}

const exactAlarmLabel = computed(() => {
  switch (exactAlarm.value) {
    case 'granted':
      return '已允许'
    case 'denied':
      return '未允许'
    case 'prompt':
      return '待确认'
    case 'unsupported':
      return '本平台不适用'
    default:
      return '未知 / 未检测'
  }
})

let unsubHealth: (() => void) | null = null

const permissionLabel = ref('检测中…')
const permissionBusy = ref(false)
const permissionMsg = ref('')

const exportingJson = ref(false)
const exportingIcs = ref(false)
const dataMsg = ref('')

const devOn = ref(false)
const devMsg = ref('')

function readPermissionLabel(): string {
  if (typeof globalThis.Notification === 'undefined') return '当前环境无系统通知 API'
  const p = globalThis.Notification.permission
  if (p === 'granted') return '已授权'
  if (p === 'denied') return '已拒绝'
  return '未请求'
}

onMounted(async () => {
  await settings.load()
  themeMode.value = readThemeMode()
  applyThemeFromMode()
  time.value = settings.defaultRemindTime
  devOn.value = settings.developerMode
  permissionLabel.value = readPermissionLabel()
  await semesterStore.load()
  if (semesterStore.semester) {
    startMonday.value = semesterStore.semester.startMonday
    totalWeeks.value = semesterStore.semester.totalWeeks
  }
  periodDraft.value = semesterStore.periods.map((p) => ({ ...p }))
  periodDurationMin.value = inferPeriodDurationMinutes(periodDraft.value)

  showAutostart.value = isTauriDesktop()
  if (showAutostart.value) {
    try {
      autostartOn.value = await getAutostartEnabled()
    } catch {
      autostartOn.value = false
    }
  }

  syncScheduleHealth()
  unsubHealth = subscribeScheduleHealth(() => syncScheduleHealth())
  try {
    await refreshExactAlarmStatus()
  } catch {
    /* non-fatal */
  }
  syncScheduleHealth()
})

onUnmounted(() => {
  unsubHealth?.()
  unsubHealth = null
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

async function onRequestPermission(): Promise<void> {
  permissionBusy.value = true
  permissionMsg.value = ''
  try {
    const ok = await getNotificationService().requestPermission()
    permissionLabel.value = readPermissionLabel()
    permissionMsg.value = ok ? '已授权' : '未授权或被拒绝'
  } catch (err) {
    permissionMsg.value = err instanceof Error ? err.message : String(err)
    permissionLabel.value = readPermissionLabel()
  } finally {
    permissionBusy.value = false
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
    const next = applyPeriodDuration(
      periodDraft.value,
      Number(periodDurationMin.value),
    ) as PeriodRow[]
    periodDraft.value = next.map((p) => ({ ...p }))
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
  periodDurationMin.value = inferPeriodDurationMinutes(periodDraft.value)
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
  try {
    await refreshExactAlarmStatus()
  } catch {
    /* ignore */
  }
  syncScheduleHealth()
}

async function onExportJson(): Promise<void> {
  exportingJson.value = true
  dataMsg.value = ''
  try {
    const p = await downloadBackupJson()
    dataMsg.value = `已导出备份（事件 ${p.events.length} / 规则 ${p.reminderRules.length} / 课 ${p.courses.length} / 食物 ${p.foods.length}）`
  } catch (err) {
    dataMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    exportingJson.value = false
  }
}

async function onExportIcs(): Promise<void> {
  exportingIcs.value = true
  dataMsg.value = ''
  try {
    await downloadIcs()
    dataMsg.value = '已开始下载 ICS'
  } catch (err) {
    dataMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    exportingIcs.value = false
  }
}

function onDownloadTemplate(): void {
  dataMsg.value = ''
  try {
    downloadCourseTemplate()
    dataMsg.value = '已开始下载课表导入模板'
  } catch (err) {
    dataMsg.value = err instanceof Error ? err.message : String(err)
  }
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

<style scoped>
.settings-section__title {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0 0 8px 4px;
}

.settings-page :deep(.v-card) {
  border-radius: var(--radius-card) !important;
}
</style>

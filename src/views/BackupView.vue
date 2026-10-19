<template>
  <v-container
    class="py-4"
    style="max-width: 720px"
  >
    <div class="d-flex align-center mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :to="{ name: 'settings' }"
      />
      <div class="text-h6 ms-2">
        备份与导出
      </div>
    </div>

    <v-alert
      type="info"
      variant="tonal"
      class="mb-4"
    >
      JSON 备份含事件、提醒规则、设置、课表与学期；导入后会重建通知窗口。
      ICS 仅导出事件与 VALARM，不含课表。
    </v-alert>

    <v-card
      variant="outlined"
      class="mb-4"
    >
      <v-card-title>JSON 备份</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-btn
            color="primary"
            variant="flat"
            :loading="exporting"
            @click="onExportJson"
          >
            导出 JSON
          </v-btn>
          <v-btn
            variant="tonal"
            @click="fileInput?.click()"
          >
            选择备份文件
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="d-none"
            @change="onPickFile"
          >
        </div>
        <div
          v-if="pickedName"
          class="text-body-2 mb-2"
        >
          已选：{{ pickedName }}
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!pendingText || importing"
            :loading="importing"
            @click="onImport('overwrite')"
          >
            覆盖导入
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            :disabled="!pendingText || importing"
            :loading="importing"
            @click="onImport('merge')"
          >
            合并导入
          </v-btn>
        </div>
        <div
          v-if="jsonMsg"
          class="text-caption mt-2"
        >
          {{ jsonMsg }}
        </div>
      </v-card-text>
    </v-card>

    <v-card variant="outlined">
      <v-card-title>ICS 导出</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-3">
          生成标准日历文件（VEVENT + VALARM）。课表不会写入 ICS。
        </p>
        <v-btn
          color="primary"
          variant="flat"
          :loading="exportingIcs"
          @click="onExportIcs"
        >
          导出 ICS
        </v-btn>
        <div
          v-if="icsMsg"
          class="text-caption mt-2"
        >
          {{ icsMsg }}
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  downloadBackupJson,
  importBackupJsonText,
  type BackupImportMode,
} from '@/services/backup'
import { downloadIcs } from '@/services/backup/exportIcs'

const fileInput = ref<{ click: () => void; value: string; files: { item: (i: number) => { text: () => Promise<string> } | null } | null } | null>(null)
const pendingText = ref('')
const pickedName = ref('')
const exporting = ref(false)
const importing = ref(false)
const exportingIcs = ref(false)
const jsonMsg = ref('')
const icsMsg = ref('')

async function onExportJson(): Promise<void> {
  exporting.value = true
  jsonMsg.value = ''
  try {
    const p = await downloadBackupJson()
    jsonMsg.value = `已导出（事件 ${p.events.length} / 规则 ${p.reminderRules.length} / 课 ${p.courses.length}）`
  } catch (err) {
    jsonMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    exporting.value = false
  }
}

async function onPickFile(ev: { target: unknown }): Promise<void> {
  jsonMsg.value = ''
  pendingText.value = ''
  pickedName.value = ''
  const input = ev.target as {
    files?: { item: (i: number) => { name: string; text: () => Promise<string> } | null } | null
    value: string
  } | null
  const file = input?.files?.item(0) ?? null
  if (input) input.value = ''
  if (!file) return
  pickedName.value = file.name
  pendingText.value = await file.text()
}

async function onImport(mode: BackupImportMode): Promise<void> {
  if (!pendingText.value) return
  importing.value = true
  jsonMsg.value = ''
  try {
    const stats = await importBackupJsonText(pendingText.value, mode)
    jsonMsg.value =
      mode === 'overwrite'
        ? `已覆盖导入：事件 ${stats.events}，规则 ${stats.rules}，课 ${stats.courses}（已 rebuild 通知）`
        : `已合并导入：事件 ${stats.events}，规则 ${stats.rules}，课 ${stats.courses}（已 rebuild 通知）`
  } catch (err) {
    jsonMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    importing.value = false
  }
}

async function onExportIcs(): Promise<void> {
  exportingIcs.value = true
  icsMsg.value = ''
  try {
    await downloadIcs()
    icsMsg.value = '已开始下载 ICS'
  } catch (err) {
    icsMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    exportingIcs.value = false
  }
}
</script>

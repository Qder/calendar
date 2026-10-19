<template>
  <v-container
    class="py-4"
    style="max-width: 960px"
  >
    <div class="d-flex align-center mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :to="{ name: 'week' }"
      />
      <div class="text-h6 ms-2">
        导入课表
      </div>
    </div>

    <v-alert
      type="info"
      variant="tonal"
      class="mb-4"
    >
      支持：① 模板列 课程名|星期|开始节|结束节|周次|教室|教师；② 教务「个人课程表」HTML/.xls 网格（含 rowspan、GBK）。
      周次：`1-16`、`双6-8,15周`、`单1-16`、`单周`/`双周`（拒后缀 `1-16单`，见 AGENTS.md）。
      总周数须 ≥ 课表最大周（默认 16 时，周次含 17 的行会标红，请先在设置里调高总周数）。
    </v-alert>

    <v-alert
      v-if="!semesterReady"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      请先在设置中配置学期（第一周周一 + 总周数），否则无法校验周次上界。
    </v-alert>

    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-btn
        variant="tonal"
        @click="onDownloadTemplate"
      >
        下载模板
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :disabled="!semesterReady"
        @click="fileInput?.click()"
      >
        选择文件
      </v-btn>
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls,.html,text/html"
        class="d-none"
        @change="onFile"
      >
    </div>

    <v-alert
      v-if="parseError"
      type="error"
      variant="tonal"
      class="mb-4"
      :text="parseError"
    />

    <template v-if="preview.length">
      <div class="text-subtitle-2 mb-2">
        预览：{{ okCount }} 行可用 / {{ preview.length }} 行
      </div>
      <v-alert
        v-if="errCount > 0 && okCount > 0"
        type="warning"
        variant="tonal"
        class="mb-3"
        density="compact"
      >
        将跳过 {{ errCount }} 行错误，仅提交 {{ okCount }} 行 OK。
      </v-alert>
      <v-alert
        v-else-if="errCount > 0 && okCount === 0"
        type="error"
        variant="tonal"
        class="mb-3"
        density="compact"
      >
        全部 {{ errCount }} 行均有错误，无法导入。
      </v-alert>
      <v-table
        density="compact"
        class="mb-4"
      >
        <thead>
          <tr>
            <th>行</th>
            <th>课程名</th>
            <th>星期</th>
            <th>节次</th>
            <th>周次</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in preview"
            :key="row.rowNumber"
            :class="{ 'row-err': !row.ok }"
          >
            <td>{{ row.rowNumber }}</td>
            <template v-if="row.ok">
              <td>{{ row.draft.name }}</td>
              <td>{{ row.draft.weekday }}</td>
              <td>{{ row.draft.startPeriod }}-{{ row.draft.endPeriod }}</td>
              <td>{{ row.weeks.join(',') }}</td>
              <td class="text-success">
                OK
              </td>
            </template>
            <template v-else>
              <td colspan="4">
                {{ summarizeRaw(row.raw) }}
              </td>
              <td class="text-error">
                {{ row.errors.join('；') }}
              </td>
            </template>
          </tr>
        </tbody>
      </v-table>

      <div class="d-flex flex-wrap ga-2">
        <v-btn
          color="primary"
          variant="flat"
          :disabled="okCount === 0 || committing"
          :loading="committing"
          @click="onCommit('overwrite')"
        >
          覆盖导入
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :disabled="okCount === 0 || committing"
          :loading="committing"
          @click="onCommit('append')"
        >
          追加导入
        </v-btn>
      </div>
      <div
        v-if="commitMsg"
        class="text-caption mt-2"
      >
        {{ commitMsg }}
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ImportMode } from '@/services/importer/commit'
import { parseCourseWorkbook } from '@/services/importer/parseWorkbook'
import {
  previewCourseRows,
  type PreviewRow,
} from '@/services/importer/preview'
import { downloadCourseTemplate } from '@/services/importer/template'
import { useCoursesStore } from '@/stores/courses'
import { useSemesterStore } from '@/stores/semester'

const router = useRouter()
const courses = useCoursesStore()
const semesterStore = useSemesterStore()

const fileInput = ref<{ click: () => void; files: { item: (i: number) => { arrayBuffer: () => Promise<ArrayBuffer> } | null; length: number } | null; value: string } | null>(null)
const preview = ref<PreviewRow[]>([])
const parseError = ref('')
const committing = ref(false)
const commitMsg = ref('')

const semesterReady = computed(() => Boolean(semesterStore.semester))
const okCount = computed(() => preview.value.filter((p) => p.ok).length)
const errCount = computed(() => preview.value.filter((p) => !p.ok).length)

onMounted(async () => {
  await semesterStore.load()
})

function onDownloadTemplate(): void {
  downloadCourseTemplate()
}

async function onFile(ev: { target: unknown }): Promise<void> {
  parseError.value = ''
  commitMsg.value = ''
  preview.value = []
  const input = ev.target as {
    files?: { item: (i: number) => { arrayBuffer: () => Promise<ArrayBuffer> } | null; length: number } | null
    value: string
  } | null
  const file = input?.files?.item(0) ?? null
  if (input) input.value = ''
  if (!file) return
  if (!semesterStore.semester) {
    parseError.value = '请先配置学期'
    return
  }
  try {
    const buf = await file.arrayBuffer()
    const raw = parseCourseWorkbook(buf)
    const periodIndices = semesterStore.periods.map((p) => p.index)
    preview.value = previewCourseRows(
      raw,
      semesterStore.semester.totalWeeks,
      periodIndices,
    )
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : String(err)
  }
}

function summarizeRaw(raw: Record<string, unknown>): string {
  return ['课程名', '星期', '周次']
    .map((k) => `${k}=${raw[k] ?? ''}`)
    .join(' ')
}

async function onCommit(mode: ImportMode): Promise<void> {
  const okRows = preview.value.filter((p): p is Extract<PreviewRow, { ok: true }> => p.ok)
  if (okRows.length === 0) return
  committing.value = true
  commitMsg.value = ''
  try {
    const n = await courses.importOkRows(okRows, mode)
    commitMsg.value = mode === 'overwrite' ? `已覆盖导入 ${n} 门课` : `已追加 ${n} 门课`
    await router.push({ name: 'week' })
  } catch (err) {
    commitMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    committing.value = false
  }
}
</script>

<style scoped>
.row-err {
  background: rgba(var(--v-theme-error), 0.08);
}
.text-error {
  color: rgb(var(--v-theme-error));
}
.text-success {
  color: rgb(var(--v-theme-success));
}
</style>

<template>
  <v-container
    class="help-page py-4"
    style="max-width: 720px"
  >
    <div class="d-flex align-center mb-3">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        aria-label="返回设置"
        :to="{ name: 'settings' }"
      />
      <h1 class="text-h6 font-weight-bold mb-0 ms-1">
        使用说明
      </h1>
    </div>

    <v-text-field
      v-model="query"
      label="搜索说明"
      placeholder="例如：提醒、导入、备份"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details="auto"
      class="mb-4"
      autocomplete="off"
    />

    <v-alert
      v-if="filtered.length === 0"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      没有匹配「{{ query.trim() }}」的说明，换个关键词试试。
    </v-alert>

    <v-expansion-panels
      v-else
      variant="accordion"
      multiple
    >
      <v-expansion-panel
        v-for="sec in filtered"
        :key="sec.id"
        :value="sec.id"
      >
        <v-expansion-panel-title class="font-weight-medium">
          {{ sec.title }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <p
            v-for="(line, i) in sec.body.split('\n')"
            :key="i"
            class="text-body-2 mb-2"
            style="white-space: pre-wrap"
          >
            {{ line }}
          </p>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { HELP_SECTIONS, filterHelpSections } from '@/domain/helpContent'

const query = ref('')
const filtered = computed(() => filterHelpSections(query.value, HELP_SECTIONS))
</script>

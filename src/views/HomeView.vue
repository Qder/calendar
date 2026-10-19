<template>
  <v-container
    class="py-6"
    style="max-width: 720px"
  >
    <v-card variant="outlined">
      <v-card-title class="text-h6">
        事项
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          分组列表将在后续步骤完善。当前可从月视图查看当天事项，或直接新建。
        </p>
        <p class="text-caption text-medium-emphasis mb-4">
          平台：{{ platform }}
        </p>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            color="primary"
            variant="flat"
            :to="{ name: 'event-new' }"
          >
            新建事项
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            :to="{ name: 'month' }"
          >
            打开月视图
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { detectAppPlatform } from '@/domain/platform'

const platform = computed(() => detectAppPlatform())
</script>

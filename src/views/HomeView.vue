<template>
  <v-container
    class="py-8"
    style="max-width: 640px"
  >
    <v-card variant="outlined">
      <v-card-title class="text-h5">
        Hello
      </v-card-title>
      <v-card-text>
        <p class="text-body-1 mb-2">
          本地优先个人日历 · 阶段 2 事件与月视图
        </p>
        <p class="text-body-2 mb-4">
          当前平台：<strong>{{ platform }}</strong>
        </p>
        <v-btn
          color="primary"
          variant="flat"
          class="me-2 mb-2"
          :to="{ name: 'month' }"
        >
          月视图
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          class="me-2 mb-2"
          :to="{ name: 'debug-notifications' }"
        >
          通知调试页
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { detectAppPlatform } from '@/domain/platform'

const platform = computed(() => detectAppPlatform())
</script>

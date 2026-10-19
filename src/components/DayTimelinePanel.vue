<template>
  <v-card
    class="day-panel"
    variant="flat"
    color="surface"
  >
    <v-card-title class="day-panel__title text-subtitle-1 font-weight-medium px-4 pt-4 pb-2">
      {{ title }}
    </v-card-title>

    <!-- 有条目时优先展示（含课程）；loading/error 不整块盖住 -->
    <v-skeleton-loader
      v-if="loading && !items.length"
      type="list-item-two-line@3"
      class="mx-2"
    />

    <v-alert
      v-if="error && !loading"
      type="error"
      variant="tonal"
      class="ma-4"
      :class="{ 'mb-2': items.length }"
      :text="error"
    >
      <template #append>
        <v-btn
          variant="text"
          size="small"
          aria-label="重试加载"
          @click="emit('retry')"
        >
          重试
        </v-btn>
      </template>
    </v-alert>

    <div
      v-if="!loading && !items.length && !error"
      class="day-panel__empty px-4 pb-4"
    >
      <p class="text-body-2 text-medium-emphasis mb-3">
        这一天还没有事项或课程
      </p>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        :to="{ name: 'event-new', query: { date: dateYmd } }"
      >
        添加事项
      </v-btn>
    </div>

    <v-list
      v-if="items.length"
      class="py-0 px-1"
      :class="{ 'pb-2': Boolean(error) }"
      lines="two"
    >
      <v-list-item
        v-for="item in items"
        :key="item.key"
        :to="{ name: item.routeName, params: { id: item.routeId } }"
        class="day-panel__item"
        rounded="lg"
        min-height="48"
      >
        <template #prepend>
          <span
            class="day-panel__bar"
            :style="barStyle(item)"
            aria-hidden="true"
          />
        </template>
        <v-list-item-title class="text-body-2 font-weight-medium">
          {{ item.title }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          <span class="me-1">{{ item.kind === 'course' ? '课程' : '事项' }}</span>
          · {{ item.subtitle }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import type { MonthDayItem } from '@/components/monthDayItems'

defineProps<{
  title: string
  dateYmd: string
  items: MonthDayItem[]
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{ retry: [] }>()

function barStyle(item: MonthDayItem): Record<string, string> {
  const color = item.colorIsCssVar
    ? `rgb(var(${item.color}))`
    : item.color
  return { backgroundColor: color }
}
</script>

<style scoped>
.day-panel {
  border-radius: var(--radius-card);
  border: 1px solid rgb(var(--v-theme-outline));
}

.day-panel__title {
  line-height: 1.4;
  word-break: break-word;
}

.day-panel__item {
  min-height: 48px;
}

.day-panel__bar {
  width: 4px;
  align-self: stretch;
  border-radius: 2px;
  margin-inline-end: 12px;
  min-height: 36px;
}

.day-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>

<template>
  <v-container
    class="home-page py-4"
    style="max-width: 720px"
  >
    <header
      v-if="!isDesktop"
      class="home-header mb-4"
    >
      <h1 class="text-h6 font-weight-bold mb-0">
        事项
      </h1>
      <p class="text-caption text-medium-emphasis mb-0">
        按时间分组浏览
      </p>
    </header>

    <v-skeleton-loader
      v-if="loading"
      type="list-item-two-line@4"
      class="home-skeleton"
      aria-busy="true"
      aria-label="加载事项中"
    />

    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      :text="error"
    >
      <template #append>
        <v-btn
          variant="text"
          size="small"
          aria-label="重试加载"
          @click="reload"
        >
          重试
        </v-btn>
      </template>
    </v-alert>

    <div
      v-else-if="totalCount === 0"
      class="home-empty"
    >
      <v-card
        variant="outlined"
        class="bg-surface pa-6 text-center"
      >
        <v-icon
          icon="mdi-checkbox-marked-outline"
          size="40"
          color="primary"
          class="mb-3"
        />
        <p class="text-body-1 font-weight-medium mb-2">
          还没有事项
        </p>
        <p class="text-body-2 text-medium-emphasis mb-4">
          新建一条，或从月视图点某一天添加。
        </p>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          :to="{ name: 'event-new' }"
        >
          新建事项
        </v-btn>
      </v-card>
    </div>

    <div
      v-else
      class="home-groups d-flex flex-column ga-4"
    >
      <section
        v-for="group in visibleGroups"
        :key="group.key"
        class="home-group"
      >
        <h2 class="home-group__title text-subtitle-2 text-medium-emphasis mb-2 px-1">
          {{ group.label }}
          <span class="tabular-nums">（{{ group.items.length }}）</span>
        </h2>
        <v-card
          variant="outlined"
          class="bg-surface home-group__card"
        >
          <v-list
            class="py-1"
            lines="two"
          >
            <v-list-item
              v-for="row in group.items"
              :key="row.key"
              :to="{ name: 'event-edit', params: { id: row.eventId } }"
              class="home-row"
              rounded="lg"
              min-height="56"
              :aria-label="`${row.title}，${row.dateLabel}，${row.timeLabel}，${row.reminderSummary}`"
            >
              <template #prepend>
                <div class="home-row__date tabular-nums text-caption text-medium-emphasis me-3">
                  <div>{{ row.dateLabel }}</div>
                  <div>{{ row.timeLabel }}</div>
                </div>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">
                {{ row.title }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ row.reminderSummary }}
              </v-list-item-subtitle>
              <template #append>
                <v-icon
                  icon="mdi-chevron-right"
                  size="small"
                  class="text-medium-emphasis"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </section>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import {
  buildEventListGroups,
  countGroupedItems,
  type EventListGroup,
} from '@/components/eventListGroups'
import type { ReminderRule } from '@/domain/schemas'
import { useEventsStore } from '@/stores/events'

const events = useEventsStore()
const display = useDisplay()
const isDesktop = computed(() => display.mdAndUp.value)

const loading = ref(true)
const error = ref<string | null>(null)
const groups = ref<EventListGroup[]>([])

const totalCount = computed(() => countGroupedItems(groups.value))
const visibleGroups = computed(() => groups.value.filter((g) => g.items.length > 0))

async function reload(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    await events.refresh()
    const rulesByEventId = new Map<string, ReminderRule[]>()
    await Promise.all(
      events.items.map(async (ev) => {
        const rules = await events.loadRules(ev.id)
        rulesByEventId.set(ev.id, rules)
      }),
    )
    groups.value = buildEventListGroups(events.items, rulesByEventId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    groups.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.home-skeleton {
  border-radius: var(--radius-card);
  border: 1px solid rgb(var(--v-theme-outline));
  overflow: hidden;
}

.home-group__card {
  border-radius: var(--radius-card) !important;
}

.home-row {
  min-height: 56px;
}

.home-row__date {
  min-width: 7.5rem;
  line-height: 1.35;
  text-align: start;
}

.home-empty .v-card {
  border-radius: var(--radius-card) !important;
}
</style>

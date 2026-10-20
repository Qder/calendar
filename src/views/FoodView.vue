<template>
  <v-container
    class="food-page py-4"
    style="max-width: 640px"
  >
    <div class="d-flex align-center mb-3">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        aria-label="返回设置"
        :to="{ name: 'settings' }"
      />
      <h1 class="text-h6 font-weight-bold mb-0 ms-1">
        今天吃什么
      </h1>
    </div>

    <v-alert
      v-if="picked"
      type="success"
      variant="tonal"
      class="mb-4"
      title="抽中了"
    >
      <span class="text-h6 font-weight-bold">{{ picked.name }}</span>
    </v-alert>

    <v-btn
      block
      color="primary"
      variant="flat"
      size="large"
      class="mb-4"
      prepend-icon="mdi-dice-5"
      :disabled="busy"
      @click="onPick"
    >
      随机选一个
    </v-btn>

    <v-card
      variant="outlined"
      class="bg-surface mb-4"
    >
      <v-card-title class="text-subtitle-1">
        添加食物
      </v-card-title>
      <v-card-text>
        <div class="d-flex ga-2 align-start">
          <v-text-field
            v-model="draft"
            label="名称"
            placeholder="例如：番茄炒蛋"
            hide-details="auto"
            class="flex-grow-1"
            autocomplete="off"
            :disabled="busy"
            @keyup.enter="onAdd"
          />
          <v-btn
            color="primary"
            variant="tonal"
            :loading="busy"
            @click="onAdd"
          >
            添加
          </v-btn>
        </div>
        <div
          v-if="formMsg"
          class="text-caption mt-2"
          :class="formMsgError ? 'text-error' : 'text-medium-emphasis'"
        >
          {{ formMsg }}
        </div>
      </v-card-text>
    </v-card>

    <v-card
      variant="outlined"
      class="bg-surface"
    >
      <v-card-title class="text-subtitle-1">
        我的列表（{{ items.length }}）
      </v-card-title>
      <v-card-text v-if="items.length === 0">
        <p class="text-body-2 text-medium-emphasis mb-0">
          还没有食物，先添加几样再随机。
        </p>
      </v-card-text>
      <v-list
        v-else
        density="comfortable"
      >
        <v-list-item
          v-for="f in items"
          :key="f.id"
          :title="f.name"
          :class="{ 'food-item--picked': picked?.id === f.id }"
        >
          <template #append>
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              aria-label="删除"
              :disabled="busy"
              @click="onDelete(f.id)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <v-snackbar
      v-model="snackOpen"
      :timeout="2500"
      color="warning"
    >
      {{ snackText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { addFood, deleteFood, listFoods } from '@/db/repos/foods'
import { pickRandomFood } from '@/domain/foodPick'
import type { FoodRow } from '@/domain/schemas'

const items = ref<FoodRow[]>([])
const draft = ref('')
const picked = ref<FoodRow | null>(null)
const busy = ref(false)
const formMsg = ref('')
const formMsgError = ref(false)
const snackOpen = ref(false)
const snackText = ref('')

async function refresh(): Promise<void> {
  items.value = await listFoods()
}

onMounted(() => {
  void refresh()
})

async function onAdd(): Promise<void> {
  formMsg.value = ''
  formMsgError.value = false
  busy.value = true
  try {
    await addFood(draft.value)
    draft.value = ''
    formMsg.value = '已添加'
    await refresh()
  } catch (err) {
    formMsgError.value = true
    formMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    busy.value = false
  }
}

async function onDelete(id: string): Promise<void> {
  busy.value = true
  try {
    await deleteFood(id)
    if (picked.value?.id === id) picked.value = null
    await refresh()
  } catch (err) {
    snackText.value = err instanceof Error ? err.message : String(err)
    snackOpen.value = true
  } finally {
    busy.value = false
  }
}

function onPick(): void {
  const hit = pickRandomFood(items.value)
  if (!hit) {
    picked.value = null
    snackText.value = '列表是空的，先添加几种食物再抽'
    snackOpen.value = true
    return
  }
  picked.value = hit
}
</script>

<style scoped>
.food-item--picked {
  background: rgba(var(--v-theme-primary), 0.12);
}
</style>

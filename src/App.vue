<template>
  <v-app :theme="resolvedTheme">
    <!-- 桌面：左侧窄导航（≥960）；平板与手机共用底栏 -->
    <v-navigation-drawer
      v-if="isDesktop"
      permanent
      width="200"
      color="surface"
      class="app-side-nav app-shell-nav border-e"
      :elevation="0"
    >
      <div class="px-4 py-4 text-h6 font-weight-bold">
        日历
      </div>
      <v-list
        nav
        density="comfortable"
        :selected="[currentTab]"
        color="primary"
      >
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :prepend-icon="item.icon"
          :title="item.label"
          :value="item.to"
          :to="{ name: item.to }"
          :active="currentTab === item.to"
          rounded="lg"
        />
      </v-list>
      <template #append>
        <div class="pa-3">
          <v-btn
            block
            variant="tonal"
            color="primary"
            :prepend-icon="themeIcon"
            :aria-label="`外观：${themeModeLabel(themeMode)}`"
            @click="cycleThemeMode"
          >
            {{ themeModeLabel(themeMode) }}
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- 桌面页头：非主色大栏，右侧新建 -->
    <v-app-bar
      v-if="isDesktop"
      flat
      color="surface"
      class="app-shell-nav border-b"
      density="comfortable"
    >
      <v-app-bar-title class="text-body-1 font-weight-medium">
        {{ pageTitle }}
      </v-app-bar-title>
      <template #append>
        <v-btn
          v-if="showDesktopNew"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          class="me-2"
          :to="{ name: 'event-new' }"
        >
          新建事项
        </v-btn>
        <v-btn
          :icon="themeIcon"
          variant="text"
          :aria-label="`切换外观，当前：${themeModeLabel(themeMode)}`"
          @click="cycleThemeMode"
        />
      </template>
    </v-app-bar>

    <v-main
      class="app-shell-main"
      :class="{ 'app-main--with-bottom-nav': !isDesktop }"
    >
      <router-view />
    </v-main>

    <!-- 手机/平板：底部 4 项 -->
    <v-bottom-navigation
      v-if="!isDesktop"
      v-model="bottomTab"
      color="primary"
      bg-color="surface"
      class="app-bottom-nav app-shell-nav border-t"
      grow
      :elevation="4"
    >
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :value="item.to"
        :to="{ name: item.to }"
        :aria-label="item.label"
      >
        <v-icon :icon="item.icon" />
        <span>{{ item.label }}</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- 手机 FAB：新建事项 -->
    <v-btn
      v-if="showFab"
      class="app-shell-fab"
      color="primary"
      icon="mdi-plus"
      size="large"
      aria-label="新建事项"
      :to="{ name: 'event-new' }"
    />
  </v-app>
</template>

<script setup lang="ts">
import '@/styles/global.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import {
  readThemeMode,
  resolveThemeName,
  themeModeLabel,
  writeThemeMode,
  type ThemeMode,
} from '@/components/themeMode'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const route = useRoute()
const router = useRouter()
const display = useDisplay()
const theme = useTheme()

/** ≥960 桌面侧栏；&lt;960（手机+平板）底栏 */
const isDesktop = computed(() => display.mdAndUp.value)

const navItems = [
  { to: 'month' as const, label: '日历', icon: 'mdi-calendar-month' },
  { to: 'week' as const, label: '课表', icon: 'mdi-table' },
  { to: 'home' as const, label: '事项', icon: 'mdi-checkbox-marked-outline' },
  { to: 'settings' as const, label: '设置', icon: 'mdi-cog' },
]

const tabNames = new Set(navItems.map((i) => i.to))

const themeMode = ref<ThemeMode>(readThemeMode())
const resolvedTheme = ref<'light' | 'dark'>(resolveThemeName(themeMode.value))

function applyTheme(): void {
  resolvedTheme.value = resolveThemeName(themeMode.value)
  theme.change(resolvedTheme.value)
}

function cycleThemeMode(): void {
  themeMode.value = readThemeMode()
  const order: ThemeMode[] = ['system', 'light', 'dark']
  const i = order.indexOf(themeMode.value)
  themeMode.value = order[(i + 1) % order.length]!
  writeThemeMode(themeMode.value)
  applyTheme()
}

const themeIcon = computed(() => {
  if (themeMode.value === 'light') return 'mdi-white-balance-sunny'
  if (themeMode.value === 'dark') return 'mdi-moon-waning-crescent'
  return 'mdi-theme-light-dark'
})

const currentTab = computed(() => {
  const name = String(route.name ?? '')
  if (tabNames.has(name as (typeof navItems)[number]['to'])) return name
  if (name.startsWith('event') || name === 'backup') return 'home'
  if (name.startsWith('course') || name === 'week') return 'week'
  if (name === 'debug-notifications' || name === 'help' || name === 'food') return 'settings'
  return 'month'
})

const bottomTab = computed({
  get: () => currentTab.value,
  set: (name: unknown) => {
    if (typeof name === 'string' && tabNames.has(name as (typeof navItems)[number]['to'])) {
      void router.push({ name })
    }
  },
})

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    month: '日历',
    week: '课表',
    home: '事项',
    settings: '设置',
    'event-new': '新建事项',
    'event-edit': '编辑事项',
    'course-import': '导入课表',
    'course-new': '添加课程',
    'course-edit': '编辑课程',
    backup: '备份与导出',
    'debug-notifications': '通知调试',
    help: '使用说明',
    food: '今天吃什么',
  }
  return map[String(route.name)] ?? '日历'
})

const showDesktopNew = computed(() => {
  const name = String(route.name ?? '')
  return name === 'month' || name === 'home' || name === 'week'
})

const showFab = computed(() => {
  if (isDesktop.value) return false
  const name = String(route.name ?? '')
  return name === 'month' || name === 'home' || name === 'week'
})

let media: ReturnType<typeof globalThis.matchMedia> | null = null
function onSystemThemeChange(): void {
  if (themeMode.value === 'system') applyTheme()
}

onMounted(() => {
  void settings.load()
  applyTheme()
  if (typeof globalThis.matchMedia === 'function') {
    media = globalThis.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', onSystemThemeChange)
  }
})

onUnmounted(() => {
  media?.removeEventListener('change', onSystemThemeChange)
})

watch(themeMode, () => applyTheme())

/** 从设置页改完外观后回到壳层时同步 */
watch(
  () => route.fullPath,
  () => {
    const next = readThemeMode()
    if (next !== themeMode.value) {
      themeMode.value = next
      applyTheme()
    }
  },
)
</script>

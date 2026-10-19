<template>
  <v-app>
    <v-app-bar
      color="primary"
      density="comfortable"
      flat
    >
      <v-app-bar-title>
        <router-link
          to="/"
          class="text-white text-decoration-none"
        >
          日历
        </router-link>
      </v-app-bar-title>
      <template #append>
        <v-btn
          variant="text"
          class="text-white"
          :to="{ name: 'month' }"
        >
          月
        </v-btn>
        <v-btn
          variant="text"
          class="text-white"
          :to="{ name: 'week' }"
        >
          课表
        </v-btn>
        <v-btn
          icon="mdi-cog"
          variant="text"
          aria-label="设置"
          :to="{ name: 'settings' }"
        />
        <v-btn
          icon="mdi-bug"
          variant="text"
          aria-label="通知调试"
          :to="{ name: 'debug-notifications' }"
        />
      </template>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
// Schedule resume hooks are wired from main.ts (visibility/focus → rebuildAll).
</script>

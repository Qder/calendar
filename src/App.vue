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
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>

<template>
  <div class="d-flex flex-wrap ga-2 align-center">
    <v-btn
      color="primary"
      variant="flat"
      class="touch-target flex-grow-1 flex-sm-grow-0"
      :loading="saving"
      :disabled="disabled"
      aria-label="保存"
      @click="$emit('save')"
    >
      保存
    </v-btn>
    <v-btn
      v-if="!isNew"
      color="error"
      variant="outlined"
      class="touch-target"
      :loading="saving"
      :disabled="disabled"
      aria-label="删除整系列"
      @click="$emit('delete')"
    >
      删除整系列
    </v-btn>
    <v-btn
      variant="text"
      class="touch-target"
      :disabled="saving"
      aria-label="取消"
      @click="$emit('cancel')"
    >
      取消
    </v-btn>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isNew: boolean
  saving: boolean
  disabled?: boolean
}>()

defineEmits<{
  save: []
  delete: []
  cancel: []
}>()
</script>

<style scoped>
.touch-target {
  min-width: 44px !important;
  min-height: 44px !important;
}
</style>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getDefaultRemindTime,
  setDefaultRemindTime,
} from '@/db/repos/settings'
import { DEFAULT_REMIND_TIME } from '@/domain/schemas'

export const useSettingsStore = defineStore('settings', () => {
  const defaultRemindTime = ref(DEFAULT_REMIND_TIME)
  const loaded = ref(false)

  async function load(): Promise<void> {
    defaultRemindTime.value = await getDefaultRemindTime()
    loaded.value = true
  }

  async function saveDefaultRemindTime(hm: string): Promise<void> {
    await setDefaultRemindTime(hm)
    defaultRemindTime.value = hm
  }

  return {
    defaultRemindTime,
    loaded,
    load,
    saveDefaultRemindTime,
  }
})

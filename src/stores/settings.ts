import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getDefaultRemindTime,
  getDeveloperMode,
  setDefaultRemindTime,
  setDeveloperMode,
} from '@/db/repos/settings'
import { DEFAULT_REMIND_TIME } from '@/domain/schemas'

export const useSettingsStore = defineStore('settings', () => {
  const defaultRemindTime = ref(DEFAULT_REMIND_TIME)
  const developerMode = ref(false)
  const loaded = ref(false)

  async function load(): Promise<void> {
    defaultRemindTime.value = await getDefaultRemindTime()
    developerMode.value = await getDeveloperMode()
    loaded.value = true
  }

  async function saveDefaultRemindTime(hm: string): Promise<void> {
    await setDefaultRemindTime(hm)
    defaultRemindTime.value = hm
  }

  async function saveDeveloperMode(on: boolean): Promise<void> {
    await setDeveloperMode(on)
    developerMode.value = on
  }

  return {
    defaultRemindTime,
    developerMode,
    loaded,
    load,
    saveDefaultRemindTime,
    saveDeveloperMode,
  }
})

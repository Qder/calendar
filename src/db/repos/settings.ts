import { db } from '@/db'
import {
  DEFAULT_REMIND_TIME,
  DEFAULT_REMIND_TIME_KEY,
} from '@/domain/schemas'

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await db.settings.get(key)
  return row?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}

export async function getDefaultRemindTime(): Promise<string> {
  return (await getSetting(DEFAULT_REMIND_TIME_KEY)) ?? DEFAULT_REMIND_TIME
}

export async function setDefaultRemindTime(hm: string): Promise<void> {
  await setSetting(DEFAULT_REMIND_TIME_KEY, hm)
}

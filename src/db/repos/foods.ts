import { db } from '@/db'
import { FoodNameInputSchema, type FoodRow } from '@/domain/schemas'

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function plainFood(f: FoodRow): FoodRow {
  return {
    id: String(f.id),
    name: String(f.name),
    createdAt: Number(f.createdAt),
    updatedAt: Number(f.updatedAt),
  }
}

export async function listFoods(): Promise<FoodRow[]> {
  return db.foods.orderBy('name').toArray()
}

export async function addFood(rawName: string): Promise<FoodRow> {
  const parsed = FoodNameInputSchema.safeParse(rawName)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? '名称无效')
  }
  const name = parsed.data
  const now = Date.now()
  const row: FoodRow = {
    id: newId(),
    name,
    createdAt: now,
    updatedAt: now,
  }
  await db.foods.put(plainFood(row))
  return row
}

export async function deleteFood(id: string): Promise<void> {
  await db.foods.delete(id)
}

export async function putFoods(rows: FoodRow[]): Promise<void> {
  await db.foods.bulkPut(rows.map(plainFood))
}

export async function clearFoods(): Promise<void> {
  await db.foods.clear()
}

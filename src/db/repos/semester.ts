import { db } from '@/db'
import type { SemesterRow } from '@/domain/schemas'

const ID = 'current' as const

export async function getSemester(): Promise<SemesterRow | undefined> {
  return db.semester.get(ID)
}

export async function putSemester(
  startMonday: string,
  totalWeeks: number,
): Promise<SemesterRow> {
  const row: SemesterRow = {
    id: ID,
    startMonday,
    totalWeeks,
    updatedAt: Date.now(),
  }
  await db.semester.put(row)
  return row
}

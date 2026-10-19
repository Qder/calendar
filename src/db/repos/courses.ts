import { db } from '@/db'
import type { CourseRow } from '@/domain/schemas'

export async function listCourses(): Promise<CourseRow[]> {
  return db.courses.orderBy('name').toArray()
}

export async function putCourse(course: CourseRow): Promise<void> {
  await db.courses.put(plainCourse(course))
}

export async function putCourses(courses: CourseRow[]): Promise<void> {
  await db.courses.bulkPut(courses.map(plainCourse))
}

export async function clearCourses(): Promise<void> {
  await db.courses.clear()
}

export async function deleteCourse(id: string): Promise<void> {
  await db.courses.delete(id)
}

/** Defensive: never hand Vue Proxy arrays to IndexedDB. */
function plainCourse(c: CourseRow): CourseRow {
  return {
    id: String(c.id),
    name: String(c.name),
    weekday: Number(c.weekday),
    startPeriod: Number(c.startPeriod),
    endPeriod: Number(c.endPeriod),
    weeks: Array.from(c.weeks as Iterable<number>),
    weeksRaw: String(c.weeksRaw),
    room: String(c.room ?? ''),
    teacher: String(c.teacher ?? ''),
    createdAt: Number(c.createdAt),
    updatedAt: Number(c.updatedAt),
  }
}

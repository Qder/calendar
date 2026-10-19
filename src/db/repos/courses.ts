import { db } from '@/db'
import type { CourseRow } from '@/domain/schemas'

export async function listCourses(): Promise<CourseRow[]> {
  return db.courses.orderBy('name').toArray()
}

export async function putCourse(course: CourseRow): Promise<void> {
  await db.courses.put(course)
}

export async function putCourses(courses: CourseRow[]): Promise<void> {
  await db.courses.bulkPut(courses)
}

export async function clearCourses(): Promise<void> {
  await db.courses.clear()
}

export async function deleteCourse(id: string): Promise<void> {
  await db.courses.delete(id)
}

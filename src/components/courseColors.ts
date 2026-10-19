/**
 * 课程色板：8 个低饱和柔和色，按课程名哈希固定分配。
 * hex 仅允许出现在本常量文件；业务视图通过本模块取色。
 */
export const COURSE_COLOR_PALETTE = [
  '#7C9EB2',
  '#8FAF8A',
  '#C4A484',
  '#A89BB0',
  '#6BA3A7',
  '#B8956C',
  '#8B9DC3',
  '#A3B18A',
] as const

export type CourseColor = (typeof COURSE_COLOR_PALETTE)[number]

/** djb2 变体，保证同名课程色稳定 */
export function hashCourseName(name: string): number {
  let h = 5381
  const s = name.trim()
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return Math.abs(h)
}

export function courseColorForName(name: string): CourseColor {
  const idx = hashCourseName(name) % COURSE_COLOR_PALETTE.length
  return COURSE_COLOR_PALETTE[idx]!
}

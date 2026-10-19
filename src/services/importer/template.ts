import * as XLSX from 'xlsx'
import { COURSE_TEMPLATE_HEADERS } from '@/domain/schemas'

/** Sample rows illustrating week syntax (not merged cells). */
const SAMPLE_ROWS: (string | number)[][] = [
  ['高等数学', 1, 1, 2, '1-16', 'A101', '张三'],
  ['大学英语', 3, 3, 4, '1,3,5,7', 'B202', '李四'],
  ['体育', 5, 5, 6, '单周', '操场', '王五'],
]

/** Build an .xlsx ArrayBuffer for download. */
export function buildCourseTemplateArrayBuffer(): ArrayBuffer {
  const aoa: (string | number)[][] = [
    [...COURSE_TEMPLATE_HEADERS],
    ...SAMPLE_ROWS,
  ]
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, '课表')
  const out = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
  return out as ArrayBuffer
}

export function downloadCourseTemplate(filename = '课表导入模板.xlsx'): void {
  const buf = buildCourseTemplateArrayBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

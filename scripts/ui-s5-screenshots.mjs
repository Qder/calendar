/**
 * S5 事项列表 + 设置分组截图：手机 390×844 / 桌面 1440×900 × 浅/深
 * 先灌几条事项再拍 Home，设置页作对照时取第二屏（本脚本以事项页为主）
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'docs/ui-screenshots')

async function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.listen(0, () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
    s.on('error', reject)
  })
}

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, { cwd: root, stdio: 'inherit', ...opts })
}

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`server not ready: ${url}`)
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function ymdFromOffset(days) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function seedEvents(page) {
  const today = ymdFromOffset(0)
  const tomorrow = ymdFromOffset(1)
  const later = ymdFromOffset(10)
  await page.evaluate(
    async ({ today, tomorrow, later }) => {
      await new Promise((resolve, reject) => {
        const del = indexedDB.deleteDatabase('calendar-local')
        del.onsuccess = () => resolve()
        del.onerror = () => resolve()
        del.onblocked = () => resolve()
      })
      // 让应用自行建库后再写入
      await new Promise((r) => setTimeout(r, 50))
    },
    { today, tomorrow, later },
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.evaluate(
    async ({ today, tomorrow, later }) => {
      const openDb = () =>
        new Promise((resolve, reject) => {
          const req = indexedDB.open('calendar-local')
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve(req.result)
        })
      const db = await openDb()
      const now = Date.now()
      const events = [
        {
          id: 's5-today',
          title: '提交作业',
          date: today,
          time: '14:00',
          note: '',
          recurrence: 'none',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 's5-tomorrow',
          title: '小组讨论',
          date: tomorrow,
          time: null,
          note: '',
          recurrence: 'none',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 's5-later',
          title: '期中复习',
          date: later,
          time: '09:30',
          note: '',
          recurrence: 'none',
          createdAt: now,
          updatedAt: now,
        },
      ]
      const rules = [
        {
          id: 's5-r1',
          eventId: 's5-today',
          daysBefore: 0,
          time: '09:00',
        },
        {
          id: 's5-r2',
          eventId: 's5-tomorrow',
          daysBefore: 1,
          time: '09:00',
        },
      ]
      await new Promise((resolve, reject) => {
        const tx = db.transaction(['events', 'reminder_rules'], 'readwrite')
        const evStore = tx.objectStore('events')
        const ruleStore = tx.objectStore('reminder_rules')
        for (const e of events) evStore.put(e)
        for (const r of rules) ruleStore.put(r)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    },
    { today, tomorrow, later },
  )
  await page.reload({ waitUntil: 'networkidle' })
}

async function main() {
  await mkdir(outDir, { recursive: true })

  console.log('building…')
  await new Promise((resolve, reject) => {
    const p = run('npm', ['run', 'build'])
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build ${code}`))))
  })

  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  const preview = run('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)])
  await waitForServer(base)

  const browser = await chromium.launch({ headless: true })
  const shots = [
    { name: 's5-phone-light', width: 390, height: 844, mode: 'light' },
    { name: 's5-phone-dark', width: 390, height: 844, mode: 'dark' },
    { name: 's5-desktop-light', width: 1440, height: 900, mode: 'light' },
    { name: 's5-desktop-dark', width: 1440, height: 900, mode: 'dark' },
  ]

  const manifest = []
  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 1,
      colorScheme: shot.mode === 'dark' ? 'dark' : 'light',
    })
    await context.addInitScript((mode) => {
      localStorage.setItem('calendar.themeMode', mode)
    }, shot.mode)
    const page = await context.newPage()
    await page.goto(`${base}/#/home`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    try {
      await seedEvents(page)
    } catch (err) {
      console.warn('seed failed, capturing empty/partial state', err)
    }
    await page.goto(`${base}/#/home`, { waitUntil: 'networkidle' })
    // 分组标题或空态卡片
    await page.waitForSelector('.home-group__title, .home-empty, .home-skeleton', {
      timeout: 20000,
    })
    await page.waitForTimeout(700)
    const file = path.join(outDir, `${shot.name}.png`)
    await page.screenshot({ path: file, fullPage: false })
    manifest.push({ ...shot, file: path.relative(root, file) })
    console.log('wrote', file)
    await context.close()
  }

  await writeFile(
    path.join(outDir, 's5-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )

  await browser.close()
  preview.kill('SIGTERM')
  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

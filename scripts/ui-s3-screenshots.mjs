/**
 * S3 事项编辑截图：手机 390×844 / 桌面 1440×900 × 浅/深
 * 打开新建事项页，可见 sheet/dialog 表单
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
    { name: 's3-phone-light', width: 390, height: 844, mode: 'light' },
    { name: 's3-phone-dark', width: 390, height: 844, mode: 'dark' },
    { name: 's3-desktop-light', width: 1440, height: 900, mode: 'light' },
    { name: 's3-desktop-dark', width: 1440, height: 900, mode: 'dark' },
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
    await page.goto(`${base}/#/events/new`, { waitUntil: 'networkidle' })
    // 等编辑表单标题字段出现（sheet/dialog 内）
    await page.waitForSelector('.event-edit-form', { timeout: 20000 })
    await page.getByRole('button', { name: '保存' }).waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(700)
    const file = path.join(outDir, `${shot.name}.png`)
    await page.screenshot({ path: file, fullPage: false })
    manifest.push({ ...shot, file: path.relative(root, file) })
    console.log('wrote', file)
    await context.close()
  }

  await writeFile(
    path.join(outDir, 's3-manifest.json'),
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

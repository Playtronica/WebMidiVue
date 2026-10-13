const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const { chromium } = require('playwright-core')

const root = path.resolve(__dirname, '..', 'dist')
let origin
const mime = {
  '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon',
  '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2'
}
let serviceWorkerVersion = 1
let browser

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean)
  const executable = candidates.find(fs.existsSync)
  assert(executable, 'Chrome/Chromium not found; set CHROME_PATH')
  return executable
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, origin).pathname
  let relative = pathname === '/' ? 'index.html' : pathname.slice(1)
  let file = path.resolve(root, relative)
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // Production hosting must apply the same app-shell fallback for direct routes.
    relative = 'index.html'
    file = path.join(root, relative)
  }
  let body = fs.readFileSync(file)
  if (relative === 'service-worker.js' && serviceWorkerVersion > 1) {
    body = Buffer.from(`${body.toString()}\n// deterministic-test-version:${serviceWorkerVersion}\n`)
  }
  response.writeHead(200, {
    'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Service-Worker-Allowed': '/'
  })
  response.end(body)
})

async function waitFor(predicate, message, timeout = 10000) {
  const started = Date.now()
  while (!(await predicate())) {
    if (Date.now() - started > timeout) throw new Error(message)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

;(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({ executablePath: chromePath(), headless: true })
  const context = await browser.newContext({ serviceWorkers: 'allow' })
  await context.addInitScript(() => {
    // Keep the lifecycle test independent from MIDI hardware and permission UI.
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async () => ({ inputs: new Map(), outputs: new Map(), onstatechange: null })
    })
  })
  const page = await context.newPage()

  await page.goto(`${origin}/#/`, { waitUntil: 'load' })
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload({ waitUntil: 'load' })
  console.log('1/4 service worker installed and controlling')
  assert(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), 'installed worker does not control the app')

  const manifest = await page.evaluate(() => fetch('/manifest.json').then(response => response.json()))
  assert.strictEqual(manifest.start_url, './#/')
  assert.strictEqual(manifest.scope, './')
  assert.strictEqual(manifest.display, 'standalone')
  console.log('2/4 install manifest verified')

  await context.setOffline(true)
  await page.goto(`${origin}/biotron`, { waitUntil: 'load' })
  await waitFor(() => page.url().includes('/#/biotron'), 'direct route was not normalized to the cached hash route')
  assert((await page.locator('body').innerText()).includes('Biotron'), 'Biotron app shell did not render offline')

  // Chromium's automation network toggle blocks requests but does not update
  // navigator.onLine. Emit the browser signal separately to verify the UI guard.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    window.dispatchEvent(new Event('offline'))
  })
  await page.getByRole('button', { name: /Update Firmware/i }).click()
  const warning = page.getByText(/Firmware updates require an internet connection/i)
  await warning.waitFor({ state: 'visible', timeout: 5000 })
  const update = page.locator('.modal.show').getByRole('button', { name: 'Update', exact: true })
  assert(await update.isDisabled(), 'firmware Update remains enabled offline')
  console.log('3/4 offline direct route and firmware guard verified')

  await context.setOffline(false)
  const activeScript = await page.evaluate(async () => (await navigator.serviceWorker.ready).active.scriptURL)
  serviceWorkerVersion = 2
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update())
  await waitFor(
    () => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)),
    'updated worker did not enter waiting state'
  )
  assert.strictEqual(
    await page.evaluate(() => navigator.serviceWorker.controller.scriptURL),
    activeScript,
    'updated worker replaced the active controller without approval'
  )
  console.log('4/4 updated worker is waiting and did not replace the active controller')

  await browser.close()
  browser = null
  console.log('Browser PWA verified: install/control, manifest, offline direct route, offline firmware guard, non-disruptive waiting update.')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(async () => {
  if (browser) await browser.close()
  server.close()
})

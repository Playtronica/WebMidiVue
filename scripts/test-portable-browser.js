const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const {chromium} = require('playwright-core')

const root = path.resolve(__dirname, '..', 'dist')
const mime = {
  '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon',
  '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2'
}
let origin

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser'
  ].filter(Boolean)
  const executable = candidates.find(fs.existsSync)
  assert(executable, 'Chrome/Chromium not found; set CHROME_PATH')
  return executable
}

const server = http.createServer((request, response) => {
  if (request.url.startsWith('/__biotron/runtime.json')) {
    response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'})
    response.end(JSON.stringify({application: 'playtronica-biotron-settings', portable: true, version: 'browser-test'}))
    return
  }
  const pathname = new URL(request.url, origin).pathname
  let relative = pathname === '/' ? 'index.html' : pathname.slice(1)
  let file = path.resolve(root, relative)
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    relative = 'index.html'
    file = path.join(root, relative)
  }
  response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'})
  response.end(fs.readFileSync(file))
})

;(async () => {
  assert(fs.existsSync(path.join(root, 'index.html')), 'run npm run build first')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch({executablePath: chromePath(), headless: true, args: ['--no-first-run']})
  const page = await browser.newPage()
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', {configurable: true, get: () => false})
    window.__midiSent = []
    const input = {
      id: 'portable-input', manufacturer: 'Playtronica', name: 'Biotron', onmidimessage: null,
      async open() { return this }, async close() { return this }
    }
    const output = {
      id: 'portable-output', manufacturer: 'Playtronica', name: 'Biotron',
      async open() { return this }, async close() { return this },
      send(data) { window.__midiSent.push(Array.from(data)) }
    }
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async options => {
        if (!options?.sysex) throw new Error('portable Settings did not request SysEx')
        return {inputs: new Map([[input.id, input]]), outputs: new Map([[output.id, output]]), onstatechange: null}
      }
    })
  })

  await page.goto(`${origin}/biotron`, {waitUntil: 'load'})
  await page.getByText(/Offline portable browser-test/i).waitFor({state: 'visible', timeout: 10000})
  assert.strictEqual(await page.evaluate(() => navigator.serviceWorker.controller), null, 'portable runtime unexpectedly depends on a service worker')
  const send = page.getByRole('button', {name: /Send to Device/i})
  await send.waitFor({state: 'visible'})
  assert(await send.isEnabled(), 'portable Biotron did not connect')
  await send.click()
  assert(await page.evaluate(() => window.__midiSent.some(message => message[0] === 0xf0 && message.at(-1) === 0xf7)), 'portable setting did not reach fake SysEx output')

  await page.setViewportSize({width: 375, height: 812})
  const release = page.getByRole('button', {name: /Release device for DAW/i})
  const releaseBox = await release.boundingBox()
  assert(releaseBox && releaseBox.width >= 300, 'mobile DAW handoff button is squeezed beside its help text')
  assert(releaseBox.height >= 44 && releaseBox.height <= 64, 'mobile DAW handoff button has an unusable wrapped height')
  assert.strictEqual(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    false,
    'portable Biotron route overflows a 375px viewport'
  )

  await page.getByRole('button', {name: /Update Firmware/i}).click()
  await page.getByText(/Firmware updates require an internet connection/i).waitFor({state: 'visible'})
  assert(await page.locator('.modal.show').getByRole('button', {name: 'Update', exact: true}).isDisabled(), 'portable offline firmware update is enabled')
  await browser.close()
  console.log('Portable browser runtime verified: clean-offline readiness, responsive DAW handoff, no service worker dependency, MIDI/SysEx write and firmware guard.')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => server.close())

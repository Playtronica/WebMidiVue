const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const {chromium} = require('playwright-core')

const project = path.resolve(__dirname, '..')
const dist = path.join(project, 'dist')
const matrix = JSON.parse(fs.readFileSync(path.join(project, 'test-contracts/device-matrix.json'), 'utf8'))
const mime = {
  '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon',
  '.js': 'text/javascript', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2'
}

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

let origin = 'http://127.0.0.1'
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, origin).pathname
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1)
  const candidate = path.resolve(dist, requested)
  const file = candidate.startsWith(`${dist}${path.sep}`) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(dist, 'index.html')
  response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'})
  response.end(fs.readFileSync(file))
})

;(async () => {
  assert(fs.existsSync(path.join(dist, 'index.html')), 'run npm run build before browser routes')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch({executablePath: chromePath(), headless: true})
  const context = await browser.newContext()
  await context.addInitScript(devices => {
    window.__midiSent = []
    window.__midiRequests = []
    const inputs = new Map()
    const outputs = new Map()
    for (const device of devices) {
      const input = {
        id: `${device.id}-input`, manufacturer: 'Playtronica', name: device.midi_name,
        connection: 'closed', onmidimessage: null,
        async open() { this.connection = 'open'; return this },
        async close() { this.connection = 'closed'; return this }
      }
      const output = {
        id: `${device.id}-output`, manufacturer: 'Playtronica', name: device.midi_name,
        connection: 'closed',
        async open() { this.connection = 'open'; return this },
        async close() { this.connection = 'closed'; return this },
        send(message) { window.__midiSent.push([device.id, Array.from(message)]) }
      }
      inputs.set(input.id, input)
      outputs.set(output.id, output)
    }
    const access = {inputs, outputs, onstatechange: null}
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async options => {
        window.__midiRequests.push(options || {})
        return access
      }
    })
  }, matrix.devices)

  const failures = []
  const routeRows = [
    ...matrix.devices.flatMap(device => device.routes.map(route => ({...device, route}))),
    ...matrix.tools.filter(tool => tool.route).map(tool => ({...tool, name: tool.id, minimum_controls: 1}))
  ]
  for (const row of routeRows) {
    const page = await context.newPage()
    const runtimeErrors = []
    page.on('pageerror', error => runtimeErrors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') runtimeErrors.push(message.text())
    })
    try {
      await page.goto(`${origin}/#${row.route}`, {waitUntil: 'load'})
      await page.waitForTimeout(450)
      const appText = (await page.locator('#app').innerText()).trim()
      assert(appText.length > 20, `${row.route}: app rendered no useful content`)
      assert.strictEqual(runtimeErrors.length, 0, `${row.route}: ${runtimeErrors.join(' | ')}`)
      const controls = await page.locator('button,input,select').count()
      const minimumControls = row.primary_route === row.route ? row.minimum_controls : 1
      assert(controls >= minimumControls,
        `${row.route}: expected at least ${minimumControls} controls, got ${controls}`)
      if (row.midi_name) {
        assert(appText.includes(row.midi_name), `${row.route}: matching MIDI device is not visible`)
      }
      assert(await page.evaluate(() => window.__midiRequests.some(options => options.sysex === true)),
        `${row.route}: no explicit SysEx permission request`)
    } catch (error) {
      failures.push(error.message)
    } finally {
      await page.close()
    }
  }
  await browser.close()
  assert.deepStrictEqual(failures, [], failures.join('\n'))
  console.log(`All-route browser smoke verified: ${routeRows.length} Settings routes, mocked SysEx permission, zero runtime errors.`)
})().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => server.close())

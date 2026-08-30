const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const {chromium} = require('playwright-core')

const root = path.resolve(__dirname, '..', 'dist')
const mime = {'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.woff2':'font/woff2'}

const chromePath = () => {
  const candidates = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean)
  const executable = candidates.find(fs.existsSync)
  assert(executable, 'Chrome/Chromium not found; set CHROME_PATH')
  return executable
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
  let file = path.resolve(root, relative)
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html')
  response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'})
  response.end(fs.readFileSync(file))
})

;(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch({executablePath: chromePath(), headless: true})
  try {
    const context = await browser.newContext()
    await context.addInitScript(() => {
      window.__soundMidiRequests = []
      window.__failSoundCloseOnce = false
      let midiListener = null
      let stateListener = null
      const input = {
        id: 'playtronica-in-1', name: 'Biotron Port 1', manufacturer: 'Playtronica',
        state: 'connected', connection: 'closed',
        async open() { this.connection = 'open'; return this },
        async close() {
          if (window.__failSoundCloseOnce) {
            window.__failSoundCloseOnce = false
            throw new Error('driver refused close')
          }
          this.connection = 'closed'
          return this
        },
        addEventListener(type, listener) { if (type === 'midimessage') midiListener = listener },
        removeEventListener(type, listener) { if (type === 'midimessage' && midiListener === listener) midiListener = null }
      }
      const access = {
        inputs: new Map([[input.id, input]]),
        addEventListener(type, listener) { if (type === 'statechange') stateListener = listener },
        removeEventListener(type, listener) { if (type === 'statechange' && stateListener === listener) stateListener = null }
      }
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        configurable: true,
        value: async options => { window.__soundMidiRequests.push(options); return access }
      })
      window.__emitSoundMidi = data => midiListener?.({data: Uint8Array.from(data)})
      window.__setSoundInputState = state => {
        input.state = state
        if (state === 'disconnected') input.connection = 'closed'
        stateListener?.({port: input})
      }
      window.__soundInput = input
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/#/sound`, {waitUntil: 'networkidle'})
    assert.strictEqual(await page.getByRole('button', {name: /Glass/}).count(), 6)
    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.locator('.sound-lab[data-audio-state="running"]').waitFor()

    await page.dispatchEvent('body', 'keydown', {code: 'KeyA', key: 'ф'})
    await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
    await page.dispatchEvent('body', 'keyup', {code: 'KeyA', key: 'ф'})
    await page.getByRole('button', {name: 'Stop notes'}).click()
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor()

    await page.getByRole('button', {name: 'Find MIDI device'}).click()
    await page.getByRole('button', {name: 'Connect selected'}).click()
    assert.deepStrictEqual(await page.evaluate(() => window.__soundMidiRequests), [{sysex: false}])
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'open')
    await page.evaluate(() => window.__emitSoundMidi([0x90, 64, 100]))
    await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
    await page.dispatchEvent('body', 'keydown', {code: 'KeyD', key: 'в'})
    await page.locator('.sound-lab[data-active-voices="2"]').waitFor()
    await page.dispatchEvent('body', 'keyup', {code: 'KeyD', key: 'в'})
    await page.evaluate(() => window.__emitSoundMidi([0x90, 64, 0]))
    await page.getByRole('button', {name: 'Stop notes'}).click()

    const burstMilliseconds = await page.evaluate(() => {
      const started = performance.now()
      for (let index = 0; index < 1000; index += 1) {
        window.__emitSoundMidi([0x90, 36 + index % 48, 100])
      }
      return performance.now() - started
    })
    await page.locator('.sound-lab[data-active-voices="8"]').waitFor()
    assert(burstMilliseconds < 1500, `1000-message burst blocked the page for ${burstMilliseconds} ms`)
    await page.evaluate(() => window.__emitSoundMidi([0xb0, 123, 0]))
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor()

    const devtools = await context.newCDPSession(page)
    await devtools.send('Performance.enable')
    await devtools.send('HeapProfiler.collectGarbage')
    const metric = (list, name) => list.find(item => item.name === name)?.value || 0
    const beforeMetrics = (await devtools.send('Performance.getMetrics')).metrics
    const soakMilliseconds = await page.evaluate(() => {
      const started = performance.now()
      for (let cycle = 0; cycle < 20; cycle += 1) {
        for (let index = 0; index < 1000; index += 1) {
          window.__emitSoundMidi([0x90, 36 + index % 48, 72 + index % 48])
        }
        window.__emitSoundMidi([0xb0, 123, 0])
      }
      return performance.now() - started
    })
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor()
    await page.waitForTimeout(750)
    await devtools.send('HeapProfiler.collectGarbage')
    const afterMetrics = (await devtools.send('Performance.getMetrics')).metrics
    const heapGrowth = metric(afterMetrics, 'JSHeapUsedSize') - metric(beforeMetrics, 'JSHeapUsedSize')
    assert(soakMilliseconds < 15000, `20000-message soak blocked the page for ${soakMilliseconds} ms`)
    assert(heapGrowth < 20 * 1024 * 1024, `JS heap grew by ${heapGrowth} bytes`)

    await page.evaluate(() => window.__setSoundInputState('disconnected'))
    await page.getByText(/MIDI disconnected/i).waitFor()
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor()
    await page.evaluate(() => window.__setSoundInputState('connected'))
    await page.getByRole('button', {name: 'Connect selected'}).click()
    await page.getByText(/Biotron Port 1 connected/i).waitFor()

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {configurable: true, get: () => true})
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.locator('.sound-lab[data-audio-state="suspended"]').waitFor()
    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.locator('.sound-lab[data-audio-state="running"]').waitFor()

    await page.evaluate(() => { window.__failSoundCloseOnce = true })
    await page.getByRole('button', {name: 'Stop & release'}).click()
    await page.locator('.sound-lab[data-audio-state="closed"]').waitFor()
    await page.getByText(/MIDI did not release/i).waitFor()
    assert.strictEqual(await page.getByRole('button', {name: 'Start sound'}).isDisabled(), true)
    assert.strictEqual(await page.getByRole('button', {name: 'Stop & release'}).isEnabled(), true)
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'open')
    await page.getByRole('button', {name: 'Stop & release'}).click()
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'closed')
    assert.deepStrictEqual(errors, [])
    console.log(`Sound browser verified: 6 variants, 1000 burst ${burstMilliseconds.toFixed(1)} ms, 20000 soak ${soakMilliseconds.toFixed(1)} ms, heap delta ${heapGrowth}, disconnect/background recovery and retryable release.`)
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
})().catch(error => {
  console.error(error)
  server.close(() => process.exit(1))
})

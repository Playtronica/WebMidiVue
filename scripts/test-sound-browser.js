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
      window.__failSoundAudioCloseOnce = false
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const nativeAudioClose = AudioContextClass?.prototype.close
      if (nativeAudioClose) {
        AudioContextClass.prototype.close = function(...args) {
          if (window.__failSoundAudioCloseOnce) {
            window.__failSoundAudioCloseOnce = false
            return Promise.reject(new Error('audio driver refused close'))
          }
          return nativeAudioClose.apply(this, args)
        }
      }
      if (AudioContextClass) {
        class TrackedAudioContext extends AudioContextClass {
          constructor(...args) {
            super(...args)
            window.__soundContext = this
          }
        }
        if (window.AudioContext) {
          Object.defineProperty(window, 'AudioContext', {configurable: true, value: TrackedAudioContext})
        } else {
          Object.defineProperty(window, 'webkitAudioContext', {configurable: true, value: TrackedAudioContext})
        }
      }
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
    assert.strictEqual(await page.locator('.sound-lab__variant').count(), 6)
    assert.deepStrictEqual(await page.locator('.sound-lab__variant').allTextContents(), ['1', '2', '3', '4', '5', '6'])
    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.locator('.sound-lab[data-audio-state="running"]').waitFor()
    await page.locator('.sound-lab[data-tab-lease="held"]').waitFor()

    const secondPage = await context.newPage()
    await secondPage.goto(`${origin}/#/sound`, {waitUntil: 'networkidle'})
    await secondPage.getByRole('button', {name: 'Start sound'}).click()
    await secondPage.locator('.sound-lab[data-tab-lease="blocked"]').waitFor()
    await secondPage.getByText(/already open in another Settings window/i).waitFor()
    assert.strictEqual(await secondPage.locator('.sound-lab').getAttribute('data-audio-state'), 'closed')

    await page.getByRole('button', {name: 'Stop & release'}).click()
    await page.locator('.sound-lab[data-tab-lease="free"]').waitFor()
    await secondPage.getByRole('button', {name: 'Start sound'}).click()
    await secondPage.locator('.sound-lab[data-audio-state="running"][data-tab-lease="held"]').waitFor()
    await secondPage.getByRole('button', {name: 'Stop & release'}).click()
    await secondPage.locator('.sound-lab[data-tab-lease="free"]').waitFor()
    await secondPage.close()

    await page.getByLabel('Low CPU').check()
    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.locator('.sound-lab[data-audio-state="running"][data-quality="safe"][data-tab-lease="held"]').waitFor()
    assert.strictEqual(await page.getByLabel('Low CPU').isDisabled(), true)
    for (const code of ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG']) {
      await page.dispatchEvent('body', 'keydown', {code, key: code})
    }
    await page.locator('.sound-lab[data-active-voices="4"]').waitFor()
    await page.getByRole('button', {name: 'Stop notes'}).click()
    await page.getByRole('button', {name: 'Stop & release'}).click()
    await page.getByLabel('Low CPU').uncheck()

    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.locator('.sound-lab[data-audio-state="running"][data-quality="standard"][data-tab-lease="held"]').waitFor()

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

    await page.dispatchEvent('body', 'keydown', {code: 'KeyA', key: 'a'})
    await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {configurable: true, get: () => true})
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.locator('.sound-lab[data-audio-state="suspended"]').waitFor()
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor()
    await page.evaluate(() => window.__emitSoundMidi([0x90, 67, 100]))
    await page.waitForTimeout(100)
    assert.strictEqual(await page.locator('.sound-lab').getAttribute('data-active-voices'), '0')
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {configurable: true, get: () => false})
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.locator('.sound-lab[data-audio-state="running"]').waitFor()
    await page.dispatchEvent('body', 'keydown', {code: 'KeyA', key: 'a'})
    await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
    await page.dispatchEvent('body', 'keyup', {code: 'KeyA', key: 'a'})
    await page.evaluate(() => window.__emitSoundMidi([0x90, 67, 100]))
    await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
    await page.getByRole('button', {name: 'Stop notes'}).click()

    await page.evaluate(() => window.__soundContext.close())
    await page.locator('.sound-lab[data-audio-state="closed"][data-tab-lease="held"]').waitFor()
    await page.getByText(/Audio stopped unexpectedly/i).waitFor()
    assert.strictEqual(await page.getByRole('button', {name: 'Start sound'}).isDisabled(), true)
    assert.strictEqual(await page.getByRole('button', {name: 'Stop & release'}).isEnabled(), true)
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'open')
    await page.getByRole('button', {name: 'Stop & release'}).click()
    await page.locator('.sound-lab[data-audio-state="closed"][data-tab-lease="free"]').waitFor()
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'closed')

    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.getByRole('button', {name: 'Find MIDI device'}).click()
    await page.getByRole('button', {name: 'Connect selected'}).click()
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'open')

    await page.evaluate(() => { window.__failSoundCloseOnce = true })
    await page.evaluate(() => { window.location.hash = '#/biotron' })
    await page.locator('.sound-lab[data-audio-state="closed"]').waitFor()
    await page.getByText(/MIDI did not release/i).waitFor()
    assert.strictEqual(new URL(page.url()).hash, '#/sound')
    assert.strictEqual(await page.getByRole('button', {name: 'Start sound'}).isDisabled(), true)
    assert.strictEqual(await page.getByRole('button', {name: 'Stop & release'}).isEnabled(), true)
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'open')
    await page.getByRole('button', {name: 'Stop & release'}).click()
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'closed')

    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.evaluate(() => { window.__failSoundAudioCloseOnce = true })
    await page.getByRole('button', {name: 'Stop & release'}).click()
    await page.locator('.sound-lab[data-audio-state="error"][data-tab-lease="held"]').waitFor()
    await page.getByText(/audio did not close/i).waitFor()
    assert.strictEqual(await page.getByRole('button', {name: 'Start sound'}).isDisabled(), true)
    assert.strictEqual(await page.getByRole('button', {name: 'Stop & release'}).isEnabled(), true)
    await page.getByRole('button', {name: 'Stop & release'}).click()
    await page.locator('.sound-lab[data-audio-state="closed"][data-tab-lease="free"]').waitFor()

    const cycleStarted = Date.now()
    for (let cycle = 0; cycle < 100; cycle += 1) {
      await page.getByRole('button', {name: 'Start sound'}).click()
      await page.locator('.sound-lab[data-audio-state="running"][data-tab-lease="held"]').waitFor()
      await page.getByRole('button', {name: 'Stop & release'}).click()
      await page.locator('.sound-lab[data-audio-state="closed"][data-tab-lease="free"]').waitFor()
    }
    const cycleMilliseconds = Date.now() - cycleStarted
    assert.strictEqual(await page.getByRole('button', {name: 'Start sound'}).isEnabled(), true)
    assert.deepStrictEqual(errors, [])
    console.log(`Sound browser verified: 6 variants, 4-voice Low CPU mode, exclusive two-tab handoff, 100/100 lifecycle cycles in ${cycleMilliseconds} ms, 1000 burst ${burstMilliseconds.toFixed(1)} ms, 20000 soak ${soakMilliseconds.toFixed(1)} ms, heap delta ${heapGrowth}, disconnect/background recovery and retryable release.`)
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
})().catch(error => {
  console.error(error)
  server.close(() => process.exit(1))
})

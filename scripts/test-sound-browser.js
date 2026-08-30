const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const {chromium} = require('playwright-core')

const root = path.resolve(__dirname, '..', 'dist')
const mime = {'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.woff2':'font/woff2'}

const soakArgument = process.argv.find(argument => argument.startsWith('--soak-seconds='))
const realtimeSoakSeconds = soakArgument ? Number(soakArgument.split('=')[1]) : 0
assert(Number.isInteger(realtimeSoakSeconds) && realtimeSoakSeconds >= 0 && realtimeSoakSeconds <= 28800,
  '--soak-seconds must be a whole number from 0 to 28800')

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

async function verifyCapabilityFallbacks(browser, origin) {
  const audioOnlyContext = await browser.newContext()
  await audioOnlyContext.addInitScript(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {configurable: true, value: undefined})
  })
  const audioOnly = await audioOnlyContext.newPage()
  const audioOnlyErrors = []
  audioOnly.on('pageerror', error => audioOnlyErrors.push(error.message))
  await audioOnly.goto(`${origin}/#/sound`, {waitUntil: 'networkidle'})
  await audioOnly.locator('.sound-lab[data-audio-capability="available"][data-midi-capability="unavailable"]').waitFor()
  await audioOnly.locator('.sound-lab__midi').getByText(/Computer-keyboard sound works here/i).waitFor()
  assert.strictEqual(await audioOnly.getByRole('button', {name: 'Find MIDI device'}).isDisabled(), true)
  await audioOnly.getByRole('button', {name: 'Start sound'}).click()
  await audioOnly.locator('.sound-lab[data-audio-state="running"]').waitFor()
  await audioOnly.dispatchEvent('body', 'keydown', {code: 'KeyA', key: 'a'})
  await audioOnly.locator('.sound-lab[data-active-voices="1"]').waitFor()
  await audioOnly.dispatchEvent('body', 'keyup', {code: 'KeyA', key: 'a'})
  await audioOnly.getByRole('button', {name: 'Stop & release'}).click()
  await audioOnly.goto(`${origin}/#/biotron/play`, {waitUntil: 'networkidle'})
  await audioOnly.getByText(/cannot hear your device/i).waitFor()
  assert.strictEqual(await audioOnly.getByRole('button', {name: 'Hear Biotron'}).isDisabled(), true)
  assert.deepStrictEqual(audioOnlyErrors, [])
  await audioOnlyContext.close()

  const deniedContext = await browser.newContext()
  await deniedContext.addInitScript(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async () => { throw new DOMException('Permission denied', 'NotAllowedError') }
    })
  })
  const denied = await deniedContext.newPage()
  const deniedErrors = []
  denied.on('pageerror', error => deniedErrors.push(error.message))
  await denied.goto(`${origin}/#/sound`, {waitUntil: 'networkidle'})
  await denied.getByRole('button', {name: 'Start sound'}).click()
  await denied.locator('.sound-lab[data-audio-state="running"]').waitFor()
  await denied.getByRole('button', {name: 'Find MIDI device'}).click()
  await denied.getByText(/Allow device access, then try again/i).waitFor()
  await denied.getByRole('button', {name: 'Stop & release'}).click()
  await denied.goto(`${origin}/#/biotron/play`, {waitUntil: 'networkidle'})
  await denied.getByRole('button', {name: 'Hear Biotron'}).click()
  await denied.getByText(/Allow device access, then try again/i).waitFor()
  await denied.locator('.sound-lab[data-audio-state="closed"][data-tab-lease="free"]').waitFor()
  assert.deepStrictEqual(deniedErrors, [])
  await deniedContext.close()

  const noAudioContext = await browser.newContext()
  await noAudioContext.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {configurable: true, value: undefined})
    Object.defineProperty(window, 'webkitAudioContext', {configurable: true, value: undefined})
    Object.defineProperty(navigator, 'requestMIDIAccess', {configurable: true, value: async () => ({inputs: new Map()})})
  })
  const noAudio = await noAudioContext.newPage()
  const noAudioErrors = []
  noAudio.on('pageerror', error => noAudioErrors.push(error.message))
  await noAudio.goto(`${origin}/#/sound`, {waitUntil: 'networkidle'})
  await noAudio.locator('.sound-lab[data-audio-capability="unavailable"]').waitFor()
  await noAudio.getByText(/Sound is not available in this browser/i).waitFor()
  assert.strictEqual(await noAudio.getByRole('button', {name: 'Start sound'}).isDisabled(), true)
  assert.strictEqual(await noAudio.getByRole('button', {name: 'Find MIDI device'}).isDisabled(), true)
  await noAudio.goto(`${origin}/#/biotron/play`, {waitUntil: 'networkidle'})
  await noAudio.getByText(/Sound is not available in this browser/i).waitFor()
  assert.strictEqual(await noAudio.getByRole('button', {name: 'Hear Biotron'}).isDisabled(), true)
  assert.deepStrictEqual(noAudioErrors, [])
  await noAudioContext.close()
}

function heapSlopeBytesPerMinute(samples) {
  if (samples.length < 2) return 0
  const meanTime = samples.reduce((sum, sample) => sum + sample.elapsedMilliseconds, 0) / samples.length
  const meanHeap = samples.reduce((sum, sample) => sum + sample.heapBytes, 0) / samples.length
  const numerator = samples.reduce((sum, sample) =>
    sum + (sample.elapsedMilliseconds - meanTime) * (sample.heapBytes - meanHeap), 0)
  const denominator = samples.reduce((sum, sample) =>
    sum + (sample.elapsedMilliseconds - meanTime) ** 2, 0)
  return denominator ? numerator / denominator * 60000 : 0
}

async function runRealtimeSoak(page, devtools, seconds, browserVersion) {
  if (!seconds) return null
  const metric = (list, name) => list.find(item => item.name === name)?.value || 0
  await devtools.send('Performance.enable')
  await devtools.send('HeapProfiler.collectGarbage')
  const startHeap = metric((await devtools.send('Performance.getMetrics')).metrics, 'JSHeapUsedSize')
  const startedAt = Date.now()
  const startAudioTime = await page.evaluate(() => window.__soundContext.currentTime)
  const sampleIntervalMilliseconds = Math.min(30000, Math.max(5000, Math.round(seconds * 1000 / 20)))
  let nextSampleAt = startedAt + sampleIntervalMilliseconds
  const heapSamples = [{elapsedMilliseconds: 0, heapBytes: startHeap}]
  let cycles = 0
  let maxCycleMilliseconds = 0
  while (Date.now() - startedAt < seconds * 1000) {
    const cycleStarted = performance.now()
    await page.evaluate(() => {
      for (let note = 48; note < 56; note += 1) window.__emitSoundMidi([0x90, note, 88])
      for (let note = 48; note < 56; note += 1) window.__emitSoundMidi([0x80, note, 0])
      window.__emitSoundMidi([0xb0, 123, 0])
    })
    await page.locator('.sound-lab[data-active-voices="0"][data-audio-state="running"]').waitFor()
    maxCycleMilliseconds = Math.max(maxCycleMilliseconds, performance.now() - cycleStarted)
    cycles += 1
    if (Date.now() >= nextSampleAt) {
      await devtools.send('HeapProfiler.collectGarbage')
      heapSamples.push({
        elapsedMilliseconds: Date.now() - startedAt,
        heapBytes: metric((await devtools.send('Performance.getMetrics')).metrics, 'JSHeapUsedSize')
      })
      nextSampleAt += sampleIntervalMilliseconds
    }
    await page.waitForTimeout(200)
  }
  await devtools.send('HeapProfiler.collectGarbage')
  const endHeap = metric((await devtools.send('Performance.getMetrics')).metrics, 'JSHeapUsedSize')
  const elapsedMilliseconds = Date.now() - startedAt
  if (heapSamples.at(-1).elapsedMilliseconds !== elapsedMilliseconds) {
    heapSamples.push({elapsedMilliseconds, heapBytes: endHeap})
  }
  const warmupSamples = heapSamples.slice(heapSamples.length >= 5 ? Math.floor(heapSamples.length * 0.2) : 0)
  const heapSlope = heapSlopeBytesPerMinute(warmupSamples)
  const endAudioTime = await page.evaluate(() => window.__soundContext.currentTime)
  const report = {
    schemaVersion: 1,
    browser: browserVersion,
    requestedSeconds: seconds,
    elapsedMilliseconds,
    cycles,
    maxCycleMilliseconds: Math.round(maxCycleMilliseconds * 10) / 10,
    heapGrowthBytes: endHeap - startHeap,
    heapSlopeBytesPerMinute: Math.round(heapSlope),
    heapSampleCount: heapSamples.length,
    audioTimeAdvancedSeconds: Math.round((endAudioTime - startAudioTime) * 10) / 10,
    finalAudioState: await page.locator('.sound-lab').getAttribute('data-audio-state'),
    finalVoices: Number(await page.locator('.sound-lab').getAttribute('data-active-voices')),
    midiConnection: await page.evaluate(() => window.__soundInput.connection)
  }
  assert(report.cycles > 0, 'real-time soak completed no cycles')
  assert(report.maxCycleMilliseconds < 2000, `real-time soak cycle blocked for ${report.maxCycleMilliseconds} ms`)
  assert(report.heapGrowthBytes < 20 * 1024 * 1024, `real-time soak heap grew by ${report.heapGrowthBytes} bytes`)
  assert(report.heapSlopeBytesPerMinute < 1024 * 1024,
    `real-time soak retained-heap slope is ${report.heapSlopeBytesPerMinute} bytes/minute`)
  assert(report.audioTimeAdvancedSeconds >= seconds * 0.8,
    `audio clock advanced only ${report.audioTimeAdvancedSeconds} seconds`)
  assert.strictEqual(report.finalAudioState, 'running')
  assert.strictEqual(report.finalVoices, 0)
  assert.strictEqual(report.midiConnection, 'open')
  console.log(`SOUND_SOAK_REPORT ${JSON.stringify(report)}`)
  return report
}

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
      const serviceInput = {
        id: 'playtronica-in-2', name: 'Biotron Port 2', manufacturer: 'Playtronica',
        state: 'connected', connection: 'closed',
        async open() { this.connection = 'open'; return this },
        async close() { this.connection = 'closed'; return this },
        addEventListener() {}, removeEventListener() {}
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
      window.__soundServiceInput = serviceInput
      window.__addSoundServicePort = () => access.inputs.set(serviceInput.id, serviceInput)
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const devtools = await context.newCDPSession(page)
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
    await devtools.send('Emulation.setCPUThrottlingRate', {rate: 6})
    const constrainedStart = Date.now()
    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.locator('.sound-lab[data-audio-state="running"][data-quality="safe"][data-tab-lease="held"]').waitFor()
    const constrainedStartMilliseconds = Date.now() - constrainedStart
    assert(constrainedStartMilliseconds < 5000, `6x-throttled Low CPU start took ${constrainedStartMilliseconds} ms`)
    assert.strictEqual(await page.getByLabel('Low CPU').isDisabled(), true)
    for (const code of ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG']) {
      await page.dispatchEvent('body', 'keydown', {code, key: code})
    }
    await page.locator('.sound-lab[data-active-voices="4"]').waitFor()
    await page.getByRole('button', {name: 'Stop notes'}).click()
    await page.getByRole('button', {name: 'Find MIDI device'}).click()
    await page.getByRole('button', {name: 'Connect selected'}).click()
    const constrainedBurstMilliseconds = await page.evaluate(() => {
      const started = performance.now()
      for (let index = 0; index < 1000; index += 1) {
        window.__emitSoundMidi([0x90, 36 + index % 48, 100])
      }
      return performance.now() - started
    })
    await page.locator('.sound-lab[data-active-voices="4"]').waitFor()
    assert(constrainedBurstMilliseconds < 3000,
      `6x-throttled Low CPU burst blocked the page for ${constrainedBurstMilliseconds} ms`)
    await page.evaluate(() => window.__emitSoundMidi([0xb0, 123, 0]))
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor()
    await page.getByRole('button', {name: 'Stop & release'}).click()
    await devtools.send('Emulation.setCPUThrottlingRate', {rate: 1})
    await page.getByLabel('Low CPU').uncheck()

    await page.getByRole('button', {name: 'Start sound'}).click()
    await page.locator('.sound-lab[data-audio-state="running"][data-quality="standard"][data-tab-lease="held"]').waitFor()

    await page.dispatchEvent('body', 'keydown', {code: 'KeyA', key: 'ф'})
    await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
    await page.dispatchEvent('body', 'keyup', {code: 'KeyA', key: 'ф'})
    await page.getByRole('button', {name: 'Stop notes'}).click()
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor()

    await page.dispatchEvent('body', 'keydown', {code: 'KeyA', key: 'a'})
    await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
    await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor({timeout: 5000})
    await page.dispatchEvent('body', 'keydown', {code: 'KeyA', key: 'a'})
    await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
    await page.dispatchEvent('body', 'keyup', {code: 'KeyA', key: 'a'})
    await page.getByRole('button', {name: 'Stop notes'}).click()

    await page.getByRole('button', {name: 'Find MIDI device'}).click()
    await page.getByRole('button', {name: 'Connect selected'}).click()
    assert.deepStrictEqual(await page.evaluate(() => window.__soundMidiRequests), [{sysex: false}, {sysex: false}])
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
    const realtimeSoak = await runRealtimeSoak(page, devtools, realtimeSoakSeconds, await browser.version())

    await page.evaluate(() => window.__setSoundInputState('disconnected'))
    await page.getByText(/MIDI disconnected/i).waitFor()
    await page.locator('.sound-lab[data-active-voices="0"]').waitFor()
    await page.getByRole('button', {name: 'Find MIDI device'}).waitFor()
    await page.evaluate(() => window.__setSoundInputState('connected'))
    await page.getByRole('button', {name: 'Connect selected'}).waitFor()
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

    await page.evaluate(() => window.__addSoundServicePort())
    await page.goto(`${origin}/#/biotron/play`, {waitUntil: 'networkidle'})
    await page.getByRole('heading', {name: 'Meet Biotron'}).waitFor()
    await page.locator('.sound-lab[data-reveal-stage="intro"][data-quality="safe"]').waitFor()
    assert.strictEqual(await page.getByRole('link', {name: 'TouchMe'}).count(), 0)
    assert.strictEqual(await page.locator('.offline-status').count(), 0)
    assert.strictEqual(await page.locator('.bottom-panel').count(), 0)
    assert.strictEqual(await page.getByRole('heading', {name: 'Sounds'}).count(), 0)
    await page.getByRole('button', {name: 'Hear Biotron'}).click()
    await page.locator('.sound-lab[data-reveal-stage="ready"][data-audio-state="running"]').waitFor()
    await page.getByText(/Biotron input · Playtronica — Biotron Port 1/i).waitFor()
    assert.deepStrictEqual((await page.evaluate(() => window.__soundMidiRequests)).at(-1), {sysex: false})
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'open')
    assert.strictEqual(await page.evaluate(() => window.__soundServiceInput.connection), 'closed')
    await page.evaluate(() => window.__emitSoundMidi([0x91, 64, 100]))
    await page.locator('.sound-lab[data-reveal-stage="revealed"][data-active-voices="1"]').waitFor()
    await page.getByText(/measured sensor activity and sent a MIDI note/i).waitFor()
    await page.getByRole('button', {name: 'Tune the sound'}).click()
    assert.strictEqual(await page.locator('.sound-lab__reveal-variants .sound-lab__variant').count(), 6)
    await page.evaluate(() => window.__emitSoundMidi([0x91, 64, 0]))
    await page.getByRole('button', {name: 'Stop notes'}).click()
    await page.evaluate(() => { window.__failSoundCloseOnce = true })
    await page.getByRole('link', {name: 'Device settings'}).click()
    await page.getByText(/MIDI did not release/i).waitFor()
    assert.strictEqual(new URL(page.url()).hash, '#/biotron/play')
    assert.strictEqual(await page.getByRole('button', {name: 'Stop & release'}).isEnabled(), true)
    await page.getByRole('button', {name: 'Stop & release'}).click()
    await page.locator('.sound-lab[data-reveal-stage="intro"][data-audio-state="closed"][data-tab-lease="free"]').waitFor()
    assert.strictEqual(await page.evaluate(() => window.__soundInput.connection), 'closed')
    await verifyCapabilityFallbacks(browser, origin)
    assert.deepStrictEqual(errors, [])
    console.log(`Sound browser verified: first-play Biotron reveal, permission/audio-only/no-audio fallbacks, 6 variants, 6x-throttled Low CPU start ${constrainedStartMilliseconds} ms and burst ${constrainedBurstMilliseconds.toFixed(1)} ms, exclusive two-tab handoff, 100/100 lifecycle cycles in ${cycleMilliseconds} ms, 1000 burst ${burstMilliseconds.toFixed(1)} ms, 20000 soak ${soakMilliseconds.toFixed(1)} ms, optional real-time soak ${realtimeSoak ? `${realtimeSoak.elapsedMilliseconds} ms` : 'not requested'}, heap delta ${heapGrowth}, disconnect/background recovery and retryable release.`)
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
})().catch(error => {
  console.error(error)
  server.close(() => process.exit(1))
})

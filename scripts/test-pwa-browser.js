const assert = require('assert')
const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { chromium } = require('playwright-core')

const root = path.resolve(__dirname, '..', 'dist')
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'biotron-pwa-profile-'))
let origin
const mime = {
  '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon',
  '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2'
}
let serviceWorkerVersion = 1
let context

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
    relative = 'index.html'
    file = path.join(root, relative)
  }
  let body = fs.readFileSync(file)
  if (relative === 'service-worker.js') {
    body = Buffer.from(`${body.toString()}\nself.addEventListener('message',event=>{if(event.data&&event.data.type==='TEST_SW_VERSION'&&event.ports[0])event.ports[0].postMessage(${serviceWorkerVersion})})\n`)
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

async function openProfile(online, denyMidiOnce = false) {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: chromePath(),
    headless: true,
    serviceWorkers: 'allow',
    args: ['--no-first-run']
  })
  await context.addInitScript(({ initiallyOnline, initiallyDenyMidi }) => {
    window.__testOnline = initiallyOnline
    window.__midiRequestCount = 0
    window.__midiRequestOptions = []
    window.__midiSent = []
    window.__denyMidiOnce = initiallyDenyMidi
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => window.__testOnline
    })

    let midiMessageListener = null
    let midiStateListener = null
    const input = {
      id: 'biotron-input-1', manufacturer: 'Playtronica', name: 'Biotron',
      connection: 'closed', onmidimessage: null,
      async open() { this.connection = 'open'; return this },
      async close() { this.connection = 'closed'; return this },
      addEventListener(type, listener) { if (type === 'midimessage') midiMessageListener = listener },
      removeEventListener(type, listener) {
        if (type === 'midimessage' && midiMessageListener === listener) midiMessageListener = null
      }
    }
    const output = {
      id: 'biotron-output-1', manufacturer: 'Playtronica', name: 'Biotron',
      connection: 'closed',
      async open() { this.connection = 'open'; return this },
      async close() { this.connection = 'closed'; return this },
      send(data) { window.__midiSent.push(Array.from(data)) }
    }
    const access = {
      inputs: new Map([[input.id, input]]),
      outputs: new Map([[output.id, output]]),
      onstatechange: null,
      addEventListener(type, listener) { if (type === 'statechange') midiStateListener = listener },
      removeEventListener(type, listener) {
        if (type === 'statechange' && midiStateListener === listener) midiStateListener = null
      }
    }
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async options => {
        window.__midiRequestCount += 1
        window.__midiRequestOptions.push(options)
        if (window.__denyMidiOnce) {
          window.__denyMidiOnce = false
          const error = new Error('permission denied for test')
          error.name = 'NotAllowedError'
          throw error
        }
        return access
      }
    })
    window.__emitFirstPlayMidi = data => midiMessageListener?.({data: Uint8Array.from(data)})
    window.__emitSettingsMidi = data => input.onmidimessage?.({data: Uint8Array.from(data)})
  }, { initiallyOnline: online, initiallyDenyMidi: denyMidiOnce })
  await context.setOffline(!online)
  return context.pages()[0] || await context.newPage()
}

async function closeProfile() {
  if (!context) return
  await context.close()
  context = null
}

async function controllerVersion(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No active service worker controller'))
      return
    }
    const channel = new MessageChannel()
    const timeout = setTimeout(() => reject(new Error('Service worker version probe timed out')), 3000)
    channel.port1.onmessage = event => {
      clearTimeout(timeout)
      resolve(event.data)
    }
    navigator.serviceWorker.controller.postMessage({type: 'TEST_SW_VERSION'}, [channel.port2])
  }))
}

;(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${server.address().port}`

  let page = await openProfile(true, true)
  await page.goto(`${origin}/biotron`, { waitUntil: 'load' })
  await page.getByText(/Ready offline —/i).waitFor({state: 'visible', timeout: 15000})
  assert.strictEqual(await controllerVersion(page), 1)
  await page.getByText(/MIDI access was blocked/i).waitFor({state: 'visible', timeout: 5000})
  await page.getByRole('button', {name: /Retry connection/i}).click()
  await waitFor(() => page.evaluate(() => window.__midiRequestCount === 2), 'MIDI permission retry did not run')
  assert.strictEqual(await page.evaluate(() => window.__midiRequestCount), 2, 'MIDI denial did not recover with exactly one retry')
  assert.strictEqual(await page.evaluate(() => window.__midiRequestOptions[0].sysex), true, 'SysEx was not requested in the single MIDI permission flow')

  await page.evaluate(() => {
    window.__installPromptCalls = 0
    const event = new Event('beforeinstallprompt', {cancelable: true})
    event.prompt = async () => { window.__installPromptCalls += 1 }
    event.userChoice = Promise.resolve({outcome: 'accepted'})
    window.dispatchEvent(event)
  })
  await page.getByRole('button', {name: /Install offline app/i}).click()
  assert.strictEqual(await page.evaluate(() => window.__installPromptCalls), 1, 'install prompt was not called exactly once')
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
  await page.getByText('Installed', {exact: true}).waitFor({state: 'visible', timeout: 5000})

  const manifest = await page.evaluate(() => fetch('/manifest.json').then(response => response.json()))
  assert.strictEqual(manifest.name, 'Biotron Settings Offline Beta')
  assert.strictEqual(manifest.id, './biotron-settings-offline-beta')
  assert.strictEqual(manifest.start_url, './#/biotron/play')
  assert.strictEqual(manifest.scope, './')
  assert.strictEqual(manifest.display, 'standalone')
  const devtools = await context.newCDPSession(page)
  const manifestReport = await devtools.send('Page.getAppManifest')
  assert.deepStrictEqual(manifestReport.errors || [], [], 'Chrome rejected the generated PWA manifest')
  const installability = await devtools.send('Page.getInstallabilityErrors')
  assert.deepStrictEqual(installability.installabilityErrors || [], [], 'Chrome reports PWA installability errors')
  console.log('1/7 online install action, Chrome installability, active precache, manifest and MIDI denial/retry verified')

  await closeProfile()
  page = await openProfile(false)
  await page.goto(`${origin}/biotron/play`, { waitUntil: 'load' })
  await waitFor(() => page.url().includes('/#/biotron/play'), 'first-play route was not normalized to the cached hash route')
  await page.getByRole('heading', {name: 'Meet Biotron'}).waitFor({state: 'visible', timeout: 10000})
  assert.strictEqual(await page.locator('.offline-status').count(), 0, 'first-play was crowded by the global offline banner')
  assert.strictEqual(await controllerVersion(page), 1)
  assert.strictEqual(await page.evaluate(() => window.__midiRequestCount), 0, 'first-play requested MIDI before a user gesture')
  await page.getByRole('button', {name: 'Hear Biotron'}).click()
  await page.locator('.sound-lab[data-reveal-stage="settling"][data-audio-state="running"]').waitFor()
  assert.strictEqual(await page.evaluate(() => window.__midiRequestCount), 1, 'first-play did not use exactly one MIDI permission request')
  assert.strictEqual(await page.evaluate(() => window.__midiRequestOptions[0].sysex), false, 'first-play requested unnecessary SysEx access')
  for (const note of [92, 91, 92, 91]) {
    await page.evaluate(value => window.__emitFirstPlayMidi([0x91, value, 90]), note)
    await page.evaluate(value => window.__emitFirstPlayMidi([0x81, value, 0]), note)
    await page.waitForTimeout(70)
  }
  await page.locator('.sound-lab[data-reveal-stage="calibrating"]').waitFor()
  await page.locator('.sound-lab[data-reveal-stage="ready"]').waitFor({timeout: 2000})
  await page.evaluate(() => window.__emitFirstPlayMidi([0x91, 64, 100]))
  await page.locator('.sound-lab[data-reveal-stage="revealed"]').waitFor()
  await page.getByRole('button', {name: 'Stop notes'}).click()
  await page.getByRole('button', {name: 'Stop & release'}).click()
  await page.goto(`${origin}/#/sound`, {waitUntil: 'load'})
  await page.getByRole('heading', {name: 'Play your device'}).waitFor({state: 'visible'})
  await page.getByRole('button', {name: 'Start sound'}).click()
  await page.locator('.sound-lab[data-audio-state="running"]').waitFor()
  await page.dispatchEvent('body', 'keydown', {code: 'KeyA', key: 'ф'})
  await page.locator('.sound-lab[data-active-voices="1"]').waitFor()
  await page.dispatchEvent('body', 'keyup', {code: 'KeyA', key: 'ф'})
  await page.getByRole('button', {name: 'Stop & release'}).click()
  await page.goto(`${origin}/#/biotron`, {waitUntil: 'load'})
  await page.getByText(/Offline — Settings are available/i).waitFor({state: 'visible', timeout: 10000})
  await waitFor(() => page.evaluate(() => window.__midiRequestCount === 2), 'Settings did not request its separate SysEx permission')
  assert.strictEqual(await page.evaluate(() => window.__midiRequestOptions[1].sysex), true, 'Settings did not request SysEx after first-play released input-only MIDI')
  console.log('2/7 full Chrome restart, first-play reveal, cached Sound route and any-layout keyboard with network disabled verified')

  const sendButton = page.getByRole('button', {name: /Send to Device/i})
  await waitFor(() => sendButton.isEnabled(), 'fake Biotron did not connect offline')
  const calibrateButton = page.getByRole('button', {name: /Calibrate plant again/i})
  await waitFor(() => calibrateButton.isEnabled(), 'recalibration control did not become available')
  await calibrateButton.click()
  const recalibrationRequest = await page.evaluate(() => window.__midiSent.find(message =>
    JSON.stringify(message.slice(0, 4)) === JSON.stringify([0xf0, 0x14, 0x0d, 125])
  ))
  assert(recalibrationRequest, 'recalibration SysEx was not sent')
  const calibrationNonce = recalibrationRequest[4]
  await page.evaluate(nonce => window.__emitSettingsMidi([0xf0, 0x0b, 125, nonce, 1, 0xf7]), calibrationNonce)
  await page.getByText('Step away and keep the plant still.').waitFor({state: 'visible'})
  await page.evaluate(nonce => window.__emitSettingsMidi([0xf0, 0x0b, 125, nonce, 2, 0xf7]), calibrationNonce)
  await page.getByText('Measuring… keep the plant and cables still.').waitFor({state: 'visible'})
  await page.evaluate(nonce => window.__emitSettingsMidi([0xf0, 0x0b, 125, nonce, 3, 0xf7]), calibrationNonce)
  await page.getByText('Calibration complete — touch the plant.').waitFor({state: 'visible'})
  const sentBefore = await page.evaluate(() => window.__midiSent.length)
  await sendButton.click()
  await waitFor(
    () => page.evaluate(before => window.__midiSent.length > before, sentBefore),
    'offline setting write did not reach the fake MIDI output'
  )
  assert(await page.evaluate(() => window.__midiSent.some(message => message[0] === 0xF0 && message.at(-1) === 0xF7)), 'no complete SysEx setting was sent offline')
  console.log('3/7 offline Biotron detection, nonce-bound recalibration and SysEx settings write verified')

  await page.getByRole('button', { name: /Update Firmware/i }).click()
  await page.getByText(/Firmware updates require an internet connection/i).waitFor({state: 'visible', timeout: 5000})
  const update = page.locator('.modal.show').getByRole('button', { name: 'Update', exact: true })
  assert(await update.isDisabled(), 'firmware Update remains enabled offline')
  console.log('4/7 offline firmware guard verified')

  await context.setOffline(false)
  await page.evaluate(() => {
    window.__testOnline = true
    window.dispatchEvent(new Event('online'))
  })
  serviceWorkerVersion = 2
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update())
  await waitFor(
    () => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)),
    'updated worker did not enter waiting state'
  )
  assert.strictEqual(await controllerVersion(page), 1, 'updated worker replaced the active session')

  await closeProfile()
  page = await openProfile(false)
  await page.goto(`${origin}/biotron`, {waitUntil: 'load'})
  await page.getByText(/Offline — Settings are available/i).waitFor({state: 'visible', timeout: 10000})
  assert.strictEqual(await controllerVersion(page), 2, 'waiting update did not activate after the browser process closed')
  assert.strictEqual(
    await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)),
    false,
    'old waiting worker remains after deliberate restart'
  )
  console.log('5/7 A→B update stayed non-disruptive, activated after restart and launched offline')

  await context.addInitScript(() => {
    const getRegistration = navigator.serviceWorker.getRegistration.bind(navigator.serviceWorker)
    window.__simulateMissingRegistration = true
    navigator.serviceWorker.getRegistration = (...args) => window.__simulateMissingRegistration
      ? Promise.resolve(undefined)
      : getRegistration(...args)
  })
  await page.reload({waitUntil: 'load'})
  await page.getByText(/Connect once to install the offline copy/i).waitFor({state: 'visible', timeout: 10000})
  console.log('6/7 clean-profile offline failure is truthful and actionable')

  await context.setOffline(false)
  await page.evaluate(() => {
    window.__testOnline = true
    window.__simulateMissingRegistration = false
    window.dispatchEvent(new Event('online'))
  })
  await page.getByRole('button', {name: 'Retry', exact: true}).click()
  await page.getByText(/Ready offline —/i).waitFor({state: 'visible', timeout: 15000})
  await closeProfile()
  page = await openProfile(false)
  await page.goto(`${origin}/biotron`, {waitUntil: 'load'})
  await page.getByText(/Offline — Settings are available/i).waitFor({state: 'visible', timeout: 10000})
  console.log('7/7 Retry repairs offline setup and the same profile launches offline again')

  console.log('Browser PWA verified across persistent-profile restarts: installability, offline app shell, permission/retry, MIDI setting write, firmware guard and controlled update.')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(async () => {
  await closeProfile()
  server.close()
  fs.rmSync(profile, {recursive: true, force: true})
})

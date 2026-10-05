const assert = require('assert')
const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(path.join(__dirname, '../src/registerServiceWorker.js'), 'utf8')
const originalNodeEnv = process.env.NODE_ENV
const originalBaseUrl = process.env.BASE_URL
process.env.NODE_ENV = 'production'
process.env.BASE_URL = '/'

let caseNumber = 0
const loadModule = () => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#case-${++caseNumber}`)
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const bounded = operation => Promise.race([
  operation,
  pause(250).then(() => { throw new Error('Offline setup did not terminate within its deadline') })
])

function environment({ready = Promise.resolve({}), cached = true, controller = {}} = {}) {
  const listeners = new Map()
  const status = []
  const paths = [
    '/index.html?__WB_REVISION__=one', '/manifest.json?__WB_REVISION__=one',
    '/img/icons/icon-192x192.png', '/img/icons/icon-512x512.png',
    '/js/app.123.js', '/css/app.123.css', '/js/biotron.123.js',
    '/js/sound-lab.123.js', '/js/elementary-runtime.123.js'
  ]
  const cache = {
    paths: cached ? paths : paths.filter(value => !value.includes('sound-lab')),
    async keys() { return this.paths.map(value => ({url: `https://test.local${value}`})) }
  }
  const worker = {
    controller,
    ready,
    registration: {},
    registerCalls: 0,
    getRegistration: async () => worker.registration,
    register: async () => { worker.registerCalls++; return worker.registration },
    addEventListener(type, handler) { listeners.set(type, handler) },
    removeEventListener(type, handler) {
      if (listeners.get(type) === handler) listeners.delete(type)
    }
  }
  const window = {
    location: {origin: 'https://test.local', href: 'https://test.local/biotron'},
    caches: {keys: async () => ['web-midi-playtronica-precache-v2'], open: async () => cache},
    setTimeout: (handler, milliseconds) => setTimeout(handler, Math.min(milliseconds, 30)),
    clearTimeout,
    addEventListener() {},
    dispatchEvent(event) { status.push(event.detail) }
  }
  global.window = window
  global.document = {
    querySelectorAll: () => [
      {src: 'https://test.local/js/app.123.js'},
      {href: 'https://test.local/css/app.123.css'}
    ]
  }
  Object.defineProperty(global, 'navigator', {
    configurable: true, value: {serviceWorker: worker, onLine: true}
  })
  return {worker, cache, listeners, status, window}
}

(async () => {
  const previousError = console.error
  console.error = () => {}
  try {
    let env = environment({ready: new Promise(() => {})})
    let module = await loadModule()
    let result = await bounded(module.prepareOfflineAccess())
    assert.deepStrictEqual(result, {state: 'error', code: 'SW_SETUP_TIMEOUT', ready: false})
    assert.equal(env.worker.registerCalls, 1)
    env.worker.ready = Promise.resolve({})
    result = await bounded(module.prepareOfflineAccess())
    assert.equal(result.ready, true, 'Retry after never-resolving ready failed')

    env = environment()
    env.worker.getRegistration = () => new Promise(() => {})
    module = await loadModule()
    assert.equal((await bounded(module.prepareOfflineAccess())).code, 'SW_SETUP_TIMEOUT',
      'Hanging registration lookup escaped the overall deadline')

    let finishRegister
    env = environment()
    env.worker.register = () => new Promise(resolve => { finishRegister = resolve })
    module = await loadModule()
    assert.equal((await bounded(module.prepareOfflineAccess())).code, 'SW_SETUP_TIMEOUT',
      'Hanging update escaped the overall deadline')
    finishRegister(env.worker.registration)
    await pause(20)
    assert.equal(module.getOfflineStatus().ready, false, 'Late update changed expired UI state')
    env.worker.register = async () => env.worker.registration
    assert.equal((await bounded(module.prepareOfflineAccess())).ready, true, 'Update timeout retry failed')

    let finishReady
    env = environment({ready: new Promise(resolve => { finishReady = resolve })})
    module = await loadModule()
    result = await bounded(module.prepareOfflineAccess())
    assert.equal(result.code, 'SW_SETUP_TIMEOUT')
    finishReady({})
    await pause(20)
    assert.equal(module.getOfflineStatus().ready, false, 'Late ready changed expired UI state')
    env.worker.ready = Promise.resolve({})
    assert.equal((await bounded(module.prepareOfflineAccess())).ready, true, 'Late-ready retry failed')

    env = environment()
    env.worker.register = async () => { throw new Error('update failed') }
    module = await loadModule()
    assert.equal((await bounded(module.prepareOfflineAccess())).ready, false, 'Failed update reported ready')
    env.worker.register = async () => env.worker.registration
    assert.equal((await bounded(module.prepareOfflineAccess())).ready, true, 'Update failure retry failed')

    env = environment()
    delete global.navigator.serviceWorker
    module = await loadModule()
    assert.deepStrictEqual(await bounded(module.prepareOfflineAccess()),
      {state: 'unsupported', code: 'SW_UNSUPPORTED', ready: false})

    env = environment({cached: false})
    module = await loadModule()
    assert.deepStrictEqual(await bounded(module.prepareOfflineAccess()),
      {state: 'error', code: 'SW_CACHE_INCOMPLETE', ready: false})
    env.cache.paths.push('/js/sound-lab.123.js')
    assert.equal((await bounded(module.prepareOfflineAccess())).ready, true, 'Incomplete cache retry failed')

    env = environment()
    env.window.caches.keys = () => new Promise(() => {})
    module = await loadModule()
    assert.equal((await bounded(module.prepareOfflineAccess())).code, 'SW_SETUP_TIMEOUT',
      'Hanging cache check escaped the overall deadline')

    env = environment({controller: null})
    module = await loadModule()
    assert.equal((await bounded(module.prepareOfflineAccess())).code, 'SW_SETUP_TIMEOUT')
    assert.equal(env.listeners.size, 0, 'Timed-out controller listener was not removed')
    env.worker.controller = {}
    assert.equal((await bounded(module.prepareOfflineAccess())).ready, true, 'Controller retry failed')

    assert.equal(env.status.at(-1).code, 'SW_READY')
    console.log('Service worker deadline regression passed: hung/late ready, failed update, missing worker/cache/controller, retry')
  } finally {
    console.error = previousError
    process.env.NODE_ENV = originalNodeEnv
    process.env.BASE_URL = originalBaseUrl
  }
})().catch(error => { console.error(error); process.exitCode = 1 })

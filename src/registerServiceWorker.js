export const OFFLINE_STATUS_EVENT = 'playtronica-offline-status'

const SETUP_DEADLINE_MS = 10000
const PRECACHE_PREFIX = 'web-midi-playtronica-precache-'
let offlineStatus = {
  state: process.env.NODE_ENV === 'production' ? 'installing' : 'development',
  code: process.env.NODE_ENV === 'production' ? 'SW_PREPARING' : 'DEVELOPMENT',
  ready: false
}
let setupPromise = null
let setupGeneration = 0

export const getOfflineStatus = () => ({...offlineStatus})

const swError = (message, code) => Object.assign(new Error(message), {code})
const assertCurrent = signal => {
  if (signal.aborted) throw swError('Offline setup timed out.', 'SW_SETUP_TIMEOUT')
}

const publishOfflineStatus = (state, ready = false, code = '') => {
  offlineStatus = {state, code, ready}
  window.dispatchEvent(new CustomEvent(OFFLINE_STATUS_EVENT, {detail: getOfflineStatus()}))
}

const waitForController = signal => new Promise((resolve, reject) => {
  assertCurrent(signal)
  if (navigator.serviceWorker.controller) { resolve(); return }
  const cleanup = () => {
    navigator.serviceWorker.removeEventListener('controllerchange', changed)
    signal.removeEventListener('abort', cancelled)
  }
  const changed = () => {
    if (!navigator.serviceWorker.controller) return
    cleanup()
    resolve()
  }
  const cancelled = () => {
    cleanup()
    reject(swError('Offline setup timed out.', 'SW_SETUP_TIMEOUT'))
  }
  navigator.serviceWorker.addEventListener('controllerchange', changed)
  signal.addEventListener('abort', cancelled, {once: true})
  if (signal.aborted) cancelled()
  else changed()
})

// Workbox stores revisioned URLs with a query string. Check their paths in one
// precache, including the lazy Biotron/Sound chunks and this page's shell assets.
const hasRequiredPrecache = async signal => {
  if (!('caches' in window)) return false
  const base = new URL(process.env.BASE_URL, window.location.origin)
  const relative = url => {
    const path = new URL(url, window.location.href).pathname
    return path.startsWith(base.pathname) ? path.slice(base.pathname.length) : path
  }
  const required = ['index.html', 'manifest.json',
    'img/icons/icon-192x192.png', 'img/icons/icon-512x512.png']
  for (const element of document.querySelectorAll('script[src], link[rel="stylesheet"][href]')) {
    required.push(relative(element.src || element.href))
  }
  const names = await window.caches.keys()
  assertCurrent(signal)
  for (const name of names.filter(value => value.startsWith(PRECACHE_PREFIX))) {
    const cache = await window.caches.open(name)
    assertCurrent(signal)
    const keys = await cache.keys()
    assertCurrent(signal)
    const paths = new Set(keys.map(request => relative(request.url)))
    if (required.every(path => paths.has(path)) &&
        [...paths].some(path => /^js\/biotron\.[^.]+\.js$/.test(path)) &&
        [...paths].some(path => /^js\/sound-lab\.[^.]+\.js$/.test(path)) &&
        [...paths].some(path => /^js\/elementary-runtime\.[^.]+\.js$/.test(path))) return true
  }
  return false
}

const prepare = async signal => {
  const worker = navigator.serviceWorker
  const existingRegistration = await worker.getRegistration()
  assertCurrent(signal)
  if (!existingRegistration && !navigator.onLine) {
    throw swError('First offline installation needs internet.', 'SW_FIRST_INSTALL_OFFLINE')
  }
  if (!existingRegistration || navigator.onLine) {
    await worker.register(`${process.env.BASE_URL}service-worker.js`)
    assertCurrent(signal)
  }
  await worker.ready
  assertCurrent(signal)
  await waitForController(signal)
  assertCurrent(signal)
  if (!await hasRequiredPrecache(signal)) {
    throw swError('The offline cache is incomplete.', 'SW_CACHE_INCOMPLETE')
  }
}

export const prepareOfflineAccess = () => {
  if (setupPromise) return setupPromise
  if (!('serviceWorker' in navigator)) {
    publishOfflineStatus('unsupported', false, 'SW_UNSUPPORTED')
    return Promise.resolve(getOfflineStatus())
  }

  const generation = ++setupGeneration
  const controller = new AbortController()
  setupPromise = (async () => {
    publishOfflineStatus('installing', false, 'SW_PREPARING')
    let timeout
    const deadline = new Promise((_, reject) => {
      timeout = window.setTimeout(() => {
        controller.abort()
        reject(swError('Offline setup timed out.', 'SW_SETUP_TIMEOUT'))
      }, SETUP_DEADLINE_MS)
    })
    try {
      await Promise.race([prepare(controller.signal), deadline])
      if (generation === setupGeneration) publishOfflineStatus('ready', true, 'SW_READY')
    } catch (error) {
      if (generation === setupGeneration) {
        console.error('Could not prepare Settings for offline use:', error)
        publishOfflineStatus('error', false, error.code || 'SW_SETUP_FAILED')
      }
    } finally {
      window.clearTimeout(timeout)
    }
    return getOfflineStatus()
  })().finally(() => {
    if (generation === setupGeneration) setupPromise = null
  })
  return setupPromise
}

if (process.env.NODE_ENV === 'production') {
  window.addEventListener('load', prepareOfflineAccess)
}

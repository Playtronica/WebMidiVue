export const OFFLINE_STATUS_EVENT = 'playtronica-offline-status'

const APPLICATION = 'playtronica-biotron-settings'
const CACHE_PREFIX = 'playtronica-settings'

let offlineStatus = {
  state: process.env.NODE_ENV === 'production' ? 'installing' : 'development',
  code: process.env.NODE_ENV === 'production' ? 'SW_PREPARING' : 'DEVELOPMENT',
  ready: false,
  portable: false,
  version: ''
}
let setupPromise = null

class OfflineSetupError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

export const getOfflineStatus = () => ({...offlineStatus})

const publishOfflineStatus = (state, ready = false, runtime = {}, code = '') => {
  offlineStatus = {
    state,
    code,
    ready,
    portable: Boolean(runtime.portable),
    version: runtime.version || ''
  }
  window.dispatchEvent(new CustomEvent(OFFLINE_STATUS_EVENT, {
    detail: getOfflineStatus()
  }))
}

const detectPortableRuntime = async () => {
  try {
    const response = await fetch('/__biotron/runtime.json', {cache: 'no-store'})
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
    const runtime = await response.json()
    if (runtime.application !== APPLICATION || runtime.portable !== true) return null
    return runtime
  } catch (error) {
    return null
  }
}

const withTimeout = (promise, timeoutMs, error) => new Promise((resolve, reject) => {
  const timeout = window.setTimeout(() => reject(error), timeoutMs)
  promise.then(value => {
    window.clearTimeout(timeout)
    resolve(value)
  }, reason => {
    window.clearTimeout(timeout)
    reject(reason)
  })
})

const waitForController = () => new Promise((resolve, reject) => {
  if (navigator.serviceWorker.controller) {
    resolve()
    return
  }

  const timeout = window.setTimeout(() => {
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    reject(new OfflineSetupError(
      'SW_NO_CONTROLLER',
      'The offline worker is active but does not control this page.'
    ))
  }, 10000)

  const onControllerChange = () => {
    if (!navigator.serviceWorker.controller) return
    window.clearTimeout(timeout)
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    resolve()
  }
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
})

export const collectOfflineDiagnostics = async () => {
  const supported = 'serviceWorker' in navigator
  const registration = supported ? await navigator.serviceWorker.getRegistration().catch(() => null) : null
  const cacheNames = 'caches' in window
    ? (await window.caches.keys().catch(() => [])).filter(name => name.startsWith(CACHE_PREFIX))
    : []
  const worker = workerValue => workerValue ? {
    state: workerValue.state,
    script: new URL(workerValue.scriptURL).pathname
  } : null

  return {
    application: APPLICATION,
    collectedAt: new Date().toISOString(),
    page: `${window.location.origin}${window.location.pathname}`,
    online: navigator.onLine,
    secureContext: window.isSecureContext,
    browser: navigator.userAgent,
    status: getOfflineStatus(),
    serviceWorker: {
      supported,
      controlled: Boolean(supported && navigator.serviceWorker.controller),
      controller: supported ? worker(navigator.serviceWorker.controller) : null,
      scope: registration?.scope || '',
      installing: worker(registration?.installing),
      waiting: worker(registration?.waiting),
      active: worker(registration?.active)
    },
    appCaches: cacheNames
  }
}

export const prepareOfflineAccess = async () => {
  if (setupPromise) return setupPromise
  setupPromise = (async () => {
    publishOfflineStatus('installing', false, {}, 'SW_PREPARING')
    try {
      const portableRuntime = await detectPortableRuntime()
      if (portableRuntime) {
        publishOfflineStatus('portable-ready', true, portableRuntime, 'PORTABLE_READY')
        return getOfflineStatus()
      }

      if (!('serviceWorker' in navigator)) {
        throw new OfflineSetupError('SW_UNSUPPORTED', 'This browser does not support service workers.')
      }

      let registration = await navigator.serviceWorker.getRegistration()
      if (!registration && !navigator.onLine) {
        throw new OfflineSetupError(
          'SW_FIRST_INSTALL_OFFLINE',
          'Settings must finish one online installation before the first offline launch.'
        )
      }

      if (!registration || navigator.onLine) {
        try {
          registration = await navigator.serviceWorker.register(`${process.env.BASE_URL}service-worker.js`)
        } catch (error) {
          throw new OfflineSetupError('SW_REGISTER_FAILED', error.message)
        }
      }

      await withTimeout(
        navigator.serviceWorker.ready,
        15000,
        new OfflineSetupError('SW_READY_TIMEOUT', 'The offline worker did not become ready in time.')
      )
      await waitForController()
      publishOfflineStatus('ready', true, {}, 'SW_READY')
      return getOfflineStatus()
    } catch (error) {
      const code = error.code || 'SW_SETUP_FAILED'
      console.error(`Could not prepare Settings for offline use (${code}):`, error)
      publishOfflineStatus('error', false, {}, code)
      return getOfflineStatus()
    }
  })().finally(() => {
    setupPromise = null
  })
  return setupPromise
}

if (process.env.NODE_ENV === 'production') {
  window.addEventListener('load', prepareOfflineAccess)
}

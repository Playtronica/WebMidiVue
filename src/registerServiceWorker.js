export const OFFLINE_STATUS_EVENT = 'playtronica-offline-status'

let offlineStatus = {
  state: process.env.NODE_ENV === 'production' ? 'installing' : 'development',
  ready: false,
  portable: false,
  version: ''
}

export const getOfflineStatus = () => ({...offlineStatus})

const publishOfflineStatus = (state, ready = false, runtime = {}) => {
  offlineStatus = {
    state,
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
    if (runtime.application !== 'playtronica-biotron-settings' || runtime.portable !== true) return null
    return runtime
  } catch (error) {
    return null
  }
}

const waitForController = () => new Promise((resolve, reject) => {
  if (navigator.serviceWorker.controller) {
    resolve()
    return
  }

  const timeout = window.setTimeout(() => {
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    reject(new Error('The offline worker is active but does not control this page.'))
  }, 10000)

  const onControllerChange = () => {
    if (!navigator.serviceWorker.controller) return
    window.clearTimeout(timeout)
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    resolve()
  }
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
})

if (process.env.NODE_ENV === 'production') {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      publishOfflineStatus('installing')
      try {
        const portableRuntime = await detectPortableRuntime()
        if (portableRuntime) {
          // The portable launcher embeds and serves the complete production
          // build from loopback. It is ready on a clean offline machine and
          // does not need a service worker or a first online installation.
          publishOfflineStatus('portable-ready', true, portableRuntime)
          return
        }
        const existingRegistration = await navigator.serviceWorker.getRegistration()
        // On a later offline launch, use the already installed worker instead
        // of making readiness depend on a network update check.
        if (!existingRegistration || navigator.onLine) {
          await navigator.serviceWorker.register(`${process.env.BASE_URL}service-worker.js`)
        }
        if (!existingRegistration && !navigator.onLine) {
          throw new Error('Settings must be installed once while online.')
        }
        // ready resolves only after a worker has installed and activated. The
        // Workbox precache is complete before installation succeeds.
        await navigator.serviceWorker.ready
        await waitForController()
        publishOfflineStatus('ready', true)
      } catch (error) {
        console.error('Could not prepare Settings for offline use:', error)
        publishOfflineStatus('error')
      }
    })
  } else {
    offlineStatus = {state: 'unsupported', ready: false, portable: false, version: ''}
  }
}

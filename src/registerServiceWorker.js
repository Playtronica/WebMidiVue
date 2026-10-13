export const OFFLINE_STATUS_EVENT = 'playtronica-offline-status'

let offlineStatus = {
  state: process.env.NODE_ENV === 'production' ? 'installing' : 'development',
  ready: false
}

export const getOfflineStatus = () => ({...offlineStatus})

const publishOfflineStatus = (state, ready = false) => {
  offlineStatus = {state, ready}
  window.dispatchEvent(new CustomEvent(OFFLINE_STATUS_EVENT, {
    detail: getOfflineStatus()
  }))
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
    offlineStatus = {state: 'unsupported', ready: false}
  }
}

export const OFFLINE_STATUS_EVENT = 'playtronica-offline-status'

let offlineStatus = {
  state: process.env.NODE_ENV === 'production' ? 'installing' : 'development',
  code: process.env.NODE_ENV === 'production' ? 'SW_PREPARING' : 'DEVELOPMENT',
  ready: false
}
let setupPromise = null

export const getOfflineStatus = () => ({...offlineStatus})

const publishOfflineStatus = (state, ready = false, code = '') => {
  offlineStatus = {state, code, ready}
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
    reject(Object.assign(new Error('The offline worker does not control this page.'), {
      code: 'SW_NO_CONTROLLER'
    }))
  }, 10000)

  const onControllerChange = () => {
    if (!navigator.serviceWorker.controller) return
    window.clearTimeout(timeout)
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    resolve()
  }
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
})

export const prepareOfflineAccess = async () => {
  if (setupPromise) return setupPromise
  if (!('serviceWorker' in navigator)) {
    publishOfflineStatus('unsupported', false, 'SW_UNSUPPORTED')
    return getOfflineStatus()
  }

  setupPromise = (async () => {
    publishOfflineStatus('installing', false, 'SW_PREPARING')
    try {
      const existingRegistration = await navigator.serviceWorker.getRegistration()
      if (!existingRegistration && !navigator.onLine) {
        throw Object.assign(new Error('First offline installation needs internet.'), {
          code: 'SW_FIRST_INSTALL_OFFLINE'
        })
      }
      if (!existingRegistration || navigator.onLine) {
        await navigator.serviceWorker.register(`${process.env.BASE_URL}service-worker.js`)
      }
      await navigator.serviceWorker.ready
      await waitForController()
      publishOfflineStatus('ready', true, 'SW_READY')
    } catch (error) {
      console.error('Could not prepare Settings for offline use:', error)
      publishOfflineStatus('error', false, error.code || 'SW_SETUP_FAILED')
    }
    return getOfflineStatus()
  })().finally(() => {
    setupPromise = null
  })

  return setupPromise
}

if (process.env.NODE_ENV === 'production') {
  window.addEventListener('load', prepareOfflineAccess)
}

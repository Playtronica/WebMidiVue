import {reactive} from 'vue'
import {DEFAULT_VOLUME} from './volume.mjs'

export const soundSessionState = reactive({
  running: false,
  volume: DEFAULT_VOLUME
})

let controller = null

export function registerSoundController(nextController) {
  controller = nextController
}

export function unregisterSoundController(currentController) {
  if (controller === currentController) controller = null
}

export function updateSoundSession(patch) {
  Object.assign(soundSessionState, patch)
}

export async function stopPersistentSound() {
  if (!controller) {
    updateSoundSession({running: false})
    return true
  }
  await controller.stop()
  return !controller.releaseBlocked
}

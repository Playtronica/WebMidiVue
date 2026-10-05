export const MIDI_PROMPT_HINT = 'Allow MIDI, then SysEx: Chrome may ask twice.'

const accessPromises = new Map()
const cancelled = () => Object.assign(new Error('MIDI connection cancelled.'), {name: 'AbortError'})

export function requestSharedMidiAccess({sysex = false, signal} = {}) {
  if (signal?.aborted) return Promise.reject(cancelled())
  if (!globalThis.navigator?.requestMIDIAccess) {
    return Promise.reject(new Error('Web MIDI needs current Chrome or Edge on a computer; Android Chrome is experimental.'))
  }
  const key = sysex ? 'sysex' : 'plain'
  if (!accessPromises.has(key)) {
    let pending
    try { pending = globalThis.navigator.requestMIDIAccess({sysex: Boolean(sysex)}) }
    catch (error) { return Promise.reject(error) }
    const request = Promise.resolve(pending).catch(error => {
      if (accessPromises.get(key) === request) accessPromises.delete(key)
      throw error
    })
    accessPromises.set(key, request)
  }
  const shared = accessPromises.get(key)
  if (!signal) return shared
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(cancelled()); return }
    const abort = () => { signal.removeEventListener('abort', abort); reject(cancelled()) }
    signal.addEventListener('abort', abort, {once: true})
    shared.then(access => {
      signal.removeEventListener('abort', abort)
      if (signal.aborted) reject(cancelled())
      else resolve(access)
    }, error => {
      signal.removeEventListener('abort', abort)
      if (signal.aborted) reject(cancelled())
      else reject(error)
    })
  })
}

export function resetSharedMidiAccessForTests() {
  accessPromises.clear()
}

const accessPromises = new Map()

export function requestSharedMidiAccess({sysex = false} = {}) {
  if (!globalThis.navigator?.requestMIDIAccess) {
    return Promise.reject(new Error('Web MIDI needs current Chrome or Edge on desktop.'))
  }
  const key = sysex ? 'sysex' : 'plain'
  if (!accessPromises.has(key)) {
    const request = globalThis.navigator.requestMIDIAccess({sysex: Boolean(sysex)})
      .catch(error => {
        accessPromises.delete(key)
        throw error
      })
    accessPromises.set(key, request)
  }
  return accessPromises.get(key)
}

export function resetSharedMidiAccessForTests() {
  accessPromises.clear()
}

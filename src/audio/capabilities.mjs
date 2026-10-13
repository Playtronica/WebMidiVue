export function detectSoundCapabilities(runtime = globalThis) {
  return Object.freeze({
    audio: typeof (runtime.AudioContext || runtime.webkitAudioContext) === 'function',
    midi: typeof runtime.navigator?.requestMIDIAccess === 'function',
    tabIsolation: typeof runtime.navigator?.locks?.request === 'function'
  })
}

export function soundCapabilityMessage(capabilities, {requiresMidi = false} = {}) {
  if (!capabilities.audio) {
    return 'Sound is not available in this browser. Open this page in current Chrome or Edge on a desktop computer.'
  }
  if (!capabilities.midi && requiresMidi) {
    return 'This browser can play sound, but it cannot hear your device. Open this page in current Chrome or Edge on a desktop computer.'
  }
  if (!capabilities.midi) {
    return 'Computer-keyboard sound works here. USB devices need current Chrome or Edge on desktop.'
  }
  return ''
}

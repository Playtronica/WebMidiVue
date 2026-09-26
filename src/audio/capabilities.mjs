export function detectSoundCapabilities(runtime = globalThis) {
  return Object.freeze({
    audio: typeof (runtime.AudioContext || runtime.webkitAudioContext) === 'function',
    midi: typeof runtime.navigator?.requestMIDIAccess === 'function'
  })
}

export function soundCapabilityMessage(capabilities, {requiresMidi = false} = {}) {
  if (!capabilities.audio) {
    return 'Sound is not available in this browser. Open this page in current Chrome or Edge on a computer.'
  }
  if (!capabilities.midi && requiresMidi) {
    return 'This browser can play sound, but it cannot hear your device. Use current Chrome or Edge on a computer; Android Chrome is experimental.'
  }
  if (!capabilities.midi) {
    return 'Keyboard and screen sound work here. USB devices need current Chrome or Edge on a computer; Android Chrome is experimental.'
  }
  return ''
}

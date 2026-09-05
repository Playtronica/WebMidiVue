export function detectPlatformCapabilities(runtime = globalThis) {
  const navigator = runtime.navigator || {}

  return Object.freeze({
    audio: typeof (runtime.AudioContext || runtime.webkitAudioContext) === 'function',
    midi: typeof navigator.requestMIDIAccess === 'function',
    secureContext: runtime.isSecureContext !== false
  })
}

export function buildCompatibilityIssue(capabilities, requirements = {}) {
  const productName = requirements.productName || 'This device'

  if ((requirements.requiresMidi || requirements.requiresAudio) && !capabilities.secureContext) {
    return Object.freeze({
      kind: 'security',
      title: 'Open the secure Settings page',
      summary: 'This address cannot use protected browser access to sound and MIDI devices.',
      steps: Object.freeze([
        'Open the official Playtronica Settings link that starts with https://.',
        'Use the latest Chrome or Edge on a computer.',
        'Return to this device page and choose Allow when asked.'
      ]),
      copyLink: false
    })
  }

  // One capability check for every browser: an Android phone with Web MIDI passes, any browser without it stops here.
  if (requirements.requiresMidi && !capabilities.midi) {
    return Object.freeze({
      kind: 'midi',
      title: 'No MIDI in this browser',
      summary: `${productName} connects over Web MIDI, and this browser does not provide it.`,
      steps: Object.freeze([
        'Use Chrome or Edge on a computer or Android phone; on iPhone or iPad, the free MIDIWeb Browser app.'
      ]),
      copyLink: true
    })
  }

  if (requirements.requiresAudio && !capabilities.audio) {
    return Object.freeze({
      kind: 'audio',
      title: 'Sound can’t start in this browser',
      summary: 'This browser does not provide the audio engine needed by Playtronica Sound.',
      steps: Object.freeze([
        'Open this page in the latest Chrome or Edge on a computer.',
        'Check that the browser is allowed to play audio.',
        'Press Start sound again.'
      ]),
      copyLink: true
    })
  }

  return null
}

export function buildMidiAdvisory(capabilities) {
  if (capabilities.midi) return null
  return Object.freeze({
    kind: 'midi-advisory',
    title: 'USB device connection isn’t available here',
    summary: 'You can still try every sound with your computer keyboard. To connect a Playtronica device, open this page in the latest Chrome or Edge.',
    steps: Object.freeze([]),
    copyLink: false
  })
}

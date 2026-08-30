const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i

export function detectPlatformCapabilities(runtime = globalThis) {
  const navigator = runtime.navigator || {}
  const userAgent = navigator.userAgent || ''
  const reportedMobile = navigator.userAgentData?.mobile
  const browserBrands = Array.isArray(navigator.userAgentData?.brands)
    ? navigator.userAgentData.brands.map(item => item.brand).join(' ')
    : ''
  const iPadDesktopMode = /Macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints) > 1

  return Object.freeze({
    audio: typeof (runtime.AudioContext || runtime.webkitAudioContext) === 'function',
    chromium: /Chromium|Google Chrome|Microsoft Edge/i.test(browserBrands) ||
      /(?:Chrome|Chromium|Edg|CriOS)\//i.test(userAgent),
    midi: typeof navigator.requestMIDIAccess === 'function',
    mobile: reportedMobile === true || mobileUserAgent.test(userAgent) || iPadDesktopMode,
    secureContext: runtime.isSecureContext !== false
  })
}

export function buildCompatibilityIssue(capabilities, requirements = {}) {
  const productName = requirements.productName || 'This device'

  if (requirements.requiresDesktop && capabilities.mobile) {
    return Object.freeze({
      kind: 'mobile',
      title: `${productName} needs a computer`,
      summary: 'This phone or tablet can show the page, but USB MIDI setup is not supported here.',
      steps: Object.freeze([
        'Open this page on a Windows, macOS or Linux computer.',
        'Use the latest Chrome or Edge.',
        'Connect your Playtronica device with a USB data cable.'
      ]),
      copyLink: true
    })
  }

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

  if (requirements.requiresChromium && !capabilities.chromium) {
    return Object.freeze({
      kind: 'browser',
      title: 'Open this page in Chrome or Edge',
      summary: `${productName} uses browser MIDI and SysEx features that are not supported here.`,
      steps: Object.freeze([
        'Open this page in the latest Chrome or Edge on your computer.',
        'Connect your Playtronica device with a USB data cable.',
        'Choose Allow when the browser asks for MIDI access.'
      ]),
      copyLink: true
    })
  }

  if (requirements.requiresMidi && !capabilities.midi) {
    return Object.freeze({
      kind: 'midi',
      title: `${productName} can’t connect in this browser`,
      summary: 'This browser does not provide the MIDI connection Playtronica Settings needs.',
      steps: Object.freeze([
        'Open this page in the latest Chrome or Edge on a computer.',
        'Connect your Playtronica device with a USB data cable.',
        'Choose Allow when the browser asks for MIDI access.'
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
  if (capabilities.midi && !capabilities.mobile) return null
  return Object.freeze({
    kind: 'midi-advisory',
    title: capabilities.mobile
      ? 'On-screen sound only on this device'
      : 'USB device connection isn’t available here',
    summary: capabilities.mobile
      ? 'You can try every sound with the keys below. To play from a Playtronica device, open this page in Chrome or Edge on a computer.'
      : 'You can still try every sound with your computer keyboard. To connect a Playtronica device, open this page in the latest Chrome or Edge.',
    steps: Object.freeze([]),
    copyLink: false
  })
}

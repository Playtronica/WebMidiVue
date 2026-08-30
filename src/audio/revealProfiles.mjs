const requiredCopy = [
  'id', 'productName', 'eyebrow', 'title', 'promise', 'introHeading', 'introInstruction',
  'startLabel', 'readyHeading', 'readyInstruction', 'revealedHeading',
  'explanation', 'readyStatus', 'settingsRoute'
]

export function validateRevealProfile(profile) {
  if (!profile || typeof profile !== 'object') throw new TypeError('Reveal profile is required.')
  for (const field of requiredCopy) {
    if (typeof profile[field] !== 'string' || !profile[field].trim()) {
      throw new TypeError(`Reveal profile ${profile.id || '<unknown>'}.${field} is required.`)
    }
  }
  if (!Array.isArray(profile.inputNameTokens) || !profile.inputNameTokens.length) {
    throw new TypeError(`Reveal profile ${profile.id || '<unknown>'}.inputNameTokens is required.`)
  }
  if (!Array.isArray(profile.preferredInputTokens)) {
    throw new TypeError(`Reveal profile ${profile.id || '<unknown>'}.preferredInputTokens must be an array.`)
  }
  return profile
}

const biotron = validateRevealProfile(Object.freeze({
  id: 'biotron',
  productName: 'Biotron',
  inputNameTokens: Object.freeze(['biotron']),
  preferredInputTokens: Object.freeze(['port 1', 'midi 1']),
  eyebrow: 'First play · beta',
  title: 'Meet Biotron',
  promise: 'Make music with a plant.',
  introHeading: 'Hear what it does',
  introInstruction: 'Connect Biotron to a plant and to this computer.',
  startLabel: 'Hear Biotron',
  readyHeading: 'Touch the connected plant',
  readyInstruction: 'Listen for the next note and watch the circle respond.',
  revealedHeading: 'There it is',
  explanation: 'Biotron measured sensor activity and sent a MIDI note. This page turned that note into sound.',
  readyStatus: 'Biotron ready — touch the plant',
  settingsRoute: '/biotron'
}))

export const REVEAL_PROFILES = Object.freeze({biotron})

export function getRevealProfile(id) {
  const profile = REVEAL_PROFILES[id]
  if (!profile) throw new Error(`Unknown reveal profile: ${id || '<empty>'}`)
  return profile
}

const inputText = input => [input?.manufacturer, input?.name]
  .filter(Boolean).join(' ').toLowerCase()

export function selectRevealInput(inputs, profile) {
  validateRevealProfile(profile)
  const candidates = inputs.filter(input => {
    const text = inputText(input)
    return profile.inputNameTokens.some(token => text.includes(token.toLowerCase()))
  })
  if (candidates.length === 1) return candidates[0]

  const preferred = candidates.filter(input => {
    const text = inputText(input)
    return profile.preferredInputTokens.some(token => text.includes(token.toLowerCase()))
  })
  if (preferred.length === 1) return preferred[0]
  if (!candidates.length) {
    throw new Error(`${profile.productName} was not found. Check the USB data cable, then try again.`)
  }
  throw new Error(`More than one ${profile.productName} music input was found. Connect one ${profile.productName}, then try again.`)
}

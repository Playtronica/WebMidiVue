import test from 'node:test'
import assert from 'node:assert/strict'

import {
  KEYBOARD_CODE_TO_NOTE,
  makeNoteKey,
  noteForKeyboardCode,
  parseMidiMessage,
  VoiceLedger
} from '../src/audio/core.mjs'
import {SOUND_VARIANTS, validatePreset} from '../src/audio/presets.mjs'
import {describeMidiAccessError, MidiInputSession} from '../src/audio/midi.mjs'
import {ExclusiveTabLease} from '../src/audio/tabLease.mjs'
import {
  getRevealProfile,
  REVEAL_PROFILES,
  selectRevealInput,
  validateRevealProfile
} from '../src/audio/revealProfiles.mjs'
import {detectSoundCapabilities, soundCapabilityMessage} from '../src/audio/capabilities.mjs'
import {
  buildCompatibilityIssue,
  buildMidiAdvisory,
  detectPlatformCapabilities
} from '../src/compatibility.mjs'

test('physical keyboard mapping is independent from typed character', () => {
  assert.equal(noteForKeyboardCode('KeyA'), 60)
  assert.equal(noteForKeyboardCode('KeyK'), 72)
  assert.equal(noteForKeyboardCode('KeyФ'), null)
  assert.equal(Object.keys(KEYBOARD_CODE_TO_NOTE).length, 13)
  assert.notEqual(makeNoteKey('keyboard', 0, 60), makeNoteKey('midi', 0, 60))
})

test('MIDI note-on, velocity-zero note-off and panic are accepted', () => {
  assert.deepEqual(parseMidiMessage([0x91, 60, 100]), {type: 'note-on', channel: 1, note: 60, velocity: 100})
  assert.deepEqual(parseMidiMessage([0x91, 60, 0]), {type: 'note-off', channel: 1, note: 60})
  assert.deepEqual(parseMidiMessage([0xb0, 123, 0]), {type: 'panic', channel: 0})
})

test('MIDI state exposes the parsed event without exposing SysEx access', () => {
  const states = []
  const engine = {
    activeVoiceCount: 1,
    noteOn() {},
    noteOff() {},
    panic() {}
  }
  const session = new MidiInputSession(engine, state => states.push(state))
  session.input = {id: 'biotron-music'}
  session.onMessage({data: [0x91, 64, 100]})
  assert.deepEqual(states, [{
    type: 'voices',
    count: 1,
    message: {type: 'note-on', channel: 1, note: 64, velocity: 100}
  }])
})

test('voice ledger never exceeds its cap', () => {
  const ledger = new VoiceLedger(4)
  for (let note = 0; note < 40; note += 1) ledger.claim(String(note), note)
  assert.equal(ledger.size, 4)
})

test('sound designer ships exactly six bounded variants', () => {
  assert.equal(SOUND_VARIANTS.length, 6)
  assert.equal(new Set(SOUND_VARIANTS.map(preset => preset.name)).size, 6)
  for (const preset of SOUND_VARIANTS) {
    assert.deepEqual(validatePreset(preset), preset)
    assert.ok(preset.delayFeedback <= 0.72)
    assert.ok(preset.release <= 3)
    assert.ok(preset.vibratoDepth <= 120)
  }
})

test('reveal profiles keep first-use copy plain and product-specific', () => {
  const profile = getRevealProfile('biotron')
  assert.equal(REVEAL_PROFILES.biotron, profile)
  assert.equal(validateRevealProfile(profile), profile)
  const beforeReveal = [
    profile.promise, profile.introHeading, profile.introInstruction,
    profile.startLabel, profile.readyHeading, profile.readyInstruction
  ].join(' ')
  assert.doesNotMatch(beforeReveal, /\b(?:MIDI|SysEx|firmware|channel)\b/i)
  assert.match(beforeReveal, /plant/i)
  assert.match(beforeReveal, /music/i)
  assert.match(profile.explanation, /electrical change/i)
  assert.match(profile.explanation, /MIDI note/i)
  assert.throws(() => getRevealProfile('unknown'), /Unknown reveal profile/)
})

test('reveal input selection is stable for two cables and blocks two devices', () => {
  const profile = getRevealProfile('biotron')
  const port1 = {id: 'a-1', manufacturer: 'Playtronica', name: 'Biotron Port 1'}
  const port2 = {id: 'a-2', manufacturer: 'Playtronica', name: 'Biotron Port 2'}
  const unrelated = {id: 'keys', manufacturer: 'Other', name: 'Keyboard'}
  assert.equal(selectRevealInput([unrelated, port2, port1], profile), port1)
  assert.equal(selectRevealInput([{...port1, name: 'Biotron'}], profile).name, 'Biotron')
  assert.throws(
    () => selectRevealInput([port1, {...port1, id: 'b-1'}], profile),
    /More than one Biotron music input/
  )
  assert.throws(() => selectRevealInput([unrelated], profile), /Biotron was not found/)
})

test('sound capabilities fail closed without hiding the audio-only fallback', () => {
  const AudioContext = class {}
  const full = detectSoundCapabilities({
    AudioContext,
    navigator: {requestMIDIAccess() {}, locks: {request() {}}}
  })
  assert.deepEqual(full, {audio: true, midi: true, tabIsolation: true})
  assert.equal(soundCapabilityMessage(full), '')

  const audioOnly = detectSoundCapabilities({AudioContext, navigator: {}})
  assert.deepEqual(audioOnly, {audio: true, midi: false, tabIsolation: false})
  assert.match(soundCapabilityMessage(audioOnly), /Computer-keyboard sound works/i)
  assert.match(soundCapabilityMessage(audioOnly, {requiresMidi: true}), /cannot hear your device/i)

  const unsupported = detectSoundCapabilities({navigator: {requestMIDIAccess() {}}})
  assert.deepEqual(unsupported, {audio: false, midi: true, tabIsolation: false})
  assert.match(soundCapabilityMessage(unsupported), /Sound is not available/i)
})

test('platform compatibility separates unsupported runtime from denied permission', () => {
  const AudioContext = class {}
  const desktop = detectPlatformCapabilities({
    AudioContext,
    isSecureContext: true,
    navigator: {userAgent: 'Mozilla/5.0 Chrome/140.0', requestMIDIAccess() {}}
  })
  assert.deepEqual(desktop, {audio: true, chromium: true, midi: true, mobile: false, secureContext: true})
  assert.equal(buildCompatibilityIssue(desktop, {requiresMidi: true, requiresDesktop: true}), null)

  const noMidi = detectPlatformCapabilities({
    AudioContext,
    isSecureContext: true,
    navigator: {userAgent: 'Firefox desktop'}
  })
  const midiIssue = buildCompatibilityIssue(noMidi, {requiresMidi: true, productName: 'Biotron'})
  assert.equal(midiIssue.kind, 'midi')
  assert.match(midiIssue.title, /Biotron can’t connect/i)
  assert.match(midiIssue.steps.join(' '), /Chrome or Edge/i)
  assert.match(buildMidiAdvisory(noMidi).summary, /computer keyboard/i)

  const partialFirefox = {...noMidi, midi: true}
  const browserIssue = buildCompatibilityIssue(partialFirefox, {
    requiresMidi: true,
    requiresChromium: true,
    productName: 'Biotron'
  })
  assert.equal(browserIssue.kind, 'browser')
  assert.equal(browserIssue.title, 'Open this page in Chrome or Edge')

  const deniedButSupported = {...desktop}
  assert.equal(buildCompatibilityIssue(deniedButSupported, {requiresMidi: true}), null)
})

test('mobile, insecure and audio-less environments get distinct recovery', () => {
  const AudioContext = class {}
  const mobile = detectPlatformCapabilities({
    AudioContext,
    isSecureContext: true,
    navigator: {userAgentData: {mobile: true}, requestMIDIAccess() {}}
  })
  const mobileIssue = buildCompatibilityIssue(mobile, {
    requiresMidi: true,
    requiresDesktop: true,
    productName: 'Scales'
  })
  assert.equal(mobileIssue.kind, 'mobile')
  assert.equal(mobileIssue.title, 'Scales needs a computer')
  assert.match(buildMidiAdvisory(mobile).title, /On-screen sound only/i)

  const insecure = detectPlatformCapabilities({
    AudioContext,
    isSecureContext: false,
    navigator: {userAgent: 'Desktop'}
  })
  assert.equal(buildCompatibilityIssue(insecure, {requiresMidi: true}).kind, 'security')

  const noAudio = detectPlatformCapabilities({
    isSecureContext: true,
    navigator: {userAgent: 'Mozilla/5.0 Chrome/140.0', requestMIDIAccess() {}}
  })
  assert.equal(buildCompatibilityIssue(noAudio, {requiresAudio: true}).kind, 'audio')
})

test('MIDI permission and security failures use actionable language', () => {
  assert.match(describeMidiAccessError({name: 'NotAllowedError'}), /Allow device access, then try again/i)
  assert.match(describeMidiAccessError({name: 'SecurityError'}), /secure Playtronica Settings address/i)
  assert.equal(describeMidiAccessError(new Error('driver unavailable')), 'driver unavailable')
})

test('failed MIDI close stays retryable and never reports released', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  let closeAttempts = 0
  const states = []
  const engine = {activeVoiceCount: 0, panic() {}}
  const input = new EventTarget()
  Object.assign(input, {
    id: 'input-1', name: 'Biotron test input', manufacturer: 'Playtronica',
    async open() {},
    async close() {
      closeAttempts += 1
      if (closeAttempts === 1) throw new Error('driver refused close')
    }
  })
  const access = new EventTarget()
  access.inputs = new Map([[input.id, input]])
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {requestMIDIAccess: async () => access}
  })
  try {
    const session = new MidiInputSession(engine, state => states.push(state.type))
    await session.connect(input.id)
    await assert.rejects(session.release(), /driver refused close/)
    assert.equal(session.input, input)
    assert.deepEqual(states, ['connected', 'release-error'])
    await session.release()
    assert.equal(session.input, null)
    assert.equal(session.closed, false)
    assert.deepEqual(states, ['connected', 'release-error', 'released'])
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
    else delete globalThis.navigator
  }
})

test('closing during a pending MIDI open cancels and closes the late port', async () => {
  let finishOpen
  let markOpenStarted
  let messageListeners = 0
  let closeCalls = 0
  let stateListeners = 1
  const openStarted = new Promise(resolve => { markOpenStarted = resolve })
  const openGate = new Promise(resolve => { finishOpen = resolve })
  const input = {
    id: 'late-input', name: 'Late input', state: 'connected',
    async open() { markOpenStarted(); await openGate },
    async close() { closeCalls += 1 },
    addEventListener(type) { if (type === 'midimessage') messageListeners += 1 },
    removeEventListener(type) { if (type === 'midimessage') messageListeners -= 1 }
  }
  const access = {
    inputs: new Map([[input.id, input]]),
    addEventListener(type) { if (type === 'statechange') stateListeners += 1 },
    removeEventListener(type) { if (type === 'statechange') stateListeners -= 1 }
  }
  const session = new MidiInputSession({activeVoiceCount: 0, panic() {}})
  session.access = access
  const connecting = session.connect(input.id)
  await openStarted
  const closing = session.close()
  finishOpen()
  await assert.rejects(connecting, /cancelled/i)
  await closing
  assert.equal(closeCalls, 1)
  assert.equal(messageListeners, 0)
  assert.equal(stateListeners, 0)
  assert.equal(session.input, null)
  assert.equal(session.access, null)
})

test('closing during MIDI permission discards late access without listeners', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  let finishAccess
  let stateListeners = 0
  const accessGate = new Promise(resolve => { finishAccess = resolve })
  const access = {
    inputs: new Map(),
    addEventListener(type) { if (type === 'statechange') stateListeners += 1 },
    removeEventListener(type) { if (type === 'statechange') stateListeners -= 1 }
  }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {requestMIDIAccess: async () => accessGate}
  })
  try {
    const session = new MidiInputSession({activeVoiceCount: 0, panic() {}})
    const requesting = session.requestAccess()
    await session.close()
    finishAccess(access)
    await assert.rejects(requesting, /cancelled/i)
    assert.equal(stateListeners, 0)
    assert.equal(session.access, null)
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
    else delete globalThis.navigator
  }
})

test('background-disabled MIDI is silent until explicitly enabled', () => {
  let noteOns = 0
  let panics = 0
  const engine = {
    activeVoiceCount: 0,
    noteOn() { noteOns += 1 },
    noteOff() {},
    panic() { panics += 1 }
  }
  const session = new MidiInputSession(engine)
  session.input = {id: 'input-1'}

  session.onMessage({data: [0x90, 60, 100]})
  session.setEnabled(false)
  session.onMessage({data: [0x90, 61, 100]})
  assert.equal(noteOns, 1)
  assert.equal(panics, 1)

  session.setEnabled(true)
  session.onMessage({data: [0x90, 62, 100]})
  assert.equal(noteOns, 2)
})

test('MIDI port state changes refresh only connected inputs', () => {
  const states = []
  let panics = 0
  let removedMessages = 0
  const engine = {activeVoiceCount: 0, panic() { panics += 1 }}
  const session = new MidiInputSession(engine, state => states.push(state))
  const first = {
    id: 'one', name: 'First', state: 'connected',
    removeEventListener(type, listener) {
      assert.equal(type, 'midimessage')
      assert.equal(listener, session.boundMessage)
      removedMessages += 1
    }
  }
  const second = {id: 'two', name: 'Second', state: 'disconnected'}
  session.access = {inputs: new Map([[first.id, first], [second.id, second]])}

  session.onStateChange({port: second})
  assert.deepEqual(states.at(-1), {
    type: 'ports',
    inputs: [{id: 'one', name: 'First', manufacturer: ''}]
  })

  first.state = 'disconnected'
  second.state = 'connected'
  session.input = first
  session.onStateChange({port: first})
  assert.equal(session.input, null)
  assert.equal(removedMessages, 1)
  assert.equal(panics, 1)
  assert.deepEqual(states.at(-1), {
    type: 'ports',
    inputs: [{id: 'two', name: 'Second', manufacturer: ''}]
  })
})

test('only one tab lease can be held and release enables handoff', async () => {
  const locks = {
    held: false,
    async request(name, options, callback) {
      assert.equal(name, 'sound-test')
      assert.equal(options.ifAvailable, true)
      if (this.held) return callback(null)
      this.held = true
      try { return await callback({name}) }
      finally { this.held = false }
    }
  }
  const first = new ExclusiveTabLease(locks, 'sound-test')
  const second = new ExclusiveTabLease(locks, 'sound-test')

  assert.equal(await first.acquire(), true)
  assert.equal(await second.acquire(), false)
  first.release()
  await first.task
  assert.equal(await second.acquire(), true)
  second.release()
  await second.task
})

test('audio-only fallback stays usable without Web Locks', async () => {
  const lease = new ExclusiveTabLease(null)
  assert.equal(lease.protected, false)
  assert.equal(await lease.acquire(), true)
  assert.equal(lease.held, true)
  lease.release()
  assert.equal(lease.held, false)
})

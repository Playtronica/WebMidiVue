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
import {MidiInputSession} from '../src/audio/midi.mjs'
import {ExclusiveTabLease} from '../src/audio/tabLease.mjs'

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
    assert.deepEqual(states, ['connected', 'release-error', 'released'])
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
  const engine = {activeVoiceCount: 0, panic() {}}
  const session = new MidiInputSession(engine, state => states.push(state))
  const first = {id: 'one', name: 'First', state: 'connected'}
  const second = {id: 'two', name: 'Second', state: 'disconnected'}
  session.access = {inputs: new Map([[first.id, first], [second.id, second]])}

  session.onStateChange({port: second})
  assert.deepEqual(states.at(-1), {
    type: 'ports',
    inputs: [{id: 'one', name: 'First', manufacturer: ''}]
  })

  first.state = 'disconnected'
  second.state = 'connected'
  session.onStateChange({port: first})
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

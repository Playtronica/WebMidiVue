import assert from 'node:assert/strict'
import test from 'node:test'
import {delay, withMidiWriteSession} from '../src/assets/js/timing.mjs'

test('delay yields to the browser event loop', async () => {
  let timerRan = false
  setTimeout(() => { timerRan = true }, 0)
  await delay(5)
  assert.equal(timerRan, true)
})

test('delay rejects invalid durations', async () => {
  await assert.rejects(delay(-1), RangeError)
  await assert.rejects(delay(Number.NaN), RangeError)
  await assert.doesNotReject(delay(0))
})

test('MIDI write session stops on device switch and never writes to the replacement', async () => {
  const sent = []
  const original = {state: 'connected', connection: 'open', send: data => sent.push(data)}
  const replacement = {state: 'connected', connection: 'open', send: () => assert.fail('replacement write')}
  let current = original

  const completed = await withMidiWriteSession(original, () => current, async output => {
    output.send([1])
    current = replacement
    await output.wait(0)
    output.send([2])
  })

  assert.equal(completed, false)
  assert.deepEqual(sent, [[1]])
})

test('MIDI write session stops after disconnect or close', async () => {
  for (const state of [{state: 'disconnected', connection: 'open'}, {state: 'connected', connection: 'closed'}]) {
    const device = {state: 'connected', connection: 'open', send() {}}
    const completed = await withMidiWriteSession(device, () => device, async output => {
      Object.assign(device, state)
      output.send([1])
    })
    assert.equal(completed, false)
  }
})

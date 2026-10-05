import test from 'node:test'
import assert from 'node:assert/strict'
import {setImmediate} from 'node:timers/promises'
import {ElementarySynthEngine} from '../src/audio/elementary/engine.mjs'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return {promise, resolve, reject}
}

function engineWithSetters(setters = {}) {
  const engine = new ElementarySynthEngine({
    currentTime: 0, state: 'running', addEventListener() {}
  })
  const resolved = () => Promise.resolve()
  engine.ready = true
  engine.freqSetters = Array(8).fill(setters.freq || resolved)
  engine.velSetters = Array(8).fill(setters.vel || resolved)
  engine.gateSetters = Array(8).fill(setters.gate || resolved)
  return engine
}

for (const count of [1000, 10000]) {
  test(`${count} note pairs retain no settled ref updates`, async () => {
    const engine = engineWithSetters()
    for (let index = 0; index < count; index++) {
      engine.noteOn('plant', 0, 60)
      engine.noteOff('plant', 0, 60)
    }
    await setImmediate()
    assert.equal(engine.activeVoiceCount, 0)
    assert.equal(engine._pending.size ?? engine._pending.length, 0)
  })
}

test('whenIdle includes ref updates added while it waits', async () => {
  const first = deferred()
  const second = deferred()
  const engine = engineWithSetters({
    freq: () => first.promise,
    gate: ({value}) => value === 0 ? second.promise : Promise.resolve()
  })
  engine.noteOn('plant', 0, 60)
  let finished = false
  const waiting = engine.whenIdle().then(() => { finished = true })
  engine.noteOff('plant', 0, 60)
  first.resolve()
  await setImmediate()
  assert.equal(finished, false, 'barrier finished before the later gate update')
  second.resolve()
  await waiting
  assert.equal(engine._pending.size ?? engine._pending.length, 0)
})

test('rejected setter is observed, reported once, and permits a later barrier', async () => {
  const failure = new Error('worklet refused update')
  const engine = engineWithSetters({freq: () => Promise.reject(failure)})
  engine.noteOn('plant', 0, 60)
  await setImmediate()
  await assert.rejects(engine.whenIdle(), error => error === failure)
  assert.equal(engine._pending.size ?? engine._pending.length, 0)
  engine.freqSetters.fill(() => Promise.resolve())
  engine.noteOn('plant', 0, 61)
  await engine.whenIdle()
  assert.equal(engine._pending.size ?? engine._pending.length, 0)
})

test('concurrent idle barriers both receive the same setter failure', async () => {
  const gate = deferred()
  const failure = new Error('worklet refused update')
  const engine = engineWithSetters({freq: () => gate.promise})
  engine.noteOn('plant', 0, 60)
  const first = engine.whenIdle()
  const second = engine.whenIdle()
  gate.reject(failure)
  const results = await Promise.allSettled([first, second])
  assert.deepEqual(results.map(result => result.status), ['rejected', 'rejected'])
  assert(results.every(result => result.reason === failure))
  await engine.whenIdle()
})

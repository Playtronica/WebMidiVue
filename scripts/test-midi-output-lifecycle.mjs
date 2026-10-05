import test from 'node:test'
import assert from 'node:assert/strict'
import {MidiInputSession} from '../src/audio/midi.mjs'

const command = [0xf0, 0x14, 0x0d, 125, 7, 0xf7]

function deferred() {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return {promise, resolve, reject}
}

function fixture({delayedOpen = false, closeError = null} = {}) {
  const gate = deferred()
  const started = deferred()
  const sent = []
  const input = {
    id: 'in-1', name: 'Biotron', manufacturer: 'Playtronica', state: 'connected',
    async open() {}, async close() {}, addEventListener() {}, removeEventListener() {}
  }
  const output = {
    id: 'out-1', name: input.name, manufacturer: input.manufacturer, state: 'connected',
    openCalls: 0, closeCalls: 0,
    open() {
      this.openCalls++
      started.resolve()
      return delayedOpen ? gate.promise : Promise.resolve()
    },
    send(data) { sent.push([...data]) },
    async close() {
      this.closeCalls++
      if (closeError) throw closeError
    }
  }
  const access = {
    inputs: new Map([[input.id, input]]), outputs: new Map([[output.id, output]]),
    removeEventListener() {}
  }
  const session = new MidiInputSession({panic() {}}, () => {}, {sysex: true})
  session.input = input
  session.access = access
  return {session, input, output, access, gate, started: started.promise, sent}
}

test('late output open after Stop cannot send SysEx and is closed', async () => {
  const f = fixture({delayedOpen: true})
  const sending = f.session.sendToPairedOutput(command)
  await f.started
  await f.session.close()
  f.gate.resolve()
  await assert.rejects(sending, /cancelled/i)
  assert.deepEqual(f.sent, [])
  assert.equal(f.output.closeCalls, 1)
  const next = new MidiInputSession({panic() {}}, () => {}, {sysex: true})
  next.access = f.access
  await next.connect(f.input.id)
  f.output.open = async () => {}
  await next.sendToPairedOutput(command)
  assert.deepEqual(f.sent, [command])
  await next.close()
})

test('late output open rejection after Stop is reported and cleaned up', async () => {
  const f = fixture({delayedOpen: true})
  const sending = f.session.sendToPairedOutput(command)
  await f.started
  await f.session.close()
  f.gate.reject(new Error('open failed'))
  await assert.rejects(sending, /open failed/)
  assert.deepEqual(f.sent, [])
  assert.equal(f.output.closeCalls, 1)
})

test('normal send keeps exact wire bytes and a new session can reconnect', async () => {
  const f = fixture()
  await f.session.sendToPairedOutput(command)
  assert.deepEqual(f.sent, [command])
  assert.equal(f.output.closeCalls, 1)
  await f.session.close()
  const next = new MidiInputSession({panic() {}}, () => {}, {sysex: true})
  next.access = f.access
  await next.connect(f.input.id)
  await next.sendToPairedOutput(command)
  assert.deepEqual(f.sent, [command, command])
  assert.equal(f.output.closeCalls, 2)
  await next.close()
})

test('close failure preserves cancellation as primary error', async () => {
  const cleanupError = new Error('output close failed')
  const f = fixture({delayedOpen: true, closeError: cleanupError})
  const sending = f.session.sendToPairedOutput(command)
  await f.started
  await f.session.close()
  f.gate.resolve()
  await assert.rejects(sending, error => {
    assert(error instanceof AggregateError)
    assert.match(error.errors[0].message, /cancelled/i)
    assert.equal(error.errors[1], cleanupError)
    return true
  })
  assert.deepEqual(f.sent, [])
  assert.equal(f.output.closeCalls, 1)
})

test('open failure stays primary when cleanup also fails', async () => {
  const cleanupError = new Error('output close failed')
  const openError = new Error('output open failed')
  const f = fixture({delayedOpen: true, closeError: cleanupError})
  const sending = f.session.sendToPairedOutput(command)
  await f.started
  f.gate.reject(openError)
  await assert.rejects(sending, error => {
    assert(error instanceof AggregateError)
    assert.deepEqual(error.errors, [openError, cleanupError])
    return true
  })
  assert.deepEqual(f.sent, [])
})

test('cleanup failure after a successful send is visible', async () => {
  const cleanupError = new Error('output close failed')
  const f = fixture({closeError: cleanupError})
  await assert.rejects(f.session.sendToPairedOutput(command), error => error === cleanupError)
  assert.deepEqual(f.sent, [command])
  assert.equal(f.output.closeCalls, 1)
})

test('replacement of selected input while output opens cancels old command', async () => {
  const f = fixture({delayedOpen: true})
  const sending = f.session.sendToPairedOutput(command)
  await f.started
  f.session.input = {id: 'in-2', name: 'Biotron', manufacturer: 'Playtronica'}
  f.gate.resolve()
  await assert.rejects(sending, /cancelled/i)
  assert.deepEqual(f.sent, [])
  assert.equal(f.output.closeCalls, 1)
})

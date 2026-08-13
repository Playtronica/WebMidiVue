const assert = require('assert')
const fs = require('fs')
const vm = require('vm')

const source = fs.readFileSync('src/components/MidiComponents/DeviceSelector.vue', 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const scheduled = new Map()
let timerId = 0
const context = {
  module: { exports: {} },
  exports: {},
  console: { log() {} },
  setTimeout(callback) { scheduled.set(++timerId, callback); return timerId },
  clearTimeout(id) { scheduled.delete(id) }
}
vm.runInNewContext(script.replace('export default', 'module.exports ='), context)
const component = context.module.exports

function deferred() {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function port(id, name = 'Biotron', overrides = {}) {
  return {
    id, name, manufacturer: 'Playtronica', state: 'connected', connection: 'closed',
    sent: [], closeCalls: 0, openCalls: 0,
    async open() { this.openCalls++; this.connection = 'open' },
    async close() { this.closeCalls++; this.connection = 'closed' },
    send(message) { this.sent.push(message) },
    ...overrides
  }
}

function instance(props = {}) {
  const state = component.data()
  const events = []
  const target = {
    ...state,
    regexName: /Biotron/,
    checkVersionsFlag: true,
    ...props,
    $emit(name, value) { events.push([name, value]) }
  }
  for (const [name, method] of Object.entries(component.methods)) target[name] = method.bind(target)
  target.events = events
  return target
}

async function releaseFailureStaysVisible() {
  const output = port('out-1', 'Biotron', { async close() { this.closeCalls++; throw new Error('busy') } })
  const input = port('in-1')
  const target = instance({ selectedDevice: { input, output } })
  await target.releaseMidi()
  assert.strictEqual(target.released, false)
  assert.strictEqual(target.selectedDevice.output, output)
  assert.match(target.midiError, /Could not release: Biotron/)
  assert.strictEqual(target.events.at(-1)[0], 'device_changed')
  assert.strictEqual(target.events.at(-1)[1], undefined)
}

async function delayedQueryIsCancelled() {
  scheduled.clear()
  const first = { input: port('in-1'), output: port('out-1') }
  const second = { input: port('in-2'), output: port('out-2') }
  const target = instance({ devices: [first, second] })
  await target.deviceChanged()
  assert.strictEqual(scheduled.size, 1)
  target.currentMidiNum = 1
  await target.deviceChanged()
  assert.strictEqual(scheduled.size, 1, 'stale version query was not cancelled')
  for (const callback of scheduled.values()) callback()
  assert.strictEqual(first.output.sent.length, 0)
  assert.strictEqual(JSON.stringify(second.output.sent), JSON.stringify([[240, 20, 13, 126, 1, 247]]))
}

async function reconnectOpenFailure() {
  const output = port('out-1', 'Biotron', { async open() { this.openCalls++; throw new Error('owned by DAW') } })
  const midi = { inputs: new Map(), outputs: new Map([['out-1', output]]), onstatechange: null }
  const target = instance({ midiAccess: midi, released: true })
  await target.connectMidi()
  assert.strictEqual(target.released, false)
  assert.strictEqual(target.selectedDevice, null)
  assert.match(target.midiError, /Could not open the selected device/)
  assert.strictEqual(target.events.at(-1)[0], 'device_changed')
  assert.strictEqual(target.events.at(-1)[1], undefined)
}

async function unmountCancelsPendingOpen() {
  scheduled.clear()
  const opening = deferred()
  const output = port('out-1', 'Biotron', { open() { this.openCalls++; return opening.promise } })
  const input = port('in-1')
  const target = instance({ devices: [{ input, output }] })
  const selecting = target.deviceChanged()
  component.beforeUnmount.call(target)
  opening.resolve()
  await selecting
  await Promise.resolve()
  assert.strictEqual(target.unmounted, true)
  assert.strictEqual(scheduled.size, 0)
  assert.strictEqual(output.closeCalls, 1)
  assert.strictEqual(input.closeCalls, 1)
  assert.strictEqual(target.events.length, 0, 'unmounted component emitted a device')
}

async function duplicateDevicesStayDistinct() {
  const input1 = port('in-1')
  const input2 = port('in-2')
  const output1 = port('out-1')
  const output2 = port('out-2')
  const midi = {
    inputs: new Map([[input1.id, input1], [input2.id, input2]]),
    outputs: new Map([[output1.id, output1], [output2.id, output2]])
  }
  const target = instance()
  const pairs = target.pairDevices(midi)
  assert.strictEqual(pairs.length, 2)
  assert.strictEqual(pairs[0].output, output1)
  assert.strictEqual(pairs[0].input, input1)
  assert.strictEqual(pairs[1].output, output2)
  assert.strictEqual(pairs[1].input, input2)
  assert.notStrictEqual(pairs[0].input, pairs[1].input, 'duplicate outputs collapsed onto one input')
}

;(async () => {
  await releaseFailureStaysVisible()
  await delayedQueryIsCancelled()
  await reconnectOpenFailure()
  await unmountCancelsPendingOpen()
  await duplicateDevicesStayDistinct()
  console.log('MIDI lifecycle verified: release failure, delayed cancellation, reconnect failure, unmount, duplicate-device separation.')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

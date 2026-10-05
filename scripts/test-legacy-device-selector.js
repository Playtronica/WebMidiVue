const assert = require('assert')
const fs = require('fs')
const vm = require('vm')

const source = fs.readFileSync('src/components/MidiComponents/DeviceSelector.vue', 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
const scheduled = new Map()
let nextTimeout = 1
const context = {
  module: {exports: {}},
  exports: {},
  console: {log() {}},
  setTimeout(callback) { const id = nextTimeout++; scheduled.set(id, callback); return id },
  clearTimeout(id) { scheduled.delete(id) }
}
vm.runInNewContext(script.replace('export default', 'module.exports ='), context)
const component = context.module.exports

function input(id, name) {
  return {id, name, onmidimessage: null}
}

function output(id, name) {
  return {
    id, name, state: 'connected', connection: 'open', openCalls: 0, closeCalls: 0, sent: [],
    async open() { this.openCalls++ },
    async close() { this.closeCalls++; this.connection = 'closed' },
    send(message) { this.sent.push(Array.from(message)) }
  }
}

function instance({checkVersionsFlag = false} = {}) {
  const events = []
  const target = {
    ...component.data(), regexName: 'Biotron', checkVersionsFlag,
    $emit(name, value) { events.push([name, value]) }
  }
  for (const [name, method] of Object.entries(component.methods)) target[name] = method.bind(target)
  return {target, events}
}

function access(inputs, outputs) {
  return {
    inputs: new Map(inputs.map(port => [port.id, port])),
    outputs: new Map(outputs.map(port => [port.id, port])),
    onstatechange: null
  }
}

;(async () => {
  const matchingInput = input('in-1', 'Biotron')
  const otherInput = input('in-2', 'Other device')
  const matchingOutput = output('out-1', 'Biotron')
  const otherOutput = output('out-2', 'Other device')
  const emitted = []
  const target = {
    ...component.data(),
    regexName: 'Biotron',
    checkVersionsFlag: true,
    $emit(name, value) { emitted.push([name, value]) }
  }
  for (const [name, method] of Object.entries(component.methods)) target[name] = method.bind(target)

  await target.initDevices({
    inputs: new Map([[matchingInput.id, matchingInput], [otherInput.id, otherInput]]),
    outputs: new Map([[matchingOutput.id, matchingOutput], [otherOutput.id, otherOutput]])
  })

  assert.equal(matchingOutput.openCalls, 1, 'matching output was not explicitly opened')
  assert.equal(otherOutput.openCalls, 0, 'non-matching output was opened')
  assert.equal(typeof matchingInput.onmidimessage, 'function')
  assert.equal(otherInput.onmidimessage, null, 'non-matching input received a handler')
  assert.deepStrictEqual(matchingOutput.sent, [], 'device selector sent an invalid dummy MIDI message')
  assert.strictEqual(emitted.at(-1)[1], matchingOutput)

  for (const callback of scheduled.values()) callback()
  assert.deepStrictEqual(matchingOutput.sent, [[240, 20, 13, 126, 0, 247]])

  matchingOutput.connection = 'open'
  await target.initDevices({
    inputs: new Map([[matchingInput.id, matchingInput]]),
    outputs: new Map([[matchingOutput.id, matchingOutput]])
  })
  assert.equal(scheduled.size, 1, 'refresh left an old version timer active')
  component.beforeUnmount.call(target)
  assert.equal(scheduled.size, 0, 'unmount left a version timer active')
  assert.equal(matchingInput.onmidimessage, null)
  assert.equal(matchingOutput.closeCalls, 1)
  assert.strictEqual(emitted.at(-1)[1], undefined)

  // Exercise the production component methods, including delayed mount and unmount.
  const first = input('first', 'Biotron')
  const second = input('second', 'Biotron')
  const outFirst = output('out-first', 'Biotron')
  const outSecond = output('out-second', 'Biotron')
  const ports = access([first, second], [outFirst, outSecond])
  const multi = instance()
  let messages = 0
  const handle = multi.target.handleMidiMessage
  multi.target.handleMidiMessage = event => { messages++; handle(event) }
  await multi.target.midiReady(ports)
  assert.deepStrictEqual(Object.keys(multi.target.midiIn).sort(), ['first', 'second'])
  const firstCallback = first.onmidimessage
  firstCallback({data: [0xf0, 0x0b, 126, 0, 1, 2, 3, 0xf7]})
  assert.equal(messages, 1)

  ports.inputs.delete(first.id)
  ports.outputs.delete(outFirst.id)
  ports.onstatechange({target: ports})
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(first.onmidimessage, null, 'hotplug left a callback on the removed input')
  assert.equal(outFirst.closeCalls, 1, 'hotplug left the removed output open')
  assert.equal(typeof second.onmidimessage, 'function')
  second.onmidimessage({data: [0xf0, 0x0b, 126, 0, 1, 2, 3, 0xf7]})
  assert.equal(messages, 2, 'refresh delivered a note more than once')
  const staleState = ports.onstatechange
  component.beforeUnmount.call(multi.target)
  staleState({target: ports})
  await new Promise(resolve => setImmediate(resolve))
  firstCallback({data: [0xf0, 0x0b, 126, 0, 1, 2, 3, 0xf7]})
  assert.equal(messages, 2, 'queued callback fired after unmount')
  assert.equal(second.onmidimessage, null)
  assert.equal(ports.onstatechange, null)
  assert.equal(outSecond.closeCalls, 1)

  let grantAccess
  const permission = new Promise(resolve => { grantAccess = resolve })
  const lateInput = input('late', 'Biotron')
  const lateOutput = output('late-out', 'Biotron')
  const lateAccess = access([lateInput], [lateOutput])
  context.navigator = {requestMIDIAccess: () => permission}
  const pendingMount = instance()
  component.mounted.call(pendingMount.target)
  component.beforeUnmount.call(pendingMount.target)
  grantAccess(lateAccess)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(lateAccess.onstatechange, null, 'late grant reattached state listener')
  assert.equal(lateInput.onmidimessage, null, 'late grant reattached input listener')
  assert.equal(lateOutput.openCalls, 0, 'late grant reopened a released output')

  let finishOpen
  const opening = output('pending-out', 'Biotron')
  opening.open = () => new Promise(resolve => { opening.openCalls++; finishOpen = resolve })
  const openingInput = input('pending-in', 'Biotron')
  const pending = instance({checkVersionsFlag: true})
  const refreshing = pending.target.midiReady(access([openingInput], [opening]))
  assert.equal(typeof finishOpen, 'function')
  component.beforeUnmount.call(pending.target)
  finishOpen()
  await refreshing
  assert.equal(openingInput.onmidimessage, null)
  assert.equal(scheduled.size, 0, 'late open scheduled a version query')
  assert.strictEqual(pending.events.at(-1)[1], undefined, 'late open emitted a device after unmount')
  assert(opening.closeCalls >= 1, 'late-open output was not closed')

  const failedInput = input('failed-in', 'Biotron')
  const failedOutput = output('failed-out', 'Biotron')
  failedOutput.open = async function () {
    this.openCalls++
    throw new Error('driver refused open')
  }
  const failed = instance()
  await assert.rejects(failed.target.midiReady(access([failedInput], [failedOutput])), /driver refused open/)
  assert.equal(failedInput.onmidimessage, null, 'failed open left the input subscribed')
  assert.equal(failedOutput.closeCalls, 1, 'failed open left the output owned')
  assert.deepStrictEqual(Object.keys(failed.target.midiOut), [])
  component.beforeUnmount.call(failed.target)

  const reusedInput = input('cycle-in', 'Biotron')
  const reusedOutput = output('cycle-out', 'Biotron')
  const reusedAccess = access([reusedInput], [reusedOutput])
  for (let cycle = 0; cycle < 100; cycle++) {
    const mounted = instance()
    let delivered = 0
    const handler = mounted.target.handleMidiMessage
    mounted.target.handleMidiMessage = event => { delivered++; handler(event) }
    await mounted.target.midiReady(reusedAccess)
    reusedInput.onmidimessage({data: [0xf0, 0x0b, 126, 0, 1, 2, 3, 0xf7]})
    assert.equal(delivered, 1, `mount ${cycle} delivered more than once`)
    component.beforeUnmount.call(mounted.target)
    assert.equal(reusedInput.onmidimessage, null, `mount ${cycle} retained a callback`)
    assert.equal(reusedAccess.onstatechange, null, `mount ${cycle} retained statechange`)
  }
  assert.equal(reusedOutput.closeCalls, 100)

  console.log('Legacy selector verified: multi-port cleanup, refresh, hotplug, delayed mount/open, and 100 remounts.')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

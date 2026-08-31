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

  console.log('Legacy selector verified: scoped ports, explicit lifecycle and cancelled version timers.')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

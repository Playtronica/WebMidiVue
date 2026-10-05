const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const {test} = require('node:test')

// Exercise the actual Vue methods with hardware effects replaced, not a model of them.
const source = fs.readFileSync('src/components/SoundLab/SoundLab.vue', 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*$/gm, '').replace('export default', 'module.exports =')
function fixture() {
  const session = {running: true}
  const context = {module: {exports: {}}, document: {hidden: false}, markRaw: value => value, AbortController,
    CompatibilityNotice: {}, DeviceTaskNav: {}, updateSoundSession: patch => Object.assign(session, patch)}
  vm.runInNewContext(script, context)
  const target = {engine: {context: {state: 'running'}, panic() {}}, midi: {setEnabled(value) { this.enabled = value }},
    audioState: 'running', volume: 65, revealMode: true, firstSoundOutcome: 'helped', starting: false, permissionAttemptId: 0, releaseBlocked: false}
  for (const [name, method] of Object.entries(context.module.exports.methods)) target[name] = method.bind(target)
  target.resetVoiceUi = () => {}
  target.releaseHeldKeyboard = () => {}
  return {target, context, session}
}

test('interrupted audio pauses MIDI and points to the visible Resume sound control', () => {
  const {target, session} = fixture()
  target.handleAudioContextState('interrupted')
  assert.equal(target.audioState, 'interrupted')
  assert.equal(target.midi.enabled, false)
  assert.equal(session.running, false)
  assert.match(target.status, /Resume sound/)
})

test('browser-initiated audio recovery re-enables MIDI without replaying setup', () => {
  const {target, session} = fixture()
  target.handleAudioContextState('interrupted')
  target.handleAudioContextState('running')
  assert.equal(target.audioState, 'running')
  assert.equal(target.midi.enabled, true)
  assert.equal(session.running, true)
})

test('foreground return resumes suspended and interrupted contexts once', async () => {
  for (const state of ['suspended', 'interrupted']) {
    const {target} = fixture()
    target.engine.context.state = state
    let attempts = 0
    target.ensureEngine = async () => { attempts++ }
    await target.handleVisibility()
    assert.equal(attempts, 1, state)
  }
})

test('hidden interruptions never start a background retry loop', async () => {
  const {target, context} = fixture()
  context.document.hidden = true
  let attempts = 0
  target.ensureEngine = async () => { attempts++ }
  target.handleAudioContextState('interrupted')
  await target.handleVisibility()
  assert.equal(attempts, 0)
  assert.equal(target.audioState, 'interrupted')
})

test('a rejected resume stays paused and retryable, never claims sound works', async () => {
  const {target, session} = fixture()
  target.engine.context.state = 'interrupted'
  target.handleAudioContextState('interrupted')
  target.ensureEngine = async () => { throw new Error('OS still owns audio') }
  await target.handleVisibility()
  assert.equal(target.audioState, 'interrupted')
  assert.equal(target.releaseBlocked, false)
  assert.equal(session.running, false)
  assert.match(target.status, /Resume sound/)
})

test('closed or releasing audio is never silently re-enabled', async () => {
  const {target, session} = fixture()
  target.handleAudioContextState('closed')
  target.handleAudioContextState('running')
  assert.equal(target.audioState, 'closed')
  assert.equal(target.releaseBlocked, true)
  assert.equal(session.running, false)
  target.engine = null
  await target.handleVisibility()
})

import {parseMidiMessage} from './core.mjs'
import {requestSharedMidiAccess} from './midiAccess.mjs'

export function describeMidiAccessError(error) {
  if (error?.name === 'NotAllowedError') {
    return 'MIDI permission was not allowed. Allow device access, then try again.'
  }
  if (error?.name === 'SecurityError') {
    return 'MIDI is blocked on this page. Open the secure Playtronica Settings address in current Chrome or Edge.'
  }
  return error?.message || 'MIDI could not start. Reconnect the device, then try again.'
}

export class MidiInputSession {
  constructor(engine, onState = () => {}, options = {}) {
    this.engine = engine
    this.onState = onState
    this.access = null
    this.input = null
    this.enabled = true
    this.closed = false
    this.sysex = Boolean(options.sysex)
    // Late permission/open completions must never reacquire a released port.
    this.operationId = 0
    this.pendingConnect = null
    this.boundMessage = event => this.onMessage(event)
    this.boundState = event => this.onStateChange(event)
  }

  assertActive(operationId) {
    if (this.closed || operationId !== this.operationId) {
      throw new Error('MIDI connection was cancelled.')
    }
  }

  async requestAccess(operationId = this.operationId) {
    this.assertActive(operationId)
    if (!this.access) {
      let access
      try {
        access = await requestSharedMidiAccess({sysex: this.sysex})
      } catch (error) {
        this.assertActive(operationId)
        throw new Error(describeMidiAccessError(error))
      }
      this.assertActive(operationId)
      this.access = access
      access.addEventListener('statechange', this.boundState)
    }
    return this.listInputs()
  }

  listInputs() {
    return this.access ? [...this.access.inputs.values()]
      .filter(input => input.state !== 'disconnected')
      .map(input => ({
        id: input.id,
        name: input.name || 'MIDI input',
        manufacturer: input.manufacturer || ''
      })) : []
  }

  async connect(inputId) {
    if (this.pendingConnect) throw new Error('MIDI connection is already starting.')
    const operationId = ++this.operationId
    const task = this.connectAt(inputId, operationId)
    this.pendingConnect = task
    try { return await task }
    finally {
      if (this.pendingConnect === task) this.pendingConnect = null
    }
  }

  async connectAt(inputId, operationId) {
    await this.requestAccess(operationId)
    this.assertActive(operationId)
    const input = this.access.inputs.get(inputId)
    if (!input) throw new Error('That MIDI input is no longer available.')
    await this.releaseCurrent()
    this.assertActive(operationId)
    await input.open()
    if (this.closed || operationId !== this.operationId) {
      try { await input.close() }
      catch (error) {
        this.input = input
        this.onState({type: 'release-error', input: input.name || 'MIDI input', error})
        throw error
      }
      throw new Error('MIDI connection was cancelled.')
    }
    input.addEventListener('midimessage', this.boundMessage)
    this.input = input
    this.onState({type: 'connected', input: input.name || 'MIDI input'})
  }

  async release() {
    await this.invalidatePendingConnect()
    await this.releaseCurrent()
  }

  async invalidatePendingConnect() {
    this.operationId += 1
    const pending = this.pendingConnect
    if (pending) try { await pending } catch (error) { void error }
  }

  async releaseCurrent() {
    if (!this.input) return
    const input = this.input
    input.removeEventListener('midimessage', this.boundMessage)
    this.engine.panic()
    try {
      await input.close()
    } catch (error) {
      this.onState({type: 'release-error', input: input.name || 'MIDI input', error})
      throw error
    }
    if (this.input === input) this.input = null
    this.onState({type: 'released', input: input.name || 'MIDI input'})
  }

  async close() {
    this.closed = true
    await this.invalidatePendingConnect()
    await this.releaseCurrent()
    this.access?.removeEventListener('statechange', this.boundState)
    this.access = null
  }

  setEnabled(enabled) {
    const next = Boolean(enabled)
    if (this.enabled === next) return
    this.enabled = next
    if (!next) this.engine.panic()
  }

  onMessage(event) {
    if (!this.enabled) return
    const message = parseMidiMessage(event.data)
    const source = this.input?.id || 'midi'
    if (message.type === 'note-on') this.engine.noteOn(source, message.channel, message.note, message.velocity)
    else if (message.type === 'note-off') this.engine.noteOff(source, message.channel, message.note)
    else if (message.type === 'panic') this.engine.panic()
    this.onState({type: 'voices', count: this.engine.activeVoiceCount, message})
  }

  onStateChange(event) {
    if (this.input && event.port?.id === this.input.id && event.port.state === 'disconnected') {
      this.input.removeEventListener('midimessage', this.boundMessage)
      this.engine.panic()
      this.input = null
      this.onState({type: 'disconnected', input: event.port.name || 'MIDI input'})
    }
    this.onState({type: 'ports', inputs: this.listInputs()})
  }
}

import {parseMidiMessage} from './core.mjs'

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
  constructor(engine, onState = () => {}) {
    this.engine = engine
    this.onState = onState
    this.access = null
    this.input = null
    this.enabled = true
    this.boundMessage = event => this.onMessage(event)
    this.boundState = event => this.onStateChange(event)
  }

  async requestAccess() {
    if (!navigator.requestMIDIAccess) throw new Error('Web MIDI needs current Chrome or Edge on desktop.')
    if (!this.access) {
      try {
        this.access = await navigator.requestMIDIAccess({sysex: false})
      } catch (error) {
        throw new Error(describeMidiAccessError(error))
      }
      this.access.addEventListener('statechange', this.boundState)
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
    if (!this.access) await this.requestAccess()
    const input = this.access.inputs.get(inputId)
    if (!input) throw new Error('That MIDI input is no longer available.')
    await this.release()
    await input.open()
    input.addEventListener('midimessage', this.boundMessage)
    this.input = input
    this.onState({type: 'connected', input: input.name || 'MIDI input'})
  }

  async release() {
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
    this.input = null
    this.onState({type: 'released', input: input.name || 'MIDI input'})
  }

  async close() {
    await this.release()
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

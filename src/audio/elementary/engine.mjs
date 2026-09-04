// Elementary adapter matching SynthEngine's interface (../engine.mjs) so it
// can later replace it (SIMPLICITY-CONTRACT: replaces, does not live next to
// it). Owns the WebRenderer and the 16-voice pool of live refs; the DSP
// itself lives in patch.mjs (pure) and the voice-stealing bookkeeping in
// voices.mjs (delegates to VoiceLedger).
//
// Rendering strategy (revised 2026-09-04 after studying chromatone/elements,
// Denis Starov's production Elementary synth, MIT): the graph is rendered
// ONCE at startup via core.createRef() for every live parameter (gate/freq/
// vel per voice, master volume), each wrapped in el.smooth(...) at creation
// so a parameter without smoothing cannot exist. noteOn/noteOff/setVolume
// never call render() again — they call each ref's setter(), a cheap direct
// message to the worklet. Only applyPreset() re-renders (attack/release are
// baked into the ADSR node's structure, so a preset change needs a real
// rebuild); that render() is immediately followed by re-pushing every ref's
// tracked value through its setter, because re-rendering an already-mounted
// ref resets it to its creation-time value, not whatever a later setter()
// call moved it to (measured 2026-09-04, see _resyncRefs()).
import {el} from '@elemaudio/core'
import WebRenderer from '@elemaudio/web-renderer'
import {clamp, makeNoteKey, midiNoteToFrequency} from '../core.mjs'
import {SOUND_VARIANTS, validatePreset} from '../presets.mjs'
import {normalizeVolume} from '../volume.mjs'
// Громкость здесь только ослабляет: 0…1 до потолка, как в chromatone/elements.
// Прежний множитель ×5 в volume.mjs компенсировал компрессор, которого в этом
// движке нет; с ним аккорд сплющивал динамику до 3.2 дБ (замер 2026-09-04),
// без него держится 8.6 дБ на 16 голосах. Старый движок трогать нельзя — на нём
// сейчас beta17 у команды, и volume.mjs умрёт вместе с ним.
const attenuation = value => (normalizeVolume(value) / 100) ** 2
import {voice as voicePatch, master as masterPatch} from './patch.mjs'
import {VoicePool, VOICE_POOL_SIZE} from './voices.mjs'

export {DEFAULT_VOLUME, normalizeVolume} from '../volume.mjs'

// Denis Starov's chromatone/elements uses el.tau2pole(0.001) for every ref.
const REF_SMOOTH_TAU = 0.001

export class ElementarySynthEngine {
  constructor(context, options = {}) {
    if (!context) throw new TypeError('AudioContext is required')
    this.context = context
    this.ownsContext = Boolean(options.ownsContext)
    this.quality = options.quality === 'safe' ? 'safe' : 'standard'
    this.pool = new VoicePool(VOICE_POOL_SIZE)
    this.preset = validatePreset(options.preset || SOUND_VARIANTS[0])
    this.volume = normalizeVolume(options.volume)
    this.core = new WebRenderer()
    this.ready = false
    this._pending = []
    // Current live value of every ref. Elementary refs are write-only from
    // here (no getter), so this is what applyPreset()'s resync replays.
    this.values = {
      gate: new Array(VOICE_POOL_SIZE).fill(0),
      freq: new Array(VOICE_POOL_SIZE).fill(440),
      vel: new Array(VOICE_POOL_SIZE).fill(0),
      volume: attenuation(this.volume)
    }
  }

  async ensureReady() {
    if (this.ready) return
    this.node = await this.core.initialize(this.context, {
      numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1]
    })
    this.input = this.context.createGain()
    this.input.connect(this.node)
    this.output = this.context.createGain()
    this.node.connect(this.output)
    this.output.connect(this.context.destination)
    this._createRefs()
    await this._render()
    this.ready = true
  }

  _createRefs() {
    const smooth = raw => el.smooth(el.tau2pole(REF_SMOOTH_TAU), raw)
    this.gateRefs = []; this.gateSetters = []
    this.freqRefs = []; this.freqSetters = []
    this.velRefs = []; this.velSetters = []
    for (let slot = 0; slot < VOICE_POOL_SIZE; slot += 1) {
      const [gateNode, setGate] = this.core.createRef('const', {value: this.values.gate[slot]}, [])
      const [freqNode, setFreq] = this.core.createRef('const', {value: this.values.freq[slot]}, [])
      const [velNode, setVel] = this.core.createRef('const', {value: this.values.vel[slot]}, [])
      this.gateRefs.push(smooth(gateNode)); this.gateSetters.push(setGate)
      this.freqRefs.push(smooth(freqNode)); this.freqSetters.push(setFreq)
      this.velRefs.push(smooth(velNode)); this.velSetters.push(setVel)
    }
    const [volumeNode, setVolume] = this.core.createRef('const', {value: this.values.volume}, [])
    this.volumeRef = smooth(volumeNode)
    this.volumeSetter = setVolume
  }

  _buildGraph() {
    const preset = this.preset
    let sum = 0
    for (let slot = 0; slot < VOICE_POOL_SIZE; slot += 1) {
      sum = el.add(sum, voicePatch({
        gate: this.gateRefs[slot], freq: this.freqRefs[slot], vel: this.velRefs[slot], preset
      }))
    }
    const probe = el.in({channel: 0})
    return masterPatch(el.add(sum, probe), {volume: this.volumeRef})
  }

  async _render() { await this.core.render(this._buildGraph()) }

  // Every setter() call is tracked, not fired-and-ignored: a WebRenderer ref
  // update is a real message round trip to the worklet, and (measured
  // 2026-09-04) several such messages fired synchronously in the same JS
  // turn are not guaranteed to all land before the very next audio block —
  // only the last one queued reliably does. Realtime callers never need to
  // await this; whenIdle() exists so an offline test using
  // context.suspend()/resume() for sample-accurate scheduling (the same
  // technique test-sound-levels.js's fastStream() uses for the legacy
  // engine) can wait for every queued update to actually land before resuming.
  _track(promise) { this._pending.push(promise); return promise }
  async whenIdle() { await Promise.all(this._pending); this._pending = [] }

  async _resyncRefs() {
    for (let slot = 0; slot < VOICE_POOL_SIZE; slot += 1) {
      this._track(this.freqSetters[slot]({value: this.values.freq[slot]}))
      this._track(this.velSetters[slot]({value: this.values.vel[slot]}))
      this._track(this.gateSetters[slot]({value: this.values.gate[slot]}))
    }
    this._track(this.volumeSetter({value: this.values.volume}))
    await this.whenIdle()
  }

  get activeVoiceCount() { return this.pool.activeVoiceCount }
  get state() { return this.context.state }

  async resume() {
    if (this.context.state !== 'running' && typeof this.context.resume === 'function') await this.context.resume()
    return this.context.state
  }

  async applyPreset(input) {
    this.preset = validatePreset(input)
    if (!this.ready) return
    await this._render()
    await this._resyncRefs()
  }

  setVolume(input) {
    this.volume = normalizeVolume(input)
    this.values.volume = attenuation(this.volume)
    if (this.ready) this._track(this.volumeSetter({value: this.values.volume}))
    return this.volume
  }

  noteOn(sourceId, channel, note, velocity = 100, when = this.context.currentTime, levelScale = 1) {
    const key = makeNoteKey(sourceId, channel, note)
    const time = Number.isFinite(when) ? when : this.context.currentTime
    const {slot} = this.pool.claim(key, time)
    const normalizedVelocity = clamp(velocity, 1, 127, 100) / 127 * clamp(levelScale, 0, 1, 1)
    const freq = midiNoteToFrequency(note)
    this.values.freq[slot] = freq
    this.values.vel[slot] = normalizedVelocity
    this.values.gate[slot] = 1
    if (this.ready) {
      this._track(this.freqSetters[slot]({value: freq}))
      this._track(this.velSetters[slot]({value: normalizedVelocity}))
      this._track(this.gateSetters[slot]({value: 1}))
    }
    return key
  }

  noteOff(sourceId, channel, note, when = this.context.currentTime) {
    const key = makeNoteKey(sourceId, channel, note)
    const time = Number.isFinite(when) ? when : this.context.currentTime
    const slot = this.pool.slotFor(key)
    if (slot == null) return false
    this.pool.release(key, time)
    this.values.gate[slot] = 0
    if (this.ready) this._track(this.gateSetters[slot]({value: 0}))
    return true
  }

  // CC123. Every voice's gate drops to 0, carried through the same ADSR
  // release stage a normal note-off uses — click-free by construction (the
  // release ramp is what removes the click, not a separate fast fade like
  // the legacy engine's forceStop).
  panic() {
    for (let slot = 0; slot < VOICE_POOL_SIZE; slot += 1) {
      this.values.gate[slot] = 0
      if (this.ready) this._track(this.gateSetters[slot]({value: 0}))
    }
    this.pool.clear()
  }

  async stop() {
    this.panic()
    try {
      if (this.ownsContext && this.context.state !== 'closed') await this.context.close()
    } catch (error) {
      throw error
    }
  }
}

export function createRealtimeElementarySynth(options = {}) {
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext
  if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.')
  let context
  try { context = new AudioContextClass({latencyHint: 'interactive'}) } catch { context = new AudioContextClass() }
  return new ElementarySynthEngine(context, {...options, ownsContext: true})
}

import {clamp, makeNoteKey, midiNoteToFrequency, VoiceLedger} from './core.mjs'
import {SOUND_VARIANTS, validatePreset} from './presets.mjs'
import {normalizeVolume, volumeToGain} from './volume.mjs'
export {DEFAULT_VOLUME, normalizeVolume, volumeToGain} from './volume.mjs'

const SILENCE = 0.0001
const VOICE_LEVEL = 0.22
const VELOCITY_FLOOR = 0.72
const COMPRESSOR_MAKEUP_GAIN = 3.4
const SOFT_CEILING = 0.95
const CEILING_DRIVE = 4
const ZERO_FADE_SECONDS = 0.008

function makeSoftCeilingCurve() {
  const curve = new Float32Array(2049)
  const normalization = SOFT_CEILING / Math.tanh(CEILING_DRIVE)
  for (let index = 0; index < curve.length; index += 1) {
    const input = index / (curve.length - 1) * 2 - 1
    curve[index] = Math.tanh(input * CEILING_DRIVE) * normalization
  }
  return curve
}

function holdAndFadeToZero(param, now, endTime) {
  if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now)
  else {
    param.cancelScheduledValues(now)
    param.setValueAtTime(Math.max(SILENCE, Number.isFinite(param.value) ? param.value : SILENCE), now)
  }
  const duration = Math.max(0, endTime - now)
  const zeroFade = Math.min(ZERO_FADE_SECONDS, duration * 0.5)
  const exponentialEnd = endTime - zeroFade
  if (exponentialEnd > now) param.exponentialRampToValueAtTime(SILENCE, exponentialEnd)
  param.linearRampToValueAtTime(0, endTime)
}

function smoothTo(param, target, now, seconds = 0.025) {
  const safeTarget = Number.isFinite(target) ? target : param.defaultValue
  if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now)
  else {
    param.cancelScheduledValues(now)
    param.setValueAtTime(Number.isFinite(param.value) ? param.value : safeTarget, now)
  }
  param.linearRampToValueAtTime(safeTarget, now + seconds)
}

class Voice {
  constructor(context, destination, preset, frequency, velocity, levelScale, when, quality, onEnded) {
    this.context = context
    this.preset = preset
    this.onEnded = onEnded
    this.ended = false
    this.releaseScheduled = false
    this.endedOscillators = 0
    this.vibrato = null
    this.vibratoGain = null
    this.gain = context.createGain()
    this.gain.gain.value = SILENCE
    this.gain.connect(destination)
    this.oscillators = []

    const normalizedVelocity = clamp(velocity / 127, 0, 1, 0.7)
    const velocityLevel = VELOCITY_FLOOR + (1 - VELOCITY_FLOOR) * normalizedVelocity ** 0.7
    const level = velocityLevel * VOICE_LEVEL * clamp(levelScale, 0, 1, 1)
    this.addOscillator(preset.waveA, frequency, 0, 1, when)
    if (quality === 'standard' && preset.mixB > 0) {
      this.addOscillator(preset.waveB, frequency, preset.detune, preset.mixB, when)
    }
    this.addVibrato(when)
    this.gain.gain.setValueAtTime(SILENCE, when)
    this.gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, level), when + preset.attack)
    this.attackEnd = when + preset.attack
  }

  addOscillator(type, frequency, detune, mix, when) {
    const oscillator = this.context.createOscillator()
    oscillator.type = type
    oscillator.frequency.value = frequency
    oscillator.detune.value = detune
    if (this.preset.pitchGlideSeconds > 0 && this.preset.pitchStartCents !== 0) {
      oscillator.detune.setValueAtTime(detune + this.preset.pitchStartCents, when)
      oscillator.detune.linearRampToValueAtTime(detune, when + this.preset.pitchGlideSeconds)
    }
    const mixGain = this.context.createGain()
    mixGain.gain.value = clamp(mix, 0, 1, 0)
    oscillator.connect(mixGain).connect(this.gain)
    oscillator.onended = () => {
      try { oscillator.disconnect(); mixGain.disconnect() } catch (error) { void error }
      if (this.ended) return
      this.endedOscillators += 1
      if (this.endedOscillators < this.oscillators.length) return
      this.ended = true
      try { this.gain.disconnect(); this.vibrato?.disconnect(); this.vibratoGain?.disconnect() } catch (error) { void error }
      this.onEnded?.()
    }
    oscillator.start(when)
    this.oscillators.push({oscillator, mixGain})
  }

  addVibrato(when) {
    if (this.preset.vibratoRate <= 0 || this.preset.vibratoDepth <= 0) return
    const lfo = this.context.createOscillator()
    const depth = this.context.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = this.preset.vibratoRate
    depth.gain.value = this.preset.vibratoDepth
    lfo.connect(depth)
    for (const {oscillator} of this.oscillators) depth.connect(oscillator.detune)
    lfo.start(when)
    this.vibrato = lfo
    this.vibratoGain = depth
  }

  release(when) {
    if (this.ended || this.releaseScheduled) return
    this.releaseScheduled = true
    // Biotron plant notes are ~27 ms; a Note Off before the attack completes waits for it.
    when = Math.max(when, this.attackEnd)
    const end = when + this.preset.release
    holdAndFadeToZero(this.gain.gain, when, end)
    this.stopAt(end + 0.025)
  }

  forceStop(when) {
    if (this.ended) return
    this.releaseScheduled = true
    const end = when + 0.008
    holdAndFadeToZero(this.gain.gain, when, end)
    this.stopAt(end + 0.012)
  }

  stopAt(time) {
    for (const {oscillator} of this.oscillators) {
      try { oscillator.stop(time) } catch (error) { void error }
    }
    try { this.vibrato?.stop(time) } catch (error) { void error }
  }

  hardDispose(when) {
    if (this.ended) return
    try { this.gain.disconnect(); this.vibrato?.disconnect(); this.vibratoGain?.disconnect() } catch (error) { void error }
    this.stopAt(when)
  }
}

export class SynthEngine {
  constructor(context, options = {}) {
    if (!context) throw new TypeError('AudioContext is required')
    this.context = context
    this.ownsContext = Boolean(options.ownsContext)
    this.onStateChange = typeof options.onStateChange === 'function' ? options.onStateChange : () => {}
    this.boundStateChange = () => this.onStateChange(this.context.state)
    this.context.addEventListener?.('statechange', this.boundStateChange)
    this.quality = options.quality === 'safe' ? 'safe' : 'standard'
    this.voiceLimit = this.quality === 'safe' ? 4 : 8
    this.ledger = new VoiceLedger(this.voiceLimit)
    this.voices = new Map()
    this.retiring = []
    this.preset = validatePreset(options.preset || SOUND_VARIANTS[0])
    this.volume = normalizeVolume(options.volume)
    this.buildGraph()
    this.applyPreset(this.preset, 0)
  }

  buildGraph() {
    const context = this.context
    this.input = context.createGain()
    this.filter = context.createBiquadFilter()
    this.dry = context.createGain()
    this.delay = context.createDelay(0.8)
    this.delayFeedback = context.createGain()
    this.delayWet = context.createGain()
    this.headroom = context.createGain()
    this.compressor = context.createDynamicsCompressor()
    this.master = context.createGain()
    this.output = context.createGain()
    this.ceilingInput = context.createGain()
    this.ceiling = context.createWaveShaper()
    this.filter.type = 'lowpass'
    this.dry.gain.value = 0.86
    // Biotron can emit very low velocities. Boost before the compressor so
    // quiet notes stay audible while dense chords remain safely contained.
    this.headroom.gain.value = 1
    this.compressor.threshold.value = -12
    this.compressor.knee.value = 6
    this.compressor.ratio.value = 12
    this.compressor.attack.value = 0.001
    this.compressor.release.value = 0.16
    this.master.gain.value = COMPRESSOR_MAKEUP_GAIN
    this.output.gain.value = volumeToGain(this.volume)
    this.ceilingInput.gain.value = 1 / CEILING_DRIVE
    this.ceiling.curve = makeSoftCeilingCurve()
    this.ceiling.oversample = this.quality === 'standard' ? '2x' : 'none'
    this.input.connect(this.filter)
    this.filter.connect(this.dry).connect(this.headroom)
    this.filter.connect(this.delay)
    this.delay.connect(this.delayFeedback).connect(this.delay)
    this.delay.connect(this.delayWet).connect(this.headroom)
    if (this.quality === 'standard') {
      this.convolver = context.createConvolver()
      this.reverbWet = context.createGain()
      const impulseLength = Math.max(1, Math.round(context.sampleRate * 0.45))
      const impulseBuffer = context.createBuffer(2, impulseLength, context.sampleRate)
      let impulseSeed = 0x51f15e
      const impulseRandom = () => {
        impulseSeed = (Math.imul(impulseSeed, 1664525) + 1013904223) >>> 0
        return impulseSeed / 0x100000000
      }
      for (let channel = 0; channel < impulseBuffer.numberOfChannels; channel += 1) {
        const data = impulseBuffer.getChannelData(channel)
        for (let index = 0; index < data.length; index += 1) {
          const envelope = (1 - index / data.length) ** 2.5
          data[index] = (impulseRandom() * 2 - 1) * envelope * 0.55
        }
      }
      this.convolver.buffer = impulseBuffer
      this.filter.connect(this.convolver).connect(this.reverbWet).connect(this.headroom)
    }
    // Keep every user volume level inside the compressor. Boosting after it
    // drove ordinary notes into the ceiling and made their tails sound clipped.
    this.headroom.connect(this.output).connect(this.compressor).connect(this.master)
      .connect(this.ceilingInput).connect(this.ceiling).connect(context.destination)
  }

  get activeVoiceCount() { return [...this.ledger.entries.values()].filter(entry => entry.state === 'active').length }
  get connectedVoiceCount() { return this.voices.size + this.retiring.length }
  get state() { return this.context.state }

  async resume() {
    if (this.context.state !== 'running' && typeof this.context.resume === 'function') await this.context.resume()
    return this.context.state
  }

  applyPreset(input, when = this.context.currentTime) {
    this.preset = validatePreset(input)
    const time = Math.max(this.context.currentTime, Number.isFinite(when) ? when : this.context.currentTime)
    smoothTo(this.filter.frequency, this.preset.cutoff, time)
    smoothTo(this.filter.Q, this.preset.resonance, time)
    smoothTo(this.delay.delayTime, this.preset.delayTime, time)
    smoothTo(this.delayFeedback.gain, this.preset.delayFeedback, time)
    smoothTo(this.delayWet.gain, this.preset.delayWet, time)
    if (this.reverbWet) smoothTo(this.reverbWet.gain, this.preset.reverbWet, time)
  }

  setVolume(input, when = this.context.currentTime) {
    this.volume = normalizeVolume(input)
    const time = Math.max(this.context.currentTime, Number.isFinite(when) ? when : this.context.currentTime)
    smoothTo(this.output.gain, volumeToGain(this.volume), time, 0.035)
    return this.volume
  }

  retire(voice, when) {
    if (!voice) return
    voice.forceStop(when)
    this.retiring.push(voice)
    while (this.retiring.length > this.voiceLimit) this.retiring.shift()?.hardDispose(when)
  }

  noteOn(sourceId, channel, note, velocity = 100, when = this.context.currentTime, levelScale = 1) {
    const time = Math.max(this.context.currentTime, Number.isFinite(when) ? when : this.context.currentTime)
    const key = makeNoteKey(sourceId, channel, note)
    const claim = this.ledger.claim(key, time)
    if (claim.victimKey) {
      this.retire(this.voices.get(claim.victimKey), time)
      this.voices.delete(claim.victimKey)
    }
    const voice = new Voice(this.context, this.input, this.preset, midiNoteToFrequency(note),
      clamp(velocity, 1, 127, 100), levelScale, time, this.quality, () => {
        if (this.voices.get(key) === voice) this.voices.delete(key)
        this.retiring = this.retiring.filter(item => item !== voice)
        this.ledger.remove(key, claim.token)
      })
    this.voices.set(key, voice)
    return key
  }

  noteOff(sourceId, channel, note, when = this.context.currentTime) {
    const time = Math.max(this.context.currentTime, Number.isFinite(when) ? when : this.context.currentTime)
    const key = makeNoteKey(sourceId, channel, note)
    const voice = this.voices.get(key)
    if (!voice) return false
    this.ledger.markReleased(key, time)
    voice.release(time)
    return true
  }

  panic(when = this.context.currentTime) {
    const time = Math.max(this.context.currentTime, Number.isFinite(when) ? when : this.context.currentTime)
    // CC123 arrives at every calibration start: fade in 8 ms instead of a hard cut (the click Sergey hears).
    for (const voice of this.voices.values()) voice.forceStop(time)
    for (const voice of this.retiring) voice.forceStop(time)
    this.voices.clear()
    this.retiring = []
    this.ledger.clear()
  }

  async stop() {
    this.panic()
    this.context.removeEventListener?.('statechange', this.boundStateChange)
    try {
      if (this.ownsContext && this.context.state !== 'closed') await this.context.close()
    } catch (error) {
      this.context.addEventListener?.('statechange', this.boundStateChange)
      throw error
    }
  }
}

export function createRealtimeSynth(options = {}) {
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext
  if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.')
  let context
  try { context = new AudioContextClass({latencyHint: 'interactive'}) } catch { context = new AudioContextClass() }
  return new SynthEngine(context, {...options, ownsContext: true})
}

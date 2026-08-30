import {clamp, makeNoteKey, midiNoteToFrequency, VoiceLedger} from './core.mjs'
import {SOUND_VARIANTS, validatePreset} from './presets.mjs'

const SILENCE = 0.0001

function makeImpulse(context, seconds = 0.45) {
  const length = Math.max(1, Math.round(context.sampleRate * seconds))
  const buffer = context.createBuffer(2, length, context.sampleRate)
  let seed = 0x51f15e
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x100000000
  }
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < data.length; index += 1) {
      const envelope = (1 - index / data.length) ** 2.5
      data[index] = (random() * 2 - 1) * envelope * 0.55
    }
  }
  return buffer
}

function holdAndRamp(param, now, endTime, target) {
  if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now)
  else {
    param.cancelScheduledValues(now)
    param.setValueAtTime(Math.max(SILENCE, Number.isFinite(param.value) ? param.value : SILENCE), now)
  }
  param.exponentialRampToValueAtTime(Math.max(SILENCE, target), endTime)
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
  constructor(context, destination, preset, frequency, velocity, when, quality, onEnded) {
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

    const level = clamp(velocity / 127, 0.02, 1, 0.7) * 0.22
    this.addOscillator(preset.waveA, frequency, 0, 1, when)
    if (quality === 'standard' && preset.mixB > 0) {
      this.addOscillator(preset.waveB, frequency, preset.detune, preset.mixB, when)
    }
    this.addVibrato(when)
    this.gain.gain.setValueAtTime(SILENCE, when)
    this.gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, level), when + preset.attack)
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
    const end = when + this.preset.release
    holdAndRamp(this.gain.gain, when, end, SILENCE)
    this.stopAt(end + 0.025)
  }

  forceStop(when) {
    if (this.ended) return
    this.releaseScheduled = true
    const end = when + 0.008
    holdAndRamp(this.gain.gain, when, end, SILENCE)
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
    this.quality = options.quality === 'safe' ? 'safe' : 'standard'
    this.voiceLimit = this.quality === 'safe' ? 4 : 8
    this.ledger = new VoiceLedger(this.voiceLimit)
    this.voices = new Map()
    this.retiring = []
    this.preset = validatePreset(options.preset || SOUND_VARIANTS[0])
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
    this.filter.type = 'lowpass'
    this.dry.gain.value = 0.86
    this.headroom.gain.value = 0.42
    this.compressor.threshold.value = -16
    this.compressor.knee.value = 18
    this.compressor.ratio.value = 5
    this.compressor.attack.value = 0.004
    this.compressor.release.value = 0.16
    this.input.connect(this.filter)
    this.filter.connect(this.dry).connect(this.headroom)
    this.filter.connect(this.delay)
    this.delay.connect(this.delayFeedback).connect(this.delay)
    this.delay.connect(this.delayWet).connect(this.headroom)
    if (this.quality === 'standard') {
      this.convolver = context.createConvolver()
      this.reverbWet = context.createGain()
      this.convolver.buffer = makeImpulse(context)
      this.filter.connect(this.convolver).connect(this.reverbWet).connect(this.headroom)
    }
    this.headroom.connect(this.compressor).connect(context.destination)
  }

  get activeVoiceCount() { return this.voices.size }
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

  retire(voice, when) {
    if (!voice) return
    voice.forceStop(when)
    this.retiring.push(voice)
    while (this.retiring.length > this.voiceLimit) this.retiring.shift()?.hardDispose(when)
  }

  noteOn(sourceId, channel, note, velocity = 100, when = this.context.currentTime) {
    const time = Math.max(this.context.currentTime, Number.isFinite(when) ? when : this.context.currentTime)
    const key = makeNoteKey(sourceId, channel, note)
    const claim = this.ledger.claim(key, time)
    if (claim.victimKey) {
      this.retire(this.voices.get(claim.victimKey), time)
      this.voices.delete(claim.victimKey)
    }
    const voice = new Voice(this.context, this.input, this.preset, midiNoteToFrequency(note),
      clamp(velocity, 1, 127, 100), time, this.quality, () => {
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
    for (const voice of this.voices.values()) voice.hardDispose(time)
    for (const voice of this.retiring) voice.hardDispose(time)
    this.voices.clear()
    this.retiring = []
    this.ledger.clear()
  }

  async stop() {
    this.panic()
    if (this.ownsContext && this.context.state !== 'closed') await this.context.close()
  }
}

export function createRealtimeSynth(options = {}) {
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext
  if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.')
  let context
  try { context = new AudioContextClass({latencyHint: 'interactive'}) } catch { context = new AudioContextClass() }
  return new SynthEngine(context, {...options, ownsContext: true})
}

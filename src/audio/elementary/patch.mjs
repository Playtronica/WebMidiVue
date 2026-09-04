// Pure Elementary Audio graph math for the "Glass" voice. No state, no Vue,
// no engine lifecycle — tested offline on its own (see
// scripts/spike-elementary-gates.js, the proven reference; Andrey pinned it
// there, do not diverge without re-measuring).
//
// Smoothing is NOT done here. Per Denis Starov's chromatone/elements (MIT),
// studied 2026-09-04: a parameter that can change while a note sounds is
// wrapped in el.smooth(el.tau2pole(...), ref) once, at the point the ref
// itself is created (engine.mjs) — "a parameter without smoothing cannot
// exist" is an invariant of ref creation, not of every place a value is
// read. voice()/master() below assume gate/freq/vel/volume already arrive
// smoothed; they only smooth values they derive internally.
import {el} from '@elemaudio/core'
import {srvb} from './fx/srvb.mjs'

// ADSR shape proven in scripts/spike-elementary-gates.js.
export const VOICE_DECAY = 0.18
export const VOICE_SUSTAIN = 0.35
// Andrey's decision 2026-09-04: 0.78 gives ~10 dB between velocity 24 and 100
// (0.70 -> 9.0 dB, 0.78 -> 10.0 dB, 0.85 -> 10.8 dB) — light touches on the
// plant stay confidently audible without flattening dynamics back to ~0 dB.
export const VELOCITY_CURVE = 0.78
export const CUTOFF_BASE = 300
export const CUTOFF_VELOCITY_SCALE = 4200
export const FILTER_Q = 0.7
export const VOICE_LEVEL = 0.5
// Master chain constants carried over from ../engine.mjs so a preset keeps
// the balance it was voiced against: dry gain, the delay line's ceiling and
// the fixed room the reverb wet level is dialled into.
export const DRY_LEVEL = 0.86
export const DELAY_MAX_SECONDS = 0.8
export const REVERB_ROOM = Object.freeze({size: 0.35, decay: 0.5, mod: 0.2})

const WAVES = Object.freeze({
  sine: freq => el.cycle(freq),
  triangle: freq => el.triangle(freq),
  square: freq => el.blepsquare(freq),
  sawtooth: freq => el.blepsaw(freq)
})
const number = (value, fallback) => (Number.isFinite(value) ? value : fallback)
// Cents are summed first and converted once: one exponential instead of one
// per modulation source.
const ratio = cents => Math.pow(2, cents / 1200)
const ratioNode = cents => el.pow(2, el.div(cents, 1200))

// This timbre's own knobs, next to the code that reads them (chromatone/
// elements convention: params live beside the timbre, params.mjs only merges
// and (de)serialises).
export const params = Object.freeze({
  'voice:attack': {value: 0.006, min: 0.003, max: 2, step: 0.001},
  'voice:release': {value: 0.42, min: 0.03, max: 3, step: 0.001}
})

// voice({gate, freq, vel, preset, quality}) -> one Elementary voice. gate/freq/
// vel are expected to already be smoothed refs (engine.mjs). The preset picks
// the oscillator pair (waveA plus a detuned waveB at mixB), the note-start
// pitch glide and the vibrato — the same meanings those fields have in
// ../engine.mjs, so a preset sounds like it was voiced to sound. The
// velocity->brightness mapping (300+4200*vel), filter Q, ADSR decay/sustain
// and VELOCITY_CURVE stay fixed at the proven spike values on purpose: those
// are what the dynamics gate was measured against, and making them
// per-preset would make that measured number per-preset too.
// `quality: 'safe'` (Low CPU) drops the second oscillator, as ../engine.mjs does.
export function voice({gate, freq, vel, preset = {}, quality = 'standard'}) {
  const attack = number(preset.attack, params['voice:attack'].value)
  const release = number(preset.release, params['voice:release'].value)
  const env = el.adsr(attack, VOICE_DECAY, VOICE_SUSTAIN, release, gate)

  const glideSeconds = number(preset.pitchGlideSeconds, 0)
  const startCents = number(preset.pitchStartCents, 0)
  const vibratoRate = number(preset.vibratoRate, 0)
  const vibratoDepth = number(preset.vibratoDepth, 0)
  let cents = null
  // A decay-only envelope: full startCents at the note's start, gone after
  // glideSeconds — the declarative twin of ../engine.mjs's detune ramp.
  if (glideSeconds > 0 && startCents !== 0) {
    cents = el.mul(startCents, el.adsr(0.001, glideSeconds, 0, 0.001, gate))
  }
  if (vibratoRate > 0 && vibratoDepth > 0) {
    const vibrato = el.mul(vibratoDepth, el.cycle(vibratoRate))
    cents = cents === null ? vibrato : el.add(cents, vibrato)
  }
  const tuned = cents === null ? freq : el.mul(freq, ratioNode(cents))

  const waveA = WAVES[preset.waveA] || WAVES.sine
  let osc = waveA(tuned)
  const mixB = number(preset.mixB, 0)
  if (quality === 'standard' && mixB > 0) {
    const waveB = WAVES[preset.waveB] || WAVES.triangle
    osc = el.add(osc, el.mul(mixB, waveB(el.mul(tuned, ratio(number(preset.detune, 0))))))
  }

  // Derived from the already-smoothed `vel`, so it stays continuous without
  // a second smoothing layer of its own.
  const cutoff = el.add(CUTOFF_BASE, el.mul(CUTOFF_VELOCITY_SCALE, vel))
  const filtered = el.lowpass(cutoff, FILTER_Q, osc)
  return el.mul(env, el.pow(vel, VELOCITY_CURVE), filtered, VOICE_LEVEL)
}

// master(sum, {volume, fx, sampleRate, quality}) -> the shared chain every
// voice (and any probe signal summed in before this call) passes through:
// the sound's own lowpass, its delay and its reverb, then a soft tanh
// ceiling. No DynamicsCompressor and no make-up gain (the spike proved the
// compressor is what was flattening dynamics and adding THD). Wiring order
// mirrors ../engine.mjs: filter first, delay and reverb fed from the filtered
// signal and added as wet. `volume` is expected pre-smoothed.
// `quality: 'safe'` (Low CPU) skips the reverb network, as ../engine.mjs does.
export function master(sum, {volume = 1, fx = {}, sampleRate = 44100, quality = 'standard'} = {}) {
  const filtered = el.lowpass(number(fx.cutoff, 12000), number(fx.resonance, FILTER_Q), sum)
  let out = el.mul(DRY_LEVEL, filtered)

  const delayWet = number(fx.delayWet, 0)
  if (delayWet > 0) {
    const samples = Math.max(1, Math.round(number(fx.delayTime, 0.2) * sampleRate))
    const echo = el.delay(
      {size: Math.ceil(DELAY_MAX_SECONDS * sampleRate)},
      el.const({key: 'master:delay:time', value: samples}),
      number(fx.delayFeedback, 0),
      filtered
    )
    out = el.add(out, el.mul(delayWet, echo))
  }

  const reverbWet = number(fx.reverbWet, 0)
  if (quality === 'standard' && reverbWet > 0) {
    const [left, right] = srvb(
      {key: 'master:srvb', sampleRate, size: REVERB_ROOM.size, decay: REVERB_ROOM.decay, mod: REVERB_ROOM.mod, mix: 1},
      filtered, filtered
    )
    out = el.add(out, el.mul(reverbWet * 0.5, el.add(left, right)))
  }

  return el.tanh(el.mul(out, volume))
}

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
export const OSC_MIX_CYCLE = 0.75
export const OSC_MIX_TRIANGLE = 0.25
export const VOICE_LEVEL = 0.5

// This timbre's own knobs, next to the code that reads them (chromatone/
// elements convention: params live beside the timbre, params.mjs only merges
// and (de)serialises). attack/release are the only fields this patch reads
// from a preset — everything else in a legacy SOUND_VARIANTS entry
// (cutoff/resonance/detune/mixB/vibrato/delay/reverb) is preserved losslessly
// by params.mjs but not yet wired to this DSP (see params.mjs's doc comment).
export const params = Object.freeze({
  'voice:attack': {value: 0.006, min: 0.003, max: 2, step: 0.001},
  'voice:release': {value: 0.42, min: 0.03, max: 3, step: 0.001}
})

// voice({gate, freq, vel, preset}) -> one Elementary voice. gate/freq/vel are
// expected to already be smoothed refs (engine.mjs). `preset` (optional)
// overrides attack/release; the velocity->brightness cutoff mapping
// (300+4200*vel), filter Q, oscillator pair and ADSR decay/sustain stay fixed
// at the proven spike values on purpose — those are what the dynamics gate
// was measured and pinned against, and a per-preset override here would
// change that measured number per preset, which is not the contract.
export function voice({gate, freq, vel, preset = {}}) {
  const attack = Number.isFinite(preset.attack) ? preset.attack : params['voice:attack'].value
  const release = Number.isFinite(preset.release) ? preset.release : params['voice:release'].value
  const env = el.adsr(attack, VOICE_DECAY, VOICE_SUSTAIN, release, gate)
  // Derived from the already-smoothed `vel`, so it stays continuous without
  // a second smoothing layer of its own.
  const cutoff = el.add(CUTOFF_BASE, el.mul(CUTOFF_VELOCITY_SCALE, vel))
  const osc = el.add(
    el.mul(OSC_MIX_CYCLE, el.cycle(freq)),
    el.mul(OSC_MIX_TRIANGLE, el.triangle(el.mul(freq, 2)))
  )
  const filtered = el.lowpass(cutoff, FILTER_Q, osc)
  return el.mul(env, el.pow(vel, VELOCITY_CURVE), filtered, VOICE_LEVEL)
}

// master(sum, {volume}) -> the shared chain every voice (and any probe signal
// summed in before this call) passes through: soft tanh ceiling, no
// DynamicsCompressor, no make-up gain (spike proved the compressor is what
// was flattening dynamics and adding THD). `volume` is expected pre-smoothed.
export function master(sum, {volume = 1} = {}) {
  return el.tanh(el.mul(sum, volume))
}

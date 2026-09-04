// Merges each timbre's own params (chromatone/elements convention: params
// live next to the timbre — see patch.mjs's `params` export) and handles
// preset (de)serialisation. Does not define DSP-facing ranged parameters
// itself; only patch.mjs (or a future second timbre module) owns those.
//
// Reuses validatePreset() from ../presets.mjs for clamping and defaults
// instead of re-implementing it — one mechanism, not two.
//
// patch.mjs's voice() currently only reads attack/release from a preset.
// waveB/detune/mixB/pitch-glide/vibrato/delay/reverb are not yet wired into
// any timbre's DSP graph. They are still carried here losslessly (round-
// tripped byte for byte through paramsToPreset) under `meta`, so moving to
// Elementary drops no preset data; wiring them into a patch is follow-up
// work, not a gap in this map.
import {SOUND_VARIANTS, validatePreset} from '../presets.mjs'
import {params as voiceParams} from './patch.mjs'

// All ranged parameters, merged across timbre modules (one so far: voice).
export const PARAM_SCHEMA = Object.freeze({...voiceParams})

const RANGED_TO_PRESET_KEY = Object.freeze({'voice:attack': 'attack', 'voice:release': 'release'})
const META_PRESET_KEYS = Object.freeze([
  'cutoff', 'resonance', 'detune', 'mixB', 'pitchStartCents', 'pitchGlideSeconds',
  'vibratoRate', 'vibratoDepth', 'delayTime', 'delayFeedback', 'delayWet', 'reverbWet', 'clearUpTo'
])

// preset (a SOUND_VARIANTS[i]-shaped object) -> {params, meta}. `params` is
// the flat {key: {value, min, max, step}} map for fields a timbre module
// actually reads; `meta` carries name/waveform choice plus every legacy
// field no timbre reads yet, so paramsToPreset() can round-trip exactly.
export function presetToParams(preset) {
  const validated = validatePreset(preset)
  const params = {}
  for (const [key, presetKey] of Object.entries(RANGED_TO_PRESET_KEY)) {
    params[key] = {...PARAM_SCHEMA[key], value: validated[presetKey]}
  }
  const meta = {name: validated.name, waveA: validated.waveA, waveB: validated.waveB}
  for (const presetKey of META_PRESET_KEYS) meta[presetKey] = validated[presetKey]
  return {params, meta}
}

// Inverse of presetToParams(): {params, meta} -> a validated preset object,
// same shape as a presets.mjs SOUND_VARIANTS entry (including clearUpTo).
export function paramsToPreset({params = {}, meta = {}} = {}) {
  const input = {name: meta.name, waveA: meta.waveA, waveB: meta.waveB}
  for (const [key, presetKey] of Object.entries(RANGED_TO_PRESET_KEY)) input[presetKey] = params[key]?.value
  for (const presetKey of META_PRESET_KEYS) input[presetKey] = meta[presetKey]
  return validatePreset(input)
}

// All 7 presets, pre-converted. clearUpTo (articulation rate the preset
// declares) survives the round trip like every other field.
export const ELEMENTARY_PRESETS = Object.freeze(SOUND_VARIANTS.map(presetToParams))

import {clamp} from './core.mjs'

const WAVEFORMS = new Set(['sine', 'square', 'sawtooth', 'triangle'])

export function validatePreset(input = {}) {
  return Object.freeze({
    name: String(input.name || 'Sound').slice(0, 32),
    waveA: WAVEFORMS.has(input.waveA) ? input.waveA : 'triangle',
    waveB: WAVEFORMS.has(input.waveB) ? input.waveB : 'sine',
    detune: clamp(input.detune, -50, 50, 0),
    mixB: clamp(input.mixB, 0, 0.5, 0),
    attack: clamp(input.attack, 0.003, 2, 0.02),
    release: clamp(input.release, 0.03, 3, 0.3),
    cutoff: clamp(input.cutoff, 80, 12000, 1800),
    resonance: clamp(input.resonance, 0.0001, 12, 0.8),
    pitchStartCents: clamp(input.pitchStartCents, -2400, 2400, 0),
    pitchGlideSeconds: clamp(input.pitchGlideSeconds, 0, 0.8, 0),
    vibratoRate: clamp(input.vibratoRate, 0, 12, 0),
    vibratoDepth: clamp(input.vibratoDepth, 0, 120, 0),
    delayTime: clamp(input.delayTime, 0.02, 0.75, 0.2),
    delayFeedback: clamp(input.delayFeedback, 0, 0.72, 0.2),
    delayWet: clamp(input.delayWet, 0, 0.35, 0.08),
    reverbWet: clamp(input.reverbWet, 0, 0.3, 0.1)
  })
}

const rawGlassFlutes = [
  {name:'Clear Glass',waveA:'sine',waveB:'triangle',detune:2,mixB:.12,attack:.07,release:.52,cutoff:7200,resonance:.7,pitchStartCents:-18,pitchGlideSeconds:.08,vibratoRate:5.6,vibratoDepth:8,delayTime:.19,delayFeedback:.08,delayWet:.04,reverbWet:.12},
  {name:'Soft Glass',waveA:'sine',waveB:'triangle',detune:3,mixB:.08,attack:.16,release:.72,cutoff:5100,resonance:.45,pitchStartCents:-10,pitchGlideSeconds:.1,vibratoRate:5.1,vibratoDepth:6,delayTime:.23,delayFeedback:.08,delayWet:.04,reverbWet:.16},
  {name:'Breath Glass',waveA:'triangle',waveB:'sine',detune:7,mixB:.22,attack:.12,release:.68,cutoff:8800,resonance:.35,pitchStartCents:-24,pitchGlideSeconds:.12,vibratoRate:5.8,vibratoDepth:10,delayTime:.27,delayFeedback:.1,delayWet:.06,reverbWet:.18},
  {name:'Singing Glass',waveA:'sine',waveB:'triangle',detune:5,mixB:.16,attack:.09,release:.62,cutoff:6900,resonance:.9,pitchStartCents:-55,pitchGlideSeconds:.18,vibratoRate:6.4,vibratoDepth:18,delayTime:.21,delayFeedback:.09,delayWet:.05,reverbWet:.15},
  {name:'Glass Room',waveA:'sine',waveB:'triangle',detune:9,mixB:.14,attack:.1,release:.9,cutoff:7600,resonance:.6,pitchStartCents:-20,pitchGlideSeconds:.1,vibratoRate:5.4,vibratoDepth:9,delayTime:.31,delayFeedback:.22,delayWet:.14,reverbWet:.25},
  {name:'Electric Glass',waveA:'triangle',waveB:'square',detune:11,mixB:.1,attack:.035,release:.46,cutoff:9800,resonance:2.2,pitchStartCents:-90,pitchGlideSeconds:.14,vibratoRate:7.6,vibratoDepth:24,delayTime:.17,delayFeedback:.16,delayWet:.1,reverbWet:.1}
]

export const SOUND_VARIANTS = Object.freeze(rawGlassFlutes.map(validatePreset))

/*
 * Тембры, перенесённые из https://github.com/chromatone/elements
 * (elements/round.js, fat.js, string.js, noise.js).
 * Автор: Денис Старов (Chromatone), MIT License, Copyright (c) 2024 Chromatone.
 * Текст лицензии — рядом: fx/LICENSE-chromatone.txt. Синт сделан автором в
 * поддержку этого проекта; перенесено 04.09.2026.
 *
 * Изменения при переносе, математика в остальном не тронута:
 *  - вход по частоте в герцах (наш движок держит freq-реф), а не по номеру
 *    ноты: у автора midiFrequency() внутри тембра, у нас частота приходит уже
 *    сглаженным рефом из engine.mjs. Вибрато и октава поэтому умножают
 *    частоту (2^(полутона/12)), а не складываются в пространстве нот;
 *  - темп фиксирован (120 BPM => rate 0.125): у автора огибающие
 *    масштабируются темпом секвенсора, у нас темп задаёт растение;
 *  - громкость голоса приведена к нашему VOICE_LEVEL, чтобы восемь голосов
 *    не пробивали потолок мастера.
 */
import {el} from '@elemaudio/core'
import {VOICE_LEVEL, VELOCITY_CURVE, voice as glassVoice} from './patch.mjs'
import {validatePreset} from '../presets.mjs'

// 15/120 BPM — авторский масштаб огибающих на спокойном темпе.
const RATE = 0.125
const semitones = cents => Math.pow(2, cents / 12)
const num = (value, fallback) => (Number.isFinite(value) ? value : fallback)

const envelopes = (cv, gate) => ({
  amp: el.adsr(num(cv.attack, 1) * RATE, num(cv.decay, 1) * RATE, num(cv.sustain, 0.5),
    num(cv.release, 1) * RATE, gate),
  filter: el.adsr(num(cv.fattack, 1) * RATE, num(cv.fdecay, 1) * RATE, num(cv.fsustain, 0.5),
    num(cv.frelease, 1) * RATE, gate)
})

// Частота голоса с октавой и (для round/fat) вибрато в полутонах.
const tuned = (freq, cv, withVibrato) => {
  const base = el.mul(freq, semitones(12 * num(cv.octave, 0)))
  const depth = num(cv.vibdep, 0)
  if (!withVibrato || depth <= 0) return base
  const lfo = el.mul(depth, el.cycle(num(cv.vibrate, 2) * 2))
  return el.mul(base, el.pow(2, el.div(lfo, 12)))
}

const cutoffNode = (cv, filterEnv) => el.max(20, el.min(20000,
  el.add(num(cv.cutoff, 200), el.mul(num(cv.cutoff, 200) * num(cv.fenv, 0.5), filterEnv))))

// round: cycle + triangle, смешиваются равной мощностью по `shape`.
function round({gate, freq, vel}, cv) {
  const {amp, filter} = envelopes(cv, gate)
  const f = tuned(freq, cv, true)
  const shape = num(cv.shape, 0.2)
  const osc = el.mul(amp, el.add(
    el.mul(Math.cos(shape * Math.PI / 2), el.cycle(f)),
    el.mul(Math.sin(shape * Math.PI / 2), el.triangle(f))
  ))
  return el.tanh(el.mul(num(cv.gain, 0.8), vel, el.lowpass(cutoffNode(cv, filter), num(cv.cutq, 1.1), osc)))
}

// fat: то же, но полосно-ограниченные квадрат и пила — плотнее и ярче.
function fat({gate, freq, vel}, cv) {
  const {amp, filter} = envelopes(cv, gate)
  const f = tuned(freq, cv, true)
  const shape = num(cv.shape, 0.2)
  const osc = el.mul(amp, el.add(
    el.mul(Math.cos(shape * Math.PI / 2), el.blepsquare(f)),
    el.mul(Math.sin(shape * Math.PI / 2), el.blepsaw(f))
  ))
  return el.tanh(el.mul(num(cv.gain, 0.8), vel, el.lowpass(cutoffNode(cv, filter), num(cv.cutq, 1.1), osc)))
}

// string: щипок Карплуса-Стронга — шум в полосовом фильтре, закольцованный
// задержкой длиной в период ноты.
function string({gate, freq, vel}, cv) {
  const {amp, filter} = envelopes(cv, gate)
  const f = tuned(freq, cv, false)
  const excitation = el.mul(amp, el.noise(), num(cv.noise, 0.95))
  const body = el.lowpass(cutoffNode(cv, filter), num(cv.cutq, 1.1),
    el.bandpass(f, num(cv.bandq, 1), excitation))
  const delayed = el.delay({size: 44100}, el.div(el.sr(), f), num(cv.feedback, 0.95), body)
  return el.mul(num(cv.gain, 0.8), vel, el.tanh(delayed))
}

// noise: белый/розовый шум в полосе вокруг ноты — дыхание, ветер.
function noise({gate, freq, vel}, cv) {
  const {amp, filter} = envelopes(cv, gate)
  const f = tuned(freq, cv, false)
  const color = num(cv.color, 0)
  const source = el.add(
    el.mul(Math.cos(color * Math.PI / 2), el.noise()),
    el.mul(Math.sin(color * Math.PI / 2), el.pinknoise())
  )
  const band = el.bandpass(f, num(cv.bandq, 5), source)
  const cutoff = el.max(20, el.min(20000, el.add(num(cv.cutoff, 200), el.mul(num(cv.fenv, 0.5) * 20000, filter))))
  return el.tanh(el.mul(num(cv.gain, 0.8), vel, amp, el.lowpass(cutoff, num(cv.cutq, 1.1), band)))
}

// Общая обвязка: наша кривая нажатия и общий уровень голоса — одни и те же
// для любого тембра, иначе замеренная динамика становится «динамикой тембра».
const withHouseLevel = timbre => (ctx, cv) =>
  el.mul(timbre({...ctx, vel: el.pow(ctx.vel, VELOCITY_CURVE)}, cv), VOICE_LEVEL)

export const TIMBRES = Object.freeze({
  round: withHouseLevel(round),
  fat: withHouseLevel(fat),
  string: withHouseLevel(string),
  noise: withHouseLevel(noise)
})

// Готовые звуки Biotron. Тембры — авторские, из chromatone/elements (см.
// timbres.mjs и лицензию рядом с fx/), а не наши собственные кривые: они
// написаны под этот движок и на нём проверены. Здесь только выбор значений
// под наш прибор — растение шлёт очень короткие ноты (~27 мс), поэтому у
// каждого звука быстрая атака; авторские значения по умолчанию рассчитаны на
// клавиатуру и на щипке растения звучали бы вполсилы.
//
// Форма звука: {name, timbre, cv, fx}. `cv` — параметры тембра (их имена
// авторские), `fx` — общая цепь мастера (patch.mjs master()).

const FX_DEFAULT = Object.freeze({
  cutoff: 12000, resonance: 0.7, delayTime: 0.22, delayFeedback: 0.1, delayWet: 0.05, reverbWet: 0.12
})
const fx = extra => Object.freeze({...FX_DEFAULT, ...extra})

// Общие для всех тембров огибающие: атака в 7 мс (0.06 * 0.125 c) успевает
// за нотой растения, отпускание длинное, чтобы отдельная нота не обрывалась.
const ENV = Object.freeze({attack: 0.06, decay: 1, sustain: 0.5, release: 2,
  fattack: 0.1, fdecay: 1.2, fsustain: 0.4, frelease: 2})

export const SOUNDS = Object.freeze([
  {name: 'Round', timbre: 'round',
    cv: {...ENV, gain: 0.8, octave: 0, shape: 0.2, vibdep: 0.1, vibrate: 2, cutoff: 900, cutq: 1.1, fenv: 1.5},
    fx: fx()},
  {name: 'Round Bright', timbre: 'round',
    cv: {...ENV, gain: 0.75, octave: 0, shape: 0.6, vibdep: 0.05, vibrate: 3, cutoff: 2200, cutq: 1.4, fenv: 3},
    fx: fx({reverbWet: 0.1})},
  {name: 'Fat', timbre: 'fat',
    cv: {...ENV, gain: 0.6, octave: 0, shape: 0.3, vibdep: 0.08, vibrate: 2, cutoff: 700, cutq: 1.1, fenv: 2},
    fx: fx({delayWet: 0.08})},
  {name: 'Fat Bass', timbre: 'fat',
    cv: {...ENV, gain: 0.6, octave: -1, shape: 0.35, vibdep: 0.03, vibrate: 2, cutoff: 400, cutq: 2, fenv: 1.2},
    fx: fx({reverbWet: 0.06, delayWet: 0.03})},
  {name: 'String', timbre: 'string',
    cv: {...ENV, gain: 0.8, octave: 0, noise: 0.95, feedback: 0.95, bandq: 1, cutoff: 1500, cutq: 1.1, fenv: 1},
    fx: fx({reverbWet: 0.16})},
  {name: 'Soft String', timbre: 'string',
    cv: {...ENV, gain: 0.8, octave: 0, noise: 0.5, feedback: 0.9, bandq: 3, cutoff: 800, cutq: 1.1, fenv: 0.8},
    fx: fx({reverbWet: 0.22, delayWet: 0.08, delayTime: 0.3})},
  {name: 'Air', timbre: 'noise',
    cv: {...ENV, gain: 0.9, octave: 0, color: 0.6, bandq: 8, cutoff: 400, cutq: 1.1, fenv: 0.6},
    fx: fx({reverbWet: 0.25, delayWet: 0.1})}
].map(Object.freeze))

// Любой вход приводится к одной форме. Старая форма пресета (SOUND_VARIANTS
// из ../presets.mjs) — это тембр 'glass' плюс его же поля как настройки
// мастера: так тесты и сохранённые пресеты продолжают работать, пока старый
// движок не удалён.
export function toSound(input) {
  if (input && typeof input === 'object' && typeof input.timbre === 'string' && TIMBRES[input.timbre]) {
    return Object.freeze({name: String(input.name || 'Sound').slice(0, 32), timbre: input.timbre,
      cv: {...input.cv}, fx: {...FX_DEFAULT, ...input.fx}})
  }
  const preset = validatePreset(input || {})
  return Object.freeze({name: preset.name, timbre: 'glass', cv: preset, fx: preset})
}

// Как построить один голос для этого звука. Единственное место, где 'glass'
// (наш старый тембр в patch.mjs) и авторские тембры расходятся.
export function voiceBuilder(sound, quality = 'standard') {
  if (sound.timbre === 'glass') return ctx => glassVoice({...ctx, preset: sound.cv, quality})
  return ctx => TIMBRES[sound.timbre](ctx, sound.cv)
}

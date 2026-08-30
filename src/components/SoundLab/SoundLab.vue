<template>
  <main class="sound-lab" :data-audio-state="audioState" :data-active-voices="voiceCount">
    <header class="sound-lab__intro">
      <small>Beta sound lab</small>
      <h1>Play your device</h1>
      <p>Choose a sound, then play from a Playtronica device or your computer keyboard.</p>
    </header>

    <section class="sound-lab__controls" aria-label="Sound controls">
      <button type="button" class="btn btn-dark" @click="start" :disabled="starting || releaseBlocked">Start sound</button>
      <button type="button" class="btn btn-outline-dark" @click="stop" :disabled="!engine && !midi">Stop &amp; release</button>
      <button type="button" class="btn btn-outline-danger" @click="panic" :disabled="!engine">Stop notes</button>
      <span class="sound-lab__status" role="status" aria-live="polite">{{ status }}</span>
    </section>

    <section aria-labelledby="sound-character">
      <div class="sound-lab__heading">
        <h2 id="sound-character">Glass flute · six ideas</h2>
        <small>Pick by ear</small>
      </div>
      <div class="sound-lab__variants">
        <button
          v-for="(preset, index) in variants"
          :key="preset.name"
          type="button"
          class="sound-lab__variant"
          :class="{'sound-lab__variant--active': index === currentVariant}"
          :aria-pressed="index === currentVariant"
          @click="chooseVariant(index)"
        >
          <span>{{ index + 1 }}</span>{{ preset.name }}
        </button>
      </div>
    </section>

    <section aria-labelledby="sound-keyboard">
      <div class="sound-lab__heading">
        <h2 id="sound-keyboard">Keyboard</h2>
        <small>A–K physical keys · any language</small>
      </div>
      <div class="sound-lab__keyboard" aria-label="One octave keyboard">
        <button
          v-for="key in keyboard"
          :key="key.code"
          type="button"
          :class="{'sound-lab__black-key': key.black}"
          :aria-label="key.noteName"
          @pointerdown="pressScreenKey($event, key.note)"
          @pointerup="releaseScreenKey(key.note)"
          @pointercancel="releaseScreenKey(key.note)"
          @lostpointercapture="releaseScreenKey(key.note)"
        >{{ key.label }}</button>
      </div>
    </section>

    <section class="sound-lab__midi" aria-labelledby="sound-device">
      <div>
        <h2 id="sound-device">Playtronica device</h2>
        <p>Only the selected MIDI input is opened. Stop &amp; release closes it.</p>
      </div>
      <div class="sound-lab__midi-actions">
        <select v-if="midiInputs.length" v-model="selectedInput" class="form-select" aria-label="MIDI input">
          <option v-for="input in midiInputs" :key="input.id" :value="input.id">
            {{ [input.manufacturer, input.name].filter(Boolean).join(' — ') }}
          </option>
        </select>
        <button type="button" class="btn btn-primary" @click="connectMidi" :disabled="starting || releaseBlocked">
          {{ midiInputs.length ? 'Connect selected' : 'Find MIDI device' }}
        </button>
      </div>
    </section>
  </main>
</template>

<script>
import {markRaw} from 'vue'
import {noteForKeyboardCode} from '@/audio/core.mjs'
import {createRealtimeSynth} from '@/audio/engine.mjs'
import {MidiInputSession} from '@/audio/midi.mjs'
import {SOUND_VARIANTS} from '@/audio/presets.mjs'

const keyboard = [
  ['KeyA', 60, 'A', 'C', false], ['KeyW', 61, 'W', 'C sharp', true],
  ['KeyS', 62, 'S', 'D', false], ['KeyE', 63, 'E', 'D sharp', true],
  ['KeyD', 64, 'D', 'E', false], ['KeyF', 65, 'F', 'F', false],
  ['KeyT', 66, 'T', 'F sharp', true], ['KeyG', 67, 'G', 'G', false],
  ['KeyY', 68, 'Y', 'G sharp', true], ['KeyH', 69, 'H', 'A', false],
  ['KeyU', 70, 'U', 'A sharp', true], ['KeyJ', 71, 'J', 'B', false],
  ['KeyK', 72, 'K', 'C high', false]
].map(([code, note, label, noteName, black]) => ({code, note, label, noteName, black}))

export default {
  name: 'SoundLab',
  data() {
    return {
      engine: null,
      midi: null,
      variants: SOUND_VARIANTS,
      currentVariant: 0,
      keyboard,
      heldCodes: markRaw(new Set()),
      midiInputs: [],
      selectedInput: '',
      status: 'Press Start sound',
      audioState: 'closed',
      voiceCount: 0,
      starting: false,
      releaseBlocked: false,
      voiceRefreshTimer: null,
      keyDownHandler: null,
      keyUpHandler: null,
      visibilityHandler: null
    }
  },
  mounted() {
    this.keyDownHandler = event => this.handleKeyDown(event)
    this.keyUpHandler = event => this.handleKeyUp(event)
    this.visibilityHandler = () => this.handleVisibility()
    window.addEventListener('keydown', this.keyDownHandler)
    window.addEventListener('keyup', this.keyUpHandler)
    document.addEventListener('visibilitychange', this.visibilityHandler)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.keyDownHandler)
    window.removeEventListener('keyup', this.keyUpHandler)
    document.removeEventListener('visibilitychange', this.visibilityHandler)
    this.heldCodes.clear()
    window.clearTimeout(this.voiceRefreshTimer)
    const midi = this.midi
    const engine = this.engine
    Promise.resolve().then(async () => {
      try { await midi?.close() } catch (error) { void error }
      try { await engine?.stop() } catch (error) { void error }
    })
  },
  methods: {
    async ensureEngine() {
      if (!this.engine || this.engine.state === 'closed') {
        this.engine = markRaw(createRealtimeSynth({preset: this.variants[this.currentVariant]}))
        this.midi = markRaw(new MidiInputSession(this.engine, event => this.handleMidiState(event)))
      }
      if (await this.engine.resume() !== 'running') throw new Error('Audio could not start.')
      this.audioState = 'running'
      this.status = 'Sound ready'
      return this.engine
    },
    async start() {
      this.starting = true
      try { await this.ensureEngine() } catch (error) { this.status = error.message }
      finally { this.starting = false }
    },
    async stop() {
      this.starting = true
      let releaseFailed = false
      try { await this.midi?.close() } catch (error) { releaseFailed = true }
      await this.engine?.stop()
      this.engine = null
      this.audioState = 'closed'
      this.voiceCount = 0
      this.heldCodes.clear()
      this.releaseBlocked = releaseFailed
      if (releaseFailed) this.status = 'Sound stopped, but MIDI did not release. Press Stop again.'
      else {
        this.midi = null
        this.midiInputs = []
        this.selectedInput = ''
        this.status = 'Stopped — MIDI released'
      }
      this.starting = false
    },
    panic() {
      this.engine?.panic()
      this.heldCodes.clear()
      window.clearTimeout(this.voiceRefreshTimer)
      this.voiceCount = 0
      this.status = 'All notes stopped'
    },
    chooseVariant(index) {
      this.currentVariant = index
      this.engine?.applyPreset(this.variants[index])
      this.status = `${this.variants[index].name} selected`
    },
    play(note, source = 'screen') {
      if (this.engine?.state === 'running') {
        this.engine.noteOn(source, 0, note, 104)
        this.voiceCount = this.engine.activeVoiceCount
      }
    },
    release(note, source = 'screen') {
      this.engine?.noteOff(source, 0, note)
      window.clearTimeout(this.voiceRefreshTimer)
      this.voiceRefreshTimer = window.setTimeout(() => {
        this.voiceCount = this.engine?.activeVoiceCount || 0
      }, 3100)
    },
    pressScreenKey(event, note) {
      event.preventDefault()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      this.play(note)
    },
    releaseScreenKey(note) { this.release(note) },
    handleKeyDown(event) {
      const note = noteForKeyboardCode(event.code)
      if (note === null || event.repeat || this.heldCodes.has(event.code)) return
      event.preventDefault()
      this.heldCodes.add(event.code)
      this.play(note, 'keyboard')
    },
    handleKeyUp(event) {
      const note = noteForKeyboardCode(event.code)
      if (note === null) return
      event.preventDefault()
      this.heldCodes.delete(event.code)
      this.release(note, 'keyboard')
    },
    async connectMidi() {
      this.starting = true
      try {
        await this.ensureEngine()
        if (!this.midiInputs.length) {
          this.midiInputs = await this.midi.requestAccess()
          this.selectedInput = this.midiInputs[0]?.id || ''
          if (!this.selectedInput) throw new Error('No MIDI inputs found.')
        }
        await this.midi.connect(this.selectedInput)
      } catch (error) { this.status = error.message }
      finally { this.starting = false }
    },
    handleMidiState(event) {
      if (event.type === 'connected') this.status = `${event.input} connected`
      else if (event.type === 'released') this.status = 'MIDI released'
      else if (event.type === 'disconnected') this.status = 'MIDI disconnected — notes stopped'
      else if (event.type === 'release-error') this.status = 'MIDI release failed — retry Stop'
      else if (event.type === 'voices') this.voiceCount = event.count
    },
    async handleVisibility() {
      if (!document.hidden || !this.engine) return
      this.engine.panic()
      this.voiceCount = 0
      try { await this.engine.context.suspend() } catch (error) { void error }
      this.audioState = 'suspended'
      this.status = 'Paused in background — press Start sound'
    }
  }
}
</script>

<style scoped>
.sound-lab { width: min(900px, 100%); margin: 0 auto; padding: 1.5rem 0 4rem; text-align: left; color: #17171a; }
.sound-lab__intro { max-width: 650px; margin-bottom: 2rem; }
.sound-lab__intro small { color: #6b6761; text-transform: uppercase; letter-spacing: .08em; }
.sound-lab__intro h1 { margin: .35rem 0; font-size: clamp(2.25rem, 7vw, 4.5rem); line-height: 1; letter-spacing: -.045em; }
.sound-lab__intro p, .sound-lab__midi p { color: #625e58; line-height: 1.5; }
.sound-lab section { margin-top: 2rem; }
.sound-lab__controls, .sound-lab__variants, .sound-lab__midi-actions { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.sound-lab__status { min-height: 1.5rem; padding-left: .5rem; color: #625e58; }
.sound-lab__heading { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .75rem; }
.sound-lab__heading h2, .sound-lab__midi h2 { margin: 0; font-size: 1rem; font-weight: 700; }
.sound-lab__heading small { color: #6b6761; }
.sound-lab__variant { min-height: 44px; border: 1px solid #cbc6be; border-radius: 999px; background: #fff; padding: 0 1rem; }
.sound-lab__variant span { display: inline-grid; place-items: center; width: 1.5rem; height: 1.5rem; margin-right: .4rem; border-radius: 50%; background: #eeeae2; }
.sound-lab__variant--active { border-color: #6a5acd; background: #e9e3ff; }
.sound-lab__keyboard { display: grid; grid-template-columns: repeat(13, minmax(44px, 1fr)); gap: 4px; overflow-x: auto; padding-bottom: .5rem; }
.sound-lab__keyboard button { min-width: 44px; height: 120px; border: 1px solid #cbc6be; border-radius: .6rem; background: #fff; align-content: end; padding-bottom: .7rem; }
.sound-lab__keyboard .sound-lab__black-key { height: 82px; background: #2b2b30; color: #fff; }
.sound-lab__midi { display: flex; justify-content: space-between; gap: 1.5rem; align-items: center; border-top: 1px solid #d6d1c8; padding-top: 1.5rem; }
.sound-lab__midi p { margin: .3rem 0 0; }
.sound-lab__midi-actions .form-select { min-width: min(340px, 80vw); }
@media (max-width: 640px) { .sound-lab__midi { align-items: flex-start; flex-direction: column; } .sound-lab__keyboard { grid-template-columns: repeat(13, 48px); } }
@media (prefers-reduced-motion: reduce) { .sound-lab button { transition: none; } }
</style>

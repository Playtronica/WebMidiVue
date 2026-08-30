<template>
  <main
    class="sound-lab"
    :data-audio-state="audioState"
    :data-active-voices="voiceCount"
    :data-quality="lowCpu ? 'safe' : 'standard'"
    :data-tab-lease="tabLeaseState"
    :data-reveal-stage="revealMode ? revealStage : null"
    :data-audio-capability="capabilities.audio ? 'available' : 'unavailable'"
    :data-midi-capability="capabilities.midi ? 'available' : 'unavailable'"
  >
    <template v-if="revealMode">
      <DeviceTaskNav
        :device-name="revealProfile.productName"
        active-task="play"
        :play-route="`/${revealProfile.id}/play`"
        :settings-route="revealProfile.settingsRoute"
      />
      <header class="sound-lab__intro sound-lab__intro--reveal">
        <small>{{ revealProfile.eyebrow }}</small>
        <h1>{{ revealProfile.title }}</h1>
        <p>{{ revealProfile.promise }}</p>
      </header>

      <section class="sound-lab__reveal" aria-labelledby="device-reveal-title">
        <div
          class="sound-lab__reveal-orb"
          :class="{
            'sound-lab__reveal-orb--active': voiceCount > 0,
            'sound-lab__reveal-orb--settling': revealStage === 'settling',
            'sound-lab__reveal-orb--calibrating': revealStage === 'calibrating'
          }"
          aria-hidden="true"
        >
          <span v-if="revealStage === 'calibrating'" class="sound-lab__calibration-note sound-lab__calibration-note--one"></span>
          <span v-if="revealStage === 'calibrating'" class="sound-lab__calibration-note sound-lab__calibration-note--two"></span>
        </div>
        <div class="sound-lab__reveal-copy">
          <template v-if="revealStage === 'intro'">
            <h2 id="device-reveal-title">{{ revealProfile.introHeading }}</h2>
            <p>{{ revealProfile.introInstruction }}</p>
          </template>
          <template v-else-if="revealStage === 'settling'">
            <small class="sound-lab__recognized" :title="recognizedInput">{{ revealProfile.productName }} connected</small>
            <h2 id="device-reveal-title">{{ revealProfile.settlingHeading }}</h2>
            <p>{{ revealProfile.settlingInstruction }}</p>
          </template>
          <template v-else-if="revealStage === 'calibrating'">
            <small class="sound-lab__recognized" :title="recognizedInput">{{ revealProfile.productName }} connected</small>
            <h2 id="device-reveal-title">{{ revealProfile.calibratingHeading }}</h2>
            <p>{{ revealProfile.calibratingInstruction }}</p>
          </template>
          <template v-else-if="revealStage === 'ready'">
            <small class="sound-lab__recognized" :title="recognizedInput">{{ revealProfile.productName }} connected</small>
            <h2 id="device-reveal-title">{{ revealProfile.readyHeading }}</h2>
            <p>{{ revealProfile.readyInstruction }}</p>
          </template>
          <template v-else>
            <small class="sound-lab__recognized" :title="recognizedInput">{{ revealProfile.productName }} connected</small>
            <h2 id="device-reveal-title">{{ revealProfile.revealedHeading }}</h2>
            <p>{{ revealProfile.explanation }}</p>
          </template>

          <div class="sound-lab__reveal-actions">
            <button
              v-if="revealStage === 'intro' || (engine && audioState !== 'running' && !releaseBlocked)"
              type="button"
              class="btn btn-dark"
              @click="startReveal"
              :disabled="starting || releaseBlocked || !canStartReveal"
            >{{ revealStage === 'intro' ? revealProfile.startLabel : 'Resume sound' }}</button>
            <button
              v-if="engine || midi"
              type="button"
              class="btn btn-outline-dark"
              @click="stop"
              :disabled="starting"
            >Stop &amp; release</button>
            <button
              v-if="engine"
              type="button"
              class="btn btn-outline-danger"
              @click="panic"
            >Stop notes</button>
          </div>
          <span class="sound-lab__status sound-lab__status--reveal" role="status" aria-live="polite">{{ status }}</span>
        </div>
      </section>

      <section v-if="revealStage === 'revealed'" class="sound-lab__after-reveal" :aria-label="`Continue with ${revealProfile.productName}`">
        <button type="button" class="btn btn-primary" @click="revealExpanded = !revealExpanded">
          {{ revealExpanded ? 'Hide sounds' : 'Choose a sound' }}
        </button>
        <router-link class="btn btn-outline-primary" :to="revealProfile.settingsRoute">Settings</router-link>
        <div v-if="revealExpanded" class="sound-lab__reveal-variants" aria-label="Sound choices">
          <button
            v-for="(preset, index) in variants"
            :key="preset.name"
            type="button"
            class="sound-lab__variant"
            :class="{'sound-lab__variant--active': index === currentVariant}"
            :aria-pressed="index === currentVariant"
            :aria-label="`Sound ${index + 1}`"
            @click="chooseVariant(index)"
          ><span>{{ index + 1 }}</span></button>
        </div>
      </section>
    </template>

    <template v-else>
    <header class="sound-lab__intro">
      <small>Beta sound lab</small>
      <h1>Play your device</h1>
      <p>Choose a sound, then play from a Playtronica device or your computer keyboard.</p>
    </header>

    <CompatibilityNotice v-if="midiAdvisory" :issue="midiAdvisory" advisory />

    <section class="sound-lab__controls" aria-label="Sound controls">
      <button type="button" class="btn btn-dark" @click="start" :disabled="starting || releaseBlocked || !capabilities.audio">Start sound</button>
      <button type="button" class="btn btn-outline-dark" @click="stop" :disabled="starting || (!engine && !midi)">Stop &amp; release</button>
      <button type="button" class="btn btn-outline-danger" @click="panic" :disabled="!engine">Stop notes</button>
      <label class="sound-lab__quality">
        <input
          type="checkbox"
          v-model="lowCpu"
          :disabled="Boolean(engine) || releaseBlocked"
          aria-label="Low CPU — use if sound crackles"
        >
        Low CPU
      </label>
      <span class="sound-lab__status" role="status" aria-live="polite">{{ status }}</span>
    </section>

    <section aria-labelledby="sound-character">
      <div class="sound-lab__heading">
        <h2 id="sound-character">Sounds</h2>
        <small>Choose by ear</small>
      </div>
      <div class="sound-lab__variants">
        <button
          v-for="(preset, index) in variants"
          :key="preset.name"
          type="button"
          class="sound-lab__variant"
          :class="{'sound-lab__variant--active': index === currentVariant}"
          :aria-pressed="index === currentVariant"
          :aria-label="`Sound ${index + 1}`"
          @click="chooseVariant(index)"
        >
          <span>{{ index + 1 }}</span>
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

    <section v-if="capabilities.midi && !platformCapabilities.mobile" class="sound-lab__midi" aria-labelledby="sound-device">
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
        <button type="button" class="btn btn-primary" @click="connectMidi" :disabled="starting || releaseBlocked || !capabilities.audio || !capabilities.midi">
          {{ midiInputs.length ? 'Connect selected' : 'Find MIDI device' }}
        </button>
      </div>
    </section>
    </template>
  </main>
</template>

<script>
import {markRaw} from 'vue'
import {noteForKeyboardCode} from '@/audio/core.mjs'
import {createRealtimeSynth} from '@/audio/engine.mjs'
import {MidiInputSession} from '@/audio/midi.mjs'
import {SOUND_VARIANTS} from '@/audio/presets.mjs'
import {createExclusiveTabLease} from '@/audio/tabLease.mjs'
import {BIOTRON_CALIBRATION, BiotronCalibrationTracker} from '@/audio/biotronCalibration.mjs'
import {getRevealProfile, selectRevealInput} from '@/audio/revealProfiles.mjs'
import {detectSoundCapabilities, soundCapabilityMessage} from '@/audio/capabilities.mjs'
import DeviceTaskNav from '@/components/DeviceTaskNav.vue'
import CompatibilityNotice from '@/components/CompatibilityNotice.vue'
import {buildMidiAdvisory, detectPlatformCapabilities} from '@/compatibility.mjs'

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
  components: {CompatibilityNotice, DeviceTaskNav},
  props: {
    mode: {type: String, default: 'lab'},
    profileId: {type: String, default: ''}
  },
  computed: {
    revealMode() { return this.mode === 'reveal' },
    revealProfile() { return getRevealProfile(this.profileId) },
    canStartReveal() { return this.capabilities.audio && this.capabilities.midi },
    midiAdvisory() { return this.revealMode ? null : buildMidiAdvisory(this.platformCapabilities) }
  },
  data() {
    const capabilities = detectSoundCapabilities()
    return {
      engine: null,
      midi: null,
      variants: SOUND_VARIANTS,
      currentVariant: 0,
      keyboard,
      heldCodes: markRaw(new Set()),
      midiInputs: [],
      selectedInput: '',
      capabilities: markRaw(capabilities),
      platformCapabilities: markRaw(detectPlatformCapabilities()),
      status: this.mode === 'reveal'
        ? soundCapabilityMessage(capabilities, {requiresMidi: true}) || 'Ready when you are'
        : capabilities.audio ? 'Press Start sound' : soundCapabilityMessage(capabilities),
      audioState: 'closed',
      voiceCount: 0,
      lowCpu: this.mode === 'reveal',
      starting: false,
      releaseBlocked: false,
      calibrationTracker: markRaw(new BiotronCalibrationTracker()),
      calibrationCandidateTimer: null,
      calibrationFinishTimer: null,
      voiceRefreshTimer: null,
      voiceFrame: null,
      pendingVoiceCount: 0,
      keyDownHandler: null,
      keyUpHandler: null,
      blurHandler: null,
      visibilityHandler: null,
      tabLease: null,
      tabLeaseState: 'free',
      revealStage: 'intro',
      revealExpanded: false,
      recognizedInput: ''
    }
  },
  mounted() {
    this.tabLease = markRaw(createExclusiveTabLease('playtronica-settings-sound-lab'))
    this.keyDownHandler = event => this.handleKeyDown(event)
    this.keyUpHandler = event => this.handleKeyUp(event)
    this.blurHandler = () => this.releaseHeldKeyboard()
    this.visibilityHandler = () => this.handleVisibility()
    window.addEventListener('keydown', this.keyDownHandler)
    window.addEventListener('keyup', this.keyUpHandler)
    window.addEventListener('blur', this.blurHandler)
    document.addEventListener('visibilitychange', this.visibilityHandler)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.keyDownHandler)
    window.removeEventListener('keyup', this.keyUpHandler)
    window.removeEventListener('blur', this.blurHandler)
    document.removeEventListener('visibilitychange', this.visibilityHandler)
    this.clearCalibrationTimers()
    this.resetVoiceUi()
    const midi = this.midi
    const engine = this.engine
    const tabLease = this.tabLease
    Promise.resolve().then(async () => {
      try { await midi?.close() } catch (error) { void error }
      try { await engine?.stop() } catch (error) { void error }
      tabLease?.release()
    })
  },
  async beforeRouteLeave(to, from, next) {
    void to
    void from
    if (!this.engine && !this.midi) {
      next()
      return
    }
    await this.stop()
    if (this.releaseBlocked) next(false)
    else next()
  },
  methods: {
    async acquireTabLease() {
      if (await this.tabLease.acquire()) {
        this.tabLeaseState = this.tabLease.protected ? 'held' : 'unprotected'
        return true
      }
      this.tabLeaseState = 'blocked'
      this.status = 'Sound is already open in another Settings window.'
      return false
    },
    async ensureEngine() {
      if (!this.engine || this.engine.state === 'closed') {
        this.engine = markRaw(createRealtimeSynth({
          preset: this.variants[this.currentVariant],
          quality: this.lowCpu ? 'safe' : 'standard',
          onStateChange: state => this.handleAudioContextState(state)
        }))
        this.midi = markRaw(new MidiInputSession(this.engine, event => this.handleMidiState(event)))
      }
      if (await this.engine.resume() !== 'running') throw new Error('Audio could not start.')
      this.midi?.setEnabled(true)
      this.audioState = 'running'
      this.status = 'Sound ready'
      return this.engine
    },
    async start() {
      if (!this.capabilities.audio) {
        this.status = soundCapabilityMessage(this.capabilities)
        return
      }
      this.starting = true
      try {
        if (!await this.acquireTabLease()) return
        await this.ensureEngine()
        if (!this.tabLease.protected) this.status = 'Sound ready — keep one Settings window open'
      } catch (error) {
        this.status = error.message
        try { await this.engine?.stop() } catch (stopError) { void stopError }
        this.engine = null
        this.midi = null
        this.audioState = 'closed'
        this.tabLease.release()
        this.tabLeaseState = 'free'
      }
      finally { this.starting = false }
    },
    async stop() {
      this.starting = true
      let midiFailed = false
      let audioFailed = false
      try { await this.midi?.close() } catch (error) { midiFailed = true }
      try { await this.engine?.stop() } catch (error) { audioFailed = true }
      if (!midiFailed) this.midi = null
      if (!audioFailed) this.engine = null
      this.audioState = audioFailed ? 'error' : 'closed'
      this.resetVoiceUi()
      this.releaseBlocked = midiFailed || audioFailed
      if (midiFailed && audioFailed) this.status = 'Audio and MIDI did not release. Press Stop again.'
      else if (midiFailed) this.status = 'Sound stopped, but MIDI did not release. Press Stop again.'
      else if (audioFailed) this.status = 'MIDI released, but audio did not close. Press Stop again.'
      else {
        this.midiInputs = []
        this.selectedInput = ''
        this.revealStage = 'intro'
        this.revealExpanded = false
        this.recognizedInput = ''
        this.resetCalibration()
        this.tabLease.release()
        this.tabLeaseState = 'free'
        this.status = 'Stopped — MIDI released'
      }
      this.starting = false
    },
    resetVoiceUi() {
      this.heldCodes.clear()
      window.clearTimeout(this.voiceRefreshTimer)
      window.cancelAnimationFrame(this.voiceFrame)
      this.voiceFrame = null
      this.pendingVoiceCount = 0
      this.voiceCount = 0
    },
    panic() {
      this.engine?.panic()
      this.resetVoiceUi()
      this.status = 'All notes stopped'
    },
    chooseVariant(index) {
      this.currentVariant = index
      this.engine?.applyPreset(this.variants[index])
      this.status = `Sound ${index + 1} selected`
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
    releaseHeldKeyboard() {
      const codes = [...this.heldCodes]
      this.heldCodes.clear()
      for (const code of codes) {
        const note = noteForKeyboardCode(code)
        if (note !== null) this.release(note, 'keyboard')
      }
    },
    async connectMidi() {
      if (!this.capabilities.audio || !this.capabilities.midi) {
        this.status = soundCapabilityMessage(this.capabilities, {requiresMidi: true})
        return
      }
      this.starting = true
      try {
        if (!await this.acquireTabLease()) return
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
    async startReveal() {
      if (!this.canStartReveal) {
        this.status = soundCapabilityMessage(this.capabilities, {requiresMidi: true})
        return
      }
      this.starting = true
      let failure = ''
      try {
        if (!await this.acquireTabLease()) return
        await this.ensureEngine()
        const input = selectRevealInput(await this.midi.requestAccess(), this.revealProfile)
        this.midiInputs = [input]
        this.selectedInput = input.id
        await this.midi.connect(input.id)
        this.recognizedInput = [input.manufacturer, input.name].filter(Boolean).join(' — ')
        this.beginCalibrationWait()
      } catch (error) {
        failure = error.message || `${this.revealProfile.productName} could not start.`
        await this.stop()
        if (!this.releaseBlocked) this.status = failure
      } finally {
        this.starting = false
      }
    },
    handleMidiState(event) {
      if (event.type === 'ports') {
        this.midiInputs = event.inputs
        if (!event.inputs.some(input => input.id === this.selectedInput)) {
          this.selectedInput = event.inputs[0]?.id || ''
        }
      }
      else if (event.type === 'connected') {
        this.status = `${event.input} connected`
        if (this.revealMode) {
          this.recognizedInput = event.input
        }
      }
      else if (event.type === 'released') this.status = 'MIDI released'
      else if (event.type === 'disconnected') {
        window.cancelAnimationFrame(this.voiceFrame)
        this.voiceFrame = null
        this.voiceCount = 0
        if (this.revealMode) {
          this.revealStage = 'intro'
          this.recognizedInput = ''
          this.resetCalibration()
        }
        this.status = 'MIDI disconnected — notes stopped'
      }
      else if (event.type === 'release-error') this.status = 'MIDI release failed — retry Stop'
      else if (event.type === 'voices') {
        if (this.revealMode) this.handleRevealMessage(event.message)
        this.pendingVoiceCount = event.count
        if (this.voiceFrame === null) {
          this.voiceFrame = window.requestAnimationFrame(() => {
            this.voiceCount = this.pendingVoiceCount
            this.voiceFrame = null
          })
        }
      }
    },
    clearCalibrationTimers() {
      window.clearTimeout(this.calibrationCandidateTimer)
      window.clearTimeout(this.calibrationFinishTimer)
      this.calibrationCandidateTimer = null
      this.calibrationFinishTimer = null
    },
    resetCalibration() {
      this.clearCalibrationTimers()
      this.calibrationTracker.reset()
    },
    beginCalibrationWait() {
      this.resetCalibration()
      this.revealStage = 'settling'
      this.status = this.revealProfile.settlingStatus
    },
    finishCalibration() {
      this.resetCalibration()
      if (this.revealStage !== 'intro') {
        this.revealStage = 'ready'
        this.status = this.revealProfile.readyStatus
      }
    },
    handleRevealMessage(message) {
      if (this.revealStage === 'ready' && message?.type === 'note-on') {
        this.revealStage = 'revealed'
        this.status = 'Biotron is making sound'
        return
      }
      if (!['settling', 'calibrating'].includes(this.revealStage)) return

      const state = this.calibrationTracker.observe(message, performance.now())
      if (state === 'candidate') {
        window.clearTimeout(this.calibrationCandidateTimer)
        this.calibrationCandidateTimer = window.setTimeout(
          () => this.finishCalibration(),
          BIOTRON_CALIBRATION.quietCompletionMs
        )
      }
      else if (state === 'calibrating') {
        window.clearTimeout(this.calibrationCandidateTimer)
        window.clearTimeout(this.calibrationFinishTimer)
        this.calibrationCandidateTimer = null
        this.revealStage = 'calibrating'
        this.status = this.revealProfile.calibratingStatus
        this.calibrationFinishTimer = window.setTimeout(
          () => this.finishCalibration(),
          BIOTRON_CALIBRATION.quietCompletionMs
        )
      }
      else if (state === 'activity') {
        this.finishCalibration()
      }
    },
    pauseInputs(status) {
      if (this.midi) this.midi.setEnabled(false)
      else this.engine?.panic()
      this.resetVoiceUi()
      this.status = status
    },
    handleAudioContextState(state) {
      if (!this.engine || state === 'running') return
      if (state === 'closed') {
        this.pauseInputs('Audio stopped unexpectedly — press Stop & release')
        this.audioState = 'closed'
        this.releaseBlocked = true
        return
      }
      this.pauseInputs(document.hidden
        ? 'Paused in background — press Start sound'
        : 'Audio paused — press Start sound')
      this.audioState = 'suspended'
    },
    async handleVisibility() {
      if (!document.hidden || !this.engine) return
      this.pauseInputs('Paused in background — press Start sound')
      try { await this.engine.context.suspend() } catch (error) { void error }
      this.audioState = 'suspended'
    }
  }
}
</script>

<style scoped>
.sound-lab { width: min(900px, 100%); margin: 0 auto; padding: 1.5rem 0 4rem; text-align: left; color: #17171a; }
.sound-lab__intro { max-width: 650px; margin-bottom: 2rem; }
.sound-lab__intro--reveal { margin: 2.25rem auto 1.5rem; text-align: center; }
.sound-lab__intro small { color: #6b6761; text-transform: uppercase; letter-spacing: .08em; }
.sound-lab__intro h1 { margin: .35rem 0; font-size: clamp(2.25rem, 7vw, 4.5rem); line-height: 1; letter-spacing: -.045em; }
.sound-lab__intro p, .sound-lab__midi p { color: #625e58; line-height: 1.5; }
.sound-lab section { margin-top: 2rem; }
.sound-lab__controls, .sound-lab__variants, .sound-lab__midi-actions { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.sound-lab__status { min-height: 1.5rem; padding-left: .5rem; color: #625e58; }
.sound-lab__quality { display: inline-flex; min-height: 44px; align-items: center; gap: .4rem; margin: 0; padding: 0 .35rem; white-space: nowrap; }
.sound-lab__quality input { width: 1.1rem; height: 1.1rem; }
.sound-lab__heading { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .75rem; }
.sound-lab__heading h2, .sound-lab__midi h2 { margin: 0; font-size: 1rem; font-weight: 700; }
.sound-lab__heading small { color: #6b6761; }
.sound-lab__variant { min-height: 44px; border: 1px solid #cbc6be; border-radius: 999px; background: #fff; padding: 0 1rem; }
.sound-lab__variant span { display: inline-grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: 50%; background: #eeeae2; }
.sound-lab__variant--active { border-color: #6a5acd; background: #e9e3ff; }
.sound-lab__reveal { display: grid; grid-template-columns: minmax(150px, 240px) minmax(0, 1fr); gap: clamp(1.5rem, 5vw, 4rem); align-items: center; max-width: 760px; margin: 0 auto; padding: clamp(1.25rem, 4vw, 2.5rem); border: 1px solid #ded9d1; border-radius: 1.5rem; background: #fbfaf7; }
.sound-lab__reveal-orb { width: min(48vw, 220px); aspect-ratio: 1; justify-self: center; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff 0 8%, #dcd4ff 24%, #7c69d8 65%, #302763 100%); box-shadow: 0 0 0 0 rgba(106, 90, 205, .24); transform: scale(.9); transition: transform 180ms ease, box-shadow 180ms ease; }
.sound-lab__reveal-orb--active { transform: scale(1); box-shadow: 0 0 0 18px rgba(106, 90, 205, .16), 0 18px 50px rgba(69, 49, 150, .22); }
.sound-lab__reveal-orb--settling { animation: biotron-settling 1.8s ease-in-out infinite; }
.sound-lab__reveal-orb--calibrating { position: relative; animation: biotron-calibrating .28s ease-in-out infinite alternate; }
.sound-lab__calibration-note { position: absolute; top: 50%; width: 18%; height: 36%; border-radius: 999px; background: rgba(255, 255, 255, .92); transform: translateY(-50%) scaleY(.45); }
.sound-lab__calibration-note--one { left: 27%; animation: biotron-note-one .28s steps(2, end) infinite; }
.sound-lab__calibration-note--two { right: 27%; animation: biotron-note-two .28s steps(2, end) .14s infinite; }
.sound-lab__reveal-copy h2 { margin: .25rem 0 .5rem; font-size: clamp(1.5rem, 4vw, 2.4rem); }
.sound-lab__reveal-copy p { max-width: 34rem; color: #625e58; line-height: 1.5; }
.sound-lab__recognized { color: #4d427e; font-weight: 700; }
.sound-lab__reveal-actions, .sound-lab__after-reveal { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; }
.sound-lab__status--reveal { display: block; margin-top: .75rem; padding-left: 0; }
.sound-lab__after-reveal { max-width: 760px; margin: 1rem auto 0; }
.sound-lab__reveal-variants { display: flex; flex-basis: 100%; flex-wrap: wrap; gap: .5rem; padding-top: .5rem; }
.sound-lab__keyboard { display: grid; grid-template-columns: repeat(13, minmax(44px, 1fr)); gap: 4px; overflow-x: auto; padding-bottom: .5rem; }
.sound-lab__keyboard button { min-width: 44px; height: 120px; border: 1px solid #cbc6be; border-radius: .6rem; background: #fff; align-content: end; padding-bottom: .7rem; }
.sound-lab__keyboard .sound-lab__black-key { height: 82px; background: #2b2b30; color: #fff; }
.sound-lab__midi { display: flex; justify-content: space-between; gap: 1.5rem; align-items: center; border-top: 1px solid #d6d1c8; padding-top: 1.5rem; }
.sound-lab__midi p { margin: .3rem 0 0; }
.sound-lab__midi-actions .form-select { min-width: min(340px, 80vw); }
@media (max-width: 640px) { .sound-lab__midi { align-items: flex-start; flex-direction: column; } .sound-lab__keyboard { grid-template-columns: repeat(13, 48px); } .sound-lab__reveal { grid-template-columns: 1fr; text-align: center; } .sound-lab__reveal-actions, .sound-lab__after-reveal { justify-content: center; } }
@keyframes biotron-settling { 50% { transform: scale(.96); box-shadow: 0 0 0 12px rgba(106, 90, 205, .12); } }
@keyframes biotron-calibrating { to { transform: scale(1.02); box-shadow: 0 0 0 20px rgba(106, 90, 205, .18), 0 18px 50px rgba(69, 49, 150, .22); } }
@keyframes biotron-note-one { 50% { transform: translateY(-50%) scaleY(1); } }
@keyframes biotron-note-two { 50% { transform: translateY(-50%) scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .sound-lab button, .sound-lab__reveal-orb { transition: none; } .sound-lab__reveal-orb, .sound-lab__calibration-note { animation: none; } }
</style>

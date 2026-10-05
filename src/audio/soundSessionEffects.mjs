// Sound-session effects used by the Play view. Vue owns rendering; this owns
// recovery and Biotron calibration timeouts for the live session.
export function createSoundSessionEffects({resumeAudioWithin, trace, updateSoundSession,
  parseBiotronCalibrationState, BIOTRON_CALIBRATION}) {
  return {
    async copyPlayDiagnostics() {
      const {copyBiotronPlayDiagnostic} = await import(/* webpackChunkName: "biotron-diagnostics" */ '@/biotron/settingsReadback.mjs')
      this.diagnosticMessage = await copyBiotronPlayDiagnostic({
        buildId: process.env.VUE_APP_BUILD_ID || 'local-build',
        route: this.$route?.path || '/biotron/play',
        device: this.midi?.input || null,
        firmwareVersion: null,
        revealStage: this.revealStage,
        stoppedStage: this.revealIssue?.title || (this.audioState === 'running' ? null : this.revealStage),
        audioState: this.audioState,
        midiLastMessageAt: this.midi?.lastMessageAt ?? null,
        resumeOutcome: this.resumeOutcome,
        trace: window.__biotronTrace || [],
      })
    },
    async resumeSound({automatic = false} = {}) {
      const engine = this.engine
      if (!engine || this.starting || this.releaseBlocked ||
          !['suspended', 'interrupted'].includes(engine.context?.state)) return
      if (this.audioState === 'running') this.setAudioState(engine.context.state, 'Audio paused — press Resume sound')
      const attemptId = ++this.resumeAttemptId
      this.starting = true
      this.resumeOutcome = automatic ? 'automatic_starting' : 'manual_starting'
      trace('resume', this.resumeOutcome)
      try {
        const state = await resumeAudioWithin(engine)
        if (this.engine !== engine || this.resumeAttemptId !== attemptId) return
        if (state !== 'running') throw new Error('Audio did not resume.')
        this.setAudioState('running', 'Sound ready — touch the plant to check it.')
        this.resumeOutcome = automatic ? 'automatic_running' : 'manual_running'
        trace('resume', this.resumeOutcome)
      } catch (error) {
        if (this.engine !== engine || this.resumeAttemptId !== attemptId) return
        this.resumeOutcome = /timed out/i.test(error.message) ? 'timed_out' : 'failed'
        trace('resume', this.resumeOutcome)
        this.status = 'Sound is still paused. Try Resume sound once, then copy diagnostics.'
      } finally {
        if (this.resumeAttemptId === attemptId) this.starting = false
      }
    },
    handleRevealMessage(message) {
      const calibration = parseBiotronCalibrationState(message)
      if (calibration) {
        if (calibration.nonce !== this.revealCalibrationNonce || !['settling', 'calibrating'].includes(this.revealStage)) return
        const active = calibration.state !== 'ready'
        if (active && !this.explicitCalibration) {
          const nonce = this.revealCalibrationNonce
          this.clearCalibrationTimers()
          this.explicitCalibration = true
          this.revealWatchdog = window.setTimeout(() => {
            if (!this.explicitCalibration || this.revealCalibrationNonce !== nonce) return
            this.resetCalibration()
            Object.assign(this, {revealStage: 'intro', status: 'Calibration did not finish. Check both plant clips, then try Hear Biotron again.',
              revealIssue: {title: 'Calibration did not finish', body: 'Copy diagnostics before retrying if this happens again.'}, firstSoundOutcome: 'not_yet'})
          }, 25000)
        }
        updateSoundSession({calibrating: active})
        if (active) Object.assign(this, {revealStage: 'calibrating', status: this.revealProfile.calibratingStatus})
        else this.finishCalibration()
        return
      }
      if (this.revealStage === 'ready' && message?.type === 'note-on') {
        this.revealStage = 'revealed'
        this.status = 'Biotron is sending notes — can you hear them?'
        this.firstSoundOutcome = 'awaiting_answer'
        return
      }
      if (this.explicitCalibration || !['settling', 'calibrating'].includes(this.revealStage)) return

      const nonce = this.revealCalibrationNonce
      const state = this.calibrationTracker.observe(message, performance.now())
      if (state === 'candidate') {
        window.clearTimeout(this.calibrationCandidateTimer)
        this.calibrationCandidateTimer = window.setTimeout(
          () => { if (!this.explicitCalibration && this.revealCalibrationNonce === nonce) this.finishCalibration() },
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
          () => { if (!this.explicitCalibration && this.revealCalibrationNonce === nonce) this.finishCalibration() },
          BIOTRON_CALIBRATION.quietCompletionMs
        )
      }
      else if (state === 'activity') this.finishCalibration()
    },
  }
}

export const BIOTRON_CALIBRATION = Object.freeze({
  // 1.9.4 uses a soft G-E-C-G / C-E-G-C cue; older firmware alternates 91/92.
  cue: Object.freeze([79, 76, 72, 67, 72, 76, 79, 84]),
  cueVelocities: Object.freeze([42, 48, 52]),
  legacyNotes: Object.freeze([91, 92]),
  legacyVelocity: 90,
  detectionNotes: 4,
  maxAlternationGapMs: 700,
  quietCompletionMs: 900
})

export class BiotronCalibrationTracker {
  constructor(contract = BIOTRON_CALIBRATION) {
    this.contract = contract
    this.reset()
  }

  reset() {
    this.lastNote = null
    this.lastAt = null
    this.alternations = 0
    this.cueIndex = 0
    this.calibrating = false
  }

  observe(message, at = 0) {
    if (message?.type === 'controller' && message.controller === 90) {
      this.reset()
      return 'activity'
    }
    if (message?.type !== 'note-on') return 'ignored'

    const cueNote = this.contract.cue[this.cueIndex] === message.note &&
      this.contract.cueVelocities.includes(message.velocity)
    const legacyNote = this.contract.legacyNotes.includes(message.note) &&
      message.velocity === this.contract.legacyVelocity
    if (!cueNote && !legacyNote) {
      this.reset()
      return 'activity'
    }

    const timestamp = Number.isFinite(Number(at)) ? Number(at) : 0
    const alternates = this.lastNote !== null && message.note !== this.lastNote
    const followsQuickly = this.lastAt !== null &&
      timestamp >= this.lastAt &&
      timestamp - this.lastAt <= this.contract.maxAlternationGapMs

    if (cueNote) {
      this.cueIndex++
      this.alternations = followsQuickly ? this.cueIndex : 1
    } else {
      this.cueIndex = 0
      this.alternations = alternates && followsQuickly ? this.alternations + 1 : 1
    }
    this.lastNote = message.note
    this.lastAt = timestamp
    this.calibrating = this.alternations >= this.contract.detectionNotes
    return this.calibrating ? 'calibrating' : 'candidate'
  }
}

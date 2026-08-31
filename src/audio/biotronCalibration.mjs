export const BIOTRON_CALIBRATION = Object.freeze({
  // Keep this byte-for-byte aligned with firmware 1.9.4 Gentle Cadence.
  cue: Object.freeze([64, 65, 67, 72, 71, 67, 62, 60]),
  cueVelocity: 64,
  legacyNotes: Object.freeze([91, 92]),
  legacyVelocity: 90,
  detectionNotes: 4,
  maxAlternationGapMs: 700,
  quietCompletionMs: 1100,
  localLevel: 0.08, lightChannel: 2, lightLevel: 0.08
})
export function biotronVoiceLevel(message, contract = BIOTRON_CALIBRATION, calibrating = false) {
  if (message?.type !== 'note-on') return 1
  const cue = contract.cue.includes(message.note) && message.velocity === contract.cueVelocity
  const legacy = contract.legacyNotes.includes(message.note) && message.velocity === contract.legacyVelocity
  if (calibrating || cue || legacy) return contract.localLevel
  return message.channel === contract.lightChannel ? contract.lightLevel : 1
}
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
      this.contract.cueVelocity === message.velocity
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

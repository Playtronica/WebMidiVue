export const BIOTRON_CALIBRATION = Object.freeze({
  // Firmware 1.8.2/current src/leds.c emits this alternating pair only while
  // global status is Stabilization. Four notes avoid treating one high note as calibration.
  notes: Object.freeze([91, 92]),
  velocity: 90,
  detectionNotes: 4,
  maxAlternationGapMs: 250,
  quietCompletionMs: 700
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
    this.calibrating = false
  }

  observe(message, at = 0) {
    if (message?.type === 'controller' && message.controller === 90) {
      this.reset()
      return 'activity'
    }
    if (message?.type !== 'note-on') return 'ignored'

    const calibrationNote = this.contract.notes.includes(message.note) &&
      message.velocity === this.contract.velocity
    if (!calibrationNote) {
      this.reset()
      return 'activity'
    }

    const timestamp = Number.isFinite(Number(at)) ? Number(at) : 0
    const alternates = this.lastNote !== null && message.note !== this.lastNote
    const followsQuickly = this.lastAt !== null &&
      timestamp >= this.lastAt &&
      timestamp - this.lastAt <= this.contract.maxAlternationGapMs

    this.alternations = alternates && followsQuickly ? this.alternations + 1 : 1
    this.lastNote = message.note
    this.lastAt = timestamp
    this.calibrating = this.alternations >= this.contract.detectionNotes
    return this.calibrating ? 'calibrating' : 'candidate'
  }
}

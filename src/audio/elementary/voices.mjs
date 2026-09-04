// Voice pool of 16 keyed constants, on top of the SAME victim rules the
// existing engine uses (VoiceLedger in ../core.mjs: releasing before active,
// oldest first, tie by token). We do not reimplement that decision — we
// delegate to it and only add the slot<->key bookkeeping Elementary needs
// (a fixed set of named constants `v{i}:gate/freq/vel`, since Elementary has
// no per-voice objects, only a flat constant map re-rendered as a whole).
//
// Simplification, stated once here: Elementary's declarative graph has no
// "voice ended" callback (no equivalent of Voice.onEnded in ../engine.mjs).
// So a slot is only ever reclaimed when a NEW note needs it and the ledger
// picks a victim — never proactively freed on release. Once the pool has
// been filled once, every future claim always has a victim to reuse, which
// is the correct behaviour for a fixed-size pool; entries that finished
// ringing out simply sit idle until reused, exactly like a real voice-stealing
// synth with no idle-voice detection.
import {VoiceLedger} from '../core.mjs'

export const VOICE_POOL_SIZE = 16
export const gateKey = index => `v${index}:gate`
export const freqKey = index => `v${index}:freq`
export const velKey = index => `v${index}:vel`

export class VoicePool {
  constructor(size = VOICE_POOL_SIZE) {
    this.size = size
    this.ledger = new VoiceLedger(size)
    this.slotForKey = new Map()
    this.nextFreshSlot = 0
  }

  get activeVoiceCount() {
    let count = 0
    for (const entry of this.ledger.entries.values()) if (entry.state === 'active') count += 1
    return count
  }

  // claim(key, startedAt) -> {slot, token, victimKey}. `key` is the same
  // sourceId:channel:note key makeNoteKey() produces for the legacy engine.
  claim(key, startedAt) {
    const claim = this.ledger.claim(key, startedAt)
    let slot
    if (claim.victimKey != null) {
      slot = this.slotForKey.get(claim.victimKey)
      this.slotForKey.delete(claim.victimKey)
    } else {
      slot = this.nextFreshSlot
      this.nextFreshSlot += 1
    }
    this.slotForKey.set(key, slot)
    return {slot, token: claim.token, victimKey: claim.victimKey}
  }

  release(key, releasedAt) { return this.ledger.markReleased(key, releasedAt) }
  slotFor(key) { return this.slotForKey.get(key) }

  clear() {
    this.ledger.clear()
    this.slotForKey.clear()
    this.nextFreshSlot = 0
  }
}

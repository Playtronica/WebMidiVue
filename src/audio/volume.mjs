import {clamp} from './core.mjs'

export const DEFAULT_VOLUME = 70
// The engine's final soft ceiling contains peaks; this range supplies
// perceived-loudness make-up and an intentional 100–150% boost reserve.
const MAX_OUTPUT_GAIN = 5

export function normalizeVolume(input) {
  if (input === null || input === undefined || input === '') return DEFAULT_VOLUME
  return Math.round(clamp(Number(input), 0, 150, DEFAULT_VOLUME))
}

export function volumeToGain(input) {
  const normalized = normalizeVolume(input) / 100
  return normalized * normalized * MAX_OUTPUT_GAIN
}

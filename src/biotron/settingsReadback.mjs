import {withMidiWriteSession} from "../assets/js/timing.mjs"

export const SETTINGS_QUERY_ID = 123
export const SETTINGS_PROTOCOL_VERSION = 1
export const SETTINGS_SCHEMA_VERSION = 1
export const SETTINGS_SOURCE_PERSISTED = 1
export const SETTINGS_VECTOR_LENGTH = 27
export const CALMER_PLAY_SETTINGS = [
  ["randomness", 0],
  ["performance", 1],
  ["same_note_plant", 2]
]

const FIELD_NAMES = [
  'lightBpm', 'noteOffPercent', 'noteDistance', 'firstValue', 'smoothness',
  'scale', 'minPlantVelocity', 'maxPlantVelocity', 'minLightVelocity',
  'maxLightVelocity', 'randomness', 'same_note_plant', 'same_note_light',
  'range_light_note', 'light_pitch_mode', 'plant_no_velocity',
  'light_no_velocity', 'randomPlantVelocity', 'randomLightVelocity',
  'performance', 'middle_plant_note', 'plant_midi_channel',
  'light_midi_channel', 'swing_first_note_percent', 'button_mode_state'
]

const u7 = value => Math.max(0, Math.min(127, Math.round(Number(value) || 0)))

export function buildSettingsQuery(requestId, source = SETTINGS_SOURCE_PERSISTED) {
  return [0xf0, 0x14, 0x0d, SETTINGS_QUERY_ID, u7(source), u7(requestId), 0xf7]
}

function decodeU35(bytes) {
  return bytes.reduce((value, byte, index) => value + (byte * (2 ** (7 * index))), 0)
}

export function parseSettingsResponse(input, expectedRequestId) {
  const data = Array.from(input || [])
  if (data.length !== 47 || data[0] !== 0xf0 || data[1] !== 0x14 ||
      data[2] !== 0x0d || data[3] !== SETTINGS_QUERY_ID || data[46] !== 0xf7) return null
  if (data.slice(1, -1).some(byte => !Number.isInteger(byte) || byte < 0 || byte > 0x7f)) return null
  if (data[4] !== SETTINGS_PROTOCOL_VERSION || data[5] !== SETTINGS_SCHEMA_VERSION ||
      data[6] !== SETTINGS_SOURCE_PERSISTED || data[7] !== u7(expectedRequestId)) return null

  const flags = data[8]
  return {
    valid: Boolean(flags & 1),
    dirty: Boolean(flags & 2),
    dirtyGeneration: decodeU35(data.slice(9, 14)),
    persistedGeneration: decodeU35(data.slice(14, 19)),
    values: data.slice(19, 46)
  }
}

export function settingsVectorFromCommands(commands) {
  const bpm = Math.max(0, Math.min(16383, Math.round(Number(commands.plantBpm.value) || 0)))
  const values = [bpm & 0x7f, (bpm >> 7) & 0x7f]
  for (const name of FIELD_NAMES) values.push(u7(commands[name].value))
  return values
}

export function applySettingsVector(commands, values) {
  if (!Array.isArray(values) || values.length !== SETTINGS_VECTOR_LENGTH) {
    throw new Error('Unsupported Biotron settings response.')
  }
  commands.plantBpm.set_value(values[0] | (values[1] << 7))
  FIELD_NAMES.forEach((name, index) => commands[name].set_value(values[index + 2]))
}

export function settingsVectorsEqual(left, right) {
  return Array.isArray(left) && Array.isArray(right) &&
    left.length === SETTINGS_VECTOR_LENGTH && right.length === SETTINGS_VECTOR_LENGTH &&
    left.every((value, index) => value === right[index])
}

export function savedSettingsMessage(lastChangedSetting) {
  if (lastChangedSetting === "noteOffPercent") {
    return "Saved on Biotron. Note Hold changes note length, not the LEDs."
  }
  if (lastChangedSetting === "reduceExtraNotes") {
    return "Calmer play is saved. Extra randomness and idle variation are off, and tiny note changes are ignored."
  }
  return "Saved on Biotron."
}

export async function applyCalmerPlay(device, getCurrentDevice, commands) {
  for (const [name, value] of CALMER_PLAY_SETTINGS) commands[name].set_value(value)
  return withMidiWriteSession(device, getCurrentDevice, async output => {
    for (const [name] of CALMER_PLAY_SETTINGS) {
      commands[name].sendToMidi(output)
      await output.wait(80)
    }
  })
}

const diagnosticText = (value, fallback = "unknown") => String(value || "").trim() || fallback

export function buildBiotronDiagnosticPacket(state, environment = {}) {
  const navigatorRef = environment.navigator || globalThis.navigator || {}
  const locationRef = environment.location || globalThis.location || {}
  const matchMedia = environment.matchMedia || globalThis.matchMedia
  return {
    schema: "playtronica.biotron-diagnostics.v1",
    captured_at: (environment.now || (() => new Date().toISOString()))(),
    product: "biotron",
    web_tool: {
      build_id: diagnosticText(state.buildId),
      route: diagnosticText(state.route, "/biotron"),
      online: navigatorRef.onLine !== false,
      standalone: typeof matchMedia === "function" && Boolean(matchMedia("(display-mode: standalone)")?.matches),
    },
    environment: {
      user_agent: diagnosticText(navigatorRef.userAgent),
      web_midi_available: typeof navigatorRef.requestMIDIAccess === "function",
      secure_context: environment.isSecureContext !== false,
      origin: diagnosticText(locationRef.origin),
    },
    device: {
      connected: Boolean(state.device),
      midi_port_name: state.device ? diagnosticText(state.device.name) : null,
      firmware_semantic_version: state.firmwareVersion || null,
    },
    workflow: {
      settings_state: diagnosticText(state.settingsState, "idle"),
      calibration_state: diagnosticText(state.calibrationState, "idle"),
      sound_running: Boolean(state.soundRunning),
    },
  }
}

export async function copyBiotronDiagnostic(page, buildId, environment = {}) {
  const navigatorRef = environment.navigator || globalThis.navigator || {}
  const packet = buildBiotronDiagnosticPacket({
    buildId, route: page.$route.path, device: page.device, firmwareVersion: page.firmwareVersion,
    settingsState: page.settingsState, calibrationState: page.calibrationState,
    soundRunning: page.soundSession.running,
  }, environment)
  try {
    await navigatorRef.clipboard.writeText(JSON.stringify(packet, null, 2))
    return "Copied — paste it into your email or WhatsApp message."
  } catch {
    return "Copy was blocked by the browser. Send the build number shown at the top instead."
  }
}

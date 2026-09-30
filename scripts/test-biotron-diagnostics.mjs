import assert from "node:assert/strict"
import {buildBiotronDiagnosticPacket} from "../src/biotron/settingsReadback.mjs"

const packet = buildBiotronDiagnosticPacket({
  buildId: "abc123def456",
  route: "/biotron",
  device: {id: "private-port-id", name: "Biotron MIDI"},
  firmwareVersion: "1.9.8",
  settingsState: "saved",
  calibrationState: "ready",
  soundRunning: true,
}, {
  navigator: {
    onLine: true,
    userAgent: "Test Browser 1.0",
    requestMIDIAccess() {},
  },
  location: {origin: "https://beta.example"},
  matchMedia: () => ({matches: true}),
  isSecureContext: true,
  now: () => "2026-09-30T20:00:00.000Z",
})

assert.equal(packet.schema, "playtronica.biotron-diagnostics.v1")
assert.equal(packet.web_tool.build_id, "abc123def456")
assert.equal(packet.environment.web_midi_available, true)
assert.equal(packet.device.midi_port_name, "Biotron MIDI")
assert.equal(packet.device.firmware_semantic_version, "1.9.8")
assert.equal(packet.workflow.settings_state, "saved")
assert.equal(packet.workflow.calibration_state, "ready")
assert.equal(packet.workflow.sound_running, true)
assert(!JSON.stringify(packet).includes("private-port-id"),
  "opaque browser MIDI IDs must not enter a support packet")

console.log("Biotron diagnostics contract: PASS")

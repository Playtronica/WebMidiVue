import assert from "node:assert/strict"
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {resolve} from "node:path"
import test from "node:test"
import {createReleaseEvidence} from "./build-biotron-candidate.mjs"

test("release evidence is complete, sorted and bound to the exact commit", () => {
  const dist = mkdtempSync(resolve(tmpdir(), "biotron-candidate-"))
  try {
    mkdirSync(resolve(dist, "js"))
    writeFileSync(resolve(dist, "index.html"), "beta")
    writeFileSync(resolve(dist, "js/app.js"), "build abc123")
    writeFileSync(resolve(dist, "release-evidence.json"), "old manifest")
    const manifest = createReleaseEvidence(dist, {
      commit: "abc123def4567890",
      branch: "candidate",
      builtAt: "2026-09-30T23:00:00Z",
    })
    assert.equal(manifest.build_id, "abc123def456")
    assert.equal(manifest.firmware_update_enabled, false)
    assert.deepEqual(manifest.files.map(file => file.path), ["index.html", "js/app.js"])
    assert(manifest.files.every(file => file.sha256.length === 64))
  } finally {
    rmSync(dist, {recursive: true, force: true})
  }
})

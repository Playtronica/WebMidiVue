import assert from "node:assert/strict"
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {resolve} from "node:path"
import test from "node:test"
import {
  createReleaseEvidence,
  normalizeGeneratedSourceMaps,
} from "./build-biotron-candidate.mjs"

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

test("generated service-worker source map is reproducible across build paths", () => {
  const first = mkdtempSync(resolve(tmpdir(), "biotron-map-a-"))
  const second = mkdtempSync(resolve(tmpdir(), "biotron-map-b-"))
  try {
    const sourceMap = temporary => JSON.stringify({
      version: 3,
      file: "service-worker.js",
      sources: [`../../private/tmp/${temporary}/service-worker.js`],
      sourcesContent: ["self.skipWaiting()"],
      names: [],
      mappings: "AAAA",
    })
    writeFileSync(resolve(first, "service-worker.js.map"), sourceMap("random-a"))
    writeFileSync(resolve(second, "service-worker.js.map"), sourceMap("random-b"))

    assert.deepEqual(normalizeGeneratedSourceMaps(first), ["service-worker.js"])
    assert.deepEqual(normalizeGeneratedSourceMaps(second), ["service-worker.js"])
    assert.equal(
      readFileSync(resolve(first, "service-worker.js.map"), "utf8"),
      readFileSync(resolve(second, "service-worker.js.map"), "utf8"),
    )
  } finally {
    rmSync(first, {recursive: true, force: true})
    rmSync(second, {recursive: true, force: true})
  }
})

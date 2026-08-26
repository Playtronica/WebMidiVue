const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const localRoot = path.join(root, 'artifacts', 'beta-download')
const sourceManifest = JSON.parse(fs.readFileSync(path.join(root, 'beta-download', 'manifest.json'), 'utf8'))

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function assertManifest(manifest) {
  assert.strictEqual(manifest.application, 'playtronica-biotron-settings')
  assert.strictEqual(manifest.channel, 'customer-beta')
  assert.strictEqual(manifest.files.length, 2)
  for (const file of manifest.files) {
    assert(!file.path.includes('?'), `${file.path}: expiring/query URL is forbidden`)
    assert(/^[a-f0-9]{64}$/.test(file.sha256), `${file.path}: invalid SHA-256`)
    assert(file.bytes > 0, `${file.path}: invalid byte length`)
  }
}

async function verifyLocal() {
  assertManifest(sourceManifest)
  const html = fs.readFileSync(path.join(root, 'beta-download', 'index.html'), 'utf8')
  assert(html.includes(sourceManifest.files[0].sha256), 'download page does not show executable SHA')
  assert(html.includes('never as administrator'), 'download page lacks non-admin boundary')
  assert(html.includes('Rapid MIDI CC'), 'download page lacks rapid-CC boundary')
  if (!fs.existsSync(localRoot)) return
  const manifest = JSON.parse(fs.readFileSync(path.join(localRoot, 'manifest.json'), 'utf8'))
  assert.deepStrictEqual(manifest, sourceManifest)
  for (const file of manifest.files) {
    const bytes = fs.readFileSync(path.join(localRoot, file.path))
    assert.strictEqual(bytes.length, file.bytes, `${file.path}: local byte length mismatch`)
    assert.strictEqual(digest(bytes), file.sha256, `${file.path}: local SHA mismatch`)
  }
}

async function verifyLive(base) {
  const origin = new URL(base)
  assert.strictEqual(origin.search, '', 'beta base URL must not have a query')
  const manifestResponse = await fetch(new URL('manifest.json', origin), {redirect: 'error'})
  assert.strictEqual(manifestResponse.status, 200, 'live manifest is unavailable')
  assert((manifestResponse.headers.get('content-type') || '').includes('application/json'))
  const manifest = await manifestResponse.json()
  assert.deepStrictEqual(manifest, sourceManifest)
  for (const file of manifest.files) {
    const url = new URL(file.path, origin)
    assert.strictEqual(url.search, '', `${file.path}: live URL has a query`)
    const response = await fetch(url, {redirect: 'error', cache: 'no-store'})
    assert.strictEqual(response.status, 200, `${file.path}: live HTTP status`)
    const cacheControl = response.headers.get('cache-control') || ''
    assert(cacheControl.includes('immutable'), `${file.path}: immutable cache policy is missing`)
    assert(!cacheControl.includes('no-store'), `${file.path}: contradictory no-store cache policy`)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.strictEqual(bytes.length, file.bytes, `${file.path}: live byte length mismatch`)
    assert.strictEqual(digest(bytes), file.sha256, `${file.path}: live SHA mismatch`)
  }
}

;(async () => {
  await verifyLocal()
  if (process.env.BIOTRON_BETA_BASE_URL) await verifyLive(process.env.BIOTRON_BETA_BASE_URL)
  console.log(`Beta download contract verified${process.env.BIOTRON_BETA_BASE_URL ? ' locally and live' : ' at source/local bundle'}.`)
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const source = path.join(root, 'beta-download')
const output = path.join(root, 'artifacts', 'beta-download')
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'))

const inputs = new Map([
  ['downloads/Biotron-Settings-Offline-Windows-x64.exe', process.env.BIOTRON_EXE_SOURCE],
  ['downloads/00-BIOTRON-20MIN.mid', process.env.BIOTRON_MIDI_SOURCE]
])

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function copyStatic() {
  fs.mkdirSync(output, {recursive: true})
  for (const name of ['index.html', 'manifest.json', '_headers', 'robots.txt']) {
    fs.copyFileSync(path.join(source, name), path.join(output, name))
  }
}

copyStatic()
for (const file of manifest.files) {
  const input = inputs.get(file.path)
  assert(input, `missing source environment variable for ${file.path}`)
  const bytes = fs.readFileSync(input)
  assert.strictEqual(bytes.length, file.bytes, `${file.path}: unexpected byte length`)
  assert.strictEqual(digest(bytes), file.sha256, `${file.path}: unexpected SHA-256`)
  const destination = path.join(output, file.path)
  fs.mkdirSync(path.dirname(destination), {recursive: true})
  fs.writeFileSync(destination, bytes)
}

console.log(`Beta download bundle verified and built at ${path.relative(root, output)}`)

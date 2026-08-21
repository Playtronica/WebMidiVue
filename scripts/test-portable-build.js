const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const {spawnSync} = require('child_process')

const root = path.resolve(__dirname, '..')
const artifact = path.join(root, 'artifacts', 'portable', 'Biotron-Settings-Offline-Windows-x64.exe')

function run(command, args) {
  const result = spawnSync(command, args, {cwd: root, stdio: 'inherit'})
  if (result.error) throw result.error
  assert.strictEqual(result.status, 0, `${command} ${args.join(' ')} failed`)
}

function digest() {
  const binary = fs.readFileSync(artifact)
  return crypto.createHash('sha256').update(binary).digest('hex')
}

function build() {
  run('npm', ['run', 'build'])
  run(process.execPath, ['scripts/build-portable.js'])
  return digest()
}

const first = build()
const second = build()
assert.strictEqual(second, first, 'two clean production builds produced different portable executables')
console.log(`Portable reproducibility verified: two clean builds → SHA-256 ${first}`)

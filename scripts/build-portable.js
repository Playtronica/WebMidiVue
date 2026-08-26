const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')
const {spawnSync} = require('child_process')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const portable = path.join(root, 'portable')
const artifacts = path.join(root, 'artifacts', 'portable')
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'biotron-portable-'))
const goEnvironment = {...process.env, GOCACHE: path.join(staging, 'go-build-cache')}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {stdio: 'inherit', ...options})
  if (result.error) throw result.error
  assert.strictEqual(result.status, 0, `${command} ${args.join(' ')} failed`)
}

function copyDirectory(source, destination, shouldCopy = () => true) {
  fs.mkdirSync(destination, {recursive: true})
  const entries = fs.readdirSync(source, {withFileTypes: true})
    .sort((left, right) => left.name.localeCompare(right.name))
  for (const entry of entries) {
    const from = path.join(source, entry.name)
    const to = path.join(destination, entry.name)
    if (entry.isDirectory()) copyDirectory(from, to, shouldCopy)
    else if (shouldCopy(from)) fs.copyFileSync(from, to)
  }
}

try {
  assert(fs.existsSync(path.join(dist, 'index.html')), 'run npm run build before building the portable artifact')
  run('go', ['test', './...'], {cwd: portable, env: goEnvironment})

  copyDirectory(portable, staging)
  const embeddedWeb = path.join(staging, 'cmd', 'biotron-offline', 'web')
  fs.rmSync(embeddedWeb, {recursive: true, force: true})
  // Source maps contain build-machine paths and webpack's service-worker map
  // changes between otherwise identical production builds. They are not used
  // by the offline runtime, so excluding them makes the customer artifact
  // reproducible and avoids shipping local build metadata.
  copyDirectory(dist, embeddedWeb, source => !source.endsWith('.map'))

  fs.mkdirSync(artifacts, {recursive: true})
  const output = path.join(artifacts, 'Biotron-Settings-Offline-Windows-x64.exe')
  const gitVersion = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], {cwd: root, encoding: 'utf8'})
  assert.strictEqual(gitVersion.status, 0, 'could not resolve build version')
  const version = (process.env.BIOTRON_BUILD_VERSION || gitVersion.stdout.trim()).replace(/[^A-Za-z0-9._-]/g, '-')
  run('go', [
    'build', '-trimpath',
    '-ldflags', `-s -w -H=windowsgui -X main.buildVersion=${version}`,
    '-o', output,
    './cmd/biotron-offline'
  ], {
    cwd: staging,
    env: {...goEnvironment, GOOS: 'windows', GOARCH: 'amd64', CGO_ENABLED: '0'}
  })

  const binary = fs.readFileSync(output)
  assert(binary.length > 1_000_000, 'portable executable is unexpectedly small')
  assert.strictEqual(binary.subarray(0, 2).toString('ascii'), 'MZ', 'portable output is not a Windows PE executable')
  const digest = crypto.createHash('sha256').update(binary).digest('hex')
  fs.writeFileSync(`${output}.sha256`, `${digest}  ${path.basename(output)}\n`)
  console.log(`Portable Windows beta built: ${path.relative(root, output)} (${binary.length} bytes)`)
  console.log(`SHA-256 ${digest}`)
} finally {
  fs.rmSync(staging, {recursive: true, force: true})
}

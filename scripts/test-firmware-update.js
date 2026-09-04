const assert = require('assert')
const babel = require('@babel/core')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const source = fs.readFileSync('src/assets/js/LoadFirmware.js', 'utf8')
const compiled = babel.transformSync(source, {
  filename: 'src/assets/js/LoadFirmware.js',
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
}).code

const digest = 'a'.repeat(64)
const trustedAsset = {
  name: 'biotron-firmware_1.8.2.uf2',
  browser_download_url: 'https://github.com/Playtronica/biotron-firmware/releases/download/1.8.2/biotron-firmware_1.8.2.uf2',
  digest: `sha256:${digest}`,
  size: 1024
}

async function runLegacy({online, response}) {
  const events = []
  const context = {
    exports: {},
    module: {exports: {}},
    navigator: {onLine: online},
    fetch: async () => response,
    window: {location: {assign: url => events.push(['download', url])}},
    require: name => {
      assert.strictEqual(name, '@/assets/js/SysExCommand')
      return {bootDevice: async device => {
        events.push(['boot-start', device])
        await Promise.resolve()
        events.push(['boot-done', device])
      }}
    }
  }
  context.exports = context.module.exports
  vm.runInNewContext(compiled, context)
  let error
  try {
    await context.module.exports.LoadFirmware('Playtronica/biotron-firmware', 'device')
  } catch (caught) {
    error = caught
  }
  return {events, error}
}

const arrayBuffer = buffer => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

;(async () => {
  const {compareFirmwareVersions} = contextForHelpers()
  assert.strictEqual(compareFirmwareVersions('1.9.8', '1.8.2'), 1)
  assert.strictEqual(compareFirmwareVersions('v1.8.2', '1.8.2'), 0)
  assert.strictEqual(compareFirmwareVersions('1.8.2', '1.9.8'), -1)

  const betaEnvironment = fs.readFileSync('.env.biotron-beta', 'utf8')
  assert.match(betaEnvironment, /^VUE_APP_BIOTRON_FIRMWARE_TARGET=1\.9\.8$/m)
  assert.match(betaEnvironment, /^VUE_APP_BIOTRON_FIRMWARE_SHA256=38c7fd35ef5e456d86b03f50f380d499519835fa84b7516fbd7b1cd1012b91da$/m)
  assert.match(betaEnvironment, /^VUE_APP_BIOTRON_FIRMWARE_SIZE=110592$/m)
  const updateComponent = fs.readFileSync('src/components/MidiComponents/UpdateFirmwareComponent.vue', 'utf8')
  assert.match(updateComponent, /Downloading and checking firmware/)
  assert.match(updateComponent, /💾 Choose RPI-RP2 → install/)
  assert.match(updateComponent, /@click="\$emit\('check_firmware'\)"/)
  // F2 (2026-09-04): the folder picker opens in Documents; the drive must be named before and during the step.
  assert.match(updateComponent, /💾 Choose drive RPI-RP2 → Select\. 🍎 Mac: left sidebar · 🪟 Windows: This PC\./)
  assert.match(updateComponent, /<p v-if="internal && ready" class="small text-muted">\{\{ pick \}\} 🍎 Tip: ⌘⇧G → \/Volumes\/RPI-RP2<\/p>/)
  // F3 (2026-09-04): page reloaded while Biotron sits in update mode — no MIDI, only the RPI-RP2 drive.
  assert.match(updateComponent, /💾 Biotron shows as RPI-RP2\?/)
  assert.match(updateComponent, /<p v-if="recovery">🔌 No Biotron over MIDI\. 💾 Drive <strong>RPI-RP2<\/strong> on your computer\?/)
  assert.doesNotMatch(updateComponent, /public updater is intentionally disabled/i)
  await testComponentStateMachine(updateComponent)

  let result = await runLegacy({online: false})
  assert.match(result.error.message, /internet connection/)
  assert.deepStrictEqual(result.events, [])

  result = await runLegacy({online: true, response: {ok: false, status: 503}})
  assert.match(result.error.message, /503/)
  assert.deepStrictEqual(result.events, [])

  result = await runLegacy({online: true, response: {ok: true, json: async () => ({assets: []})}})
  assert.match(result.error.message, /exactly one verified/)
  assert.deepStrictEqual(result.events, [])

  result = await runLegacy({
    online: true,
    response: {ok: true, json: async () => ({assets: [{...trustedAsset, digest: null}]})}
  })
  assert.match(result.error.message, /no trusted SHA-256/)
  assert.deepStrictEqual(result.events, [])

  result = await runLegacy({
    online: true,
    response: {ok: true, json: async () => ({assets: [trustedAsset]})}
  })
  assert.ifError(result.error)
  assert.deepStrictEqual(result.events, [
    ['boot-start', 'device'],
    ['boot-done', 'device'],
    ['download', trustedAsset.browser_download_url]
  ])

  const updater = contextForHelpers()
  const firmwarePath = path.resolve('beta-assets/firmware/biotron-1.9.8-beta08-organic-led.uf2')
  const firmwareBytes = fs.readFileSync(firmwarePath)
  const firmware = {
    version: '1.9.8',
    name: path.basename(firmwarePath),
    url: '/firmware/biotron-1.9.8-beta08-organic-led.uf2',
    sha256: crypto.createHash('sha256').update(firmwareBytes).digest('hex'),
    size: firmwareBytes.length
  }
  assert.strictEqual(firmware.sha256, '38c7fd35ef5e456d86b03f50f380d499519835fa84b7516fbd7b1cd1012b91da')
  const uf2 = updater.inspectBiotronUf2(arrayBuffer(firmwareBytes))
  assert.strictEqual(uf2.blocks, 216)
  assert.strictEqual(uf2.familyId, 0xe48bff56)
  assert.strictEqual(uf2.payloadBytes, 55296)

  const fetchFirmware = async () => ({ok: true, arrayBuffer: async () => arrayBuffer(firmwareBytes)})
  const fetched = await updater.prepareFirmware(firmware, fetchFirmware, crypto.webcrypto)
  assert.strictEqual(fetched.sha256, firmware.sha256)

  const wrongHash = {...firmware, sha256: '0'.repeat(64)}
  await assert.rejects(() => updater.prepareFirmware(wrongHash, fetchFirmware, crypto.webcrypto), /checksum does not match/)

  const unsafeBytes = Buffer.from(firmwareBytes)
  unsafeBytes.writeUInt32LE(0x10080000, 12)
  assert.throws(() => updater.inspectBiotronUf2(arrayBuffer(unsafeBytes)), /outside the safe Biotron program area/)

  const writes = []
  const writable = {
    write: async bytes => writes.push(Buffer.from(bytes)),
    close: async () => writes.push('closed'),
    abort: async () => writes.push('aborted')
  }
  const directory = {
    name: 'RPI-RP2',
    getFileHandle: async (name, options) => {
      assert.strictEqual(name, firmware.name)
      assert.strictEqual(options.create, true)
      return {createWritable: async options => {
        assert.strictEqual(options.keepExistingData, false)
        return writable
      }}
    }
  }
  const written = await updater.writeFirmware(fetched, firmware, async () => directory)
  assert.strictEqual(written.directory, 'RPI-RP2')
  assert.strictEqual(written.filename, firmware.name)
  assert.strictEqual(written.bytes, firmware.size)
  assert.strictEqual(writes[0].length, firmware.size)
  assert.strictEqual(writes[1], 'closed')

  await assert.rejects(() => updater.writeFirmware(fetched, firmware, async () => ({name: 'Downloads'})), /Select the RPI-RP2 drive/)

  await assert.rejects(() => updater.writeFirmware(fetched, firmware, null), /current Chrome or Edge/)

  console.log('Firmware update verified: exact beta UF2 is hash/size/structure checked before BOOT; only RPI-RP2 receives bytes; failures stay fail-closed.')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

function contextForHelpers() {
  const helperContext = {
    exports: {},
    module: {exports: {}},
    navigator: {onLine: true},
    require: () => ({bootDevice: async () => {}})
  }
  helperContext.exports = helperContext.module.exports
  vm.runInNewContext(compiled, helperContext)
  return helperContext.module.exports
}

async function testComponentStateMachine(componentSource) {
  const script = componentSource.match(/<script>([\s\S]*?)<\/script>/)[1]
  const compiledComponent = babel.transformSync(script, {
    filename: 'src/components/MidiComponents/UpdateFirmwareComponent.vue',
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs']
  }).code
  const calls = []
  let writeFailure = null
  const prepared = {buffer: new ArrayBuffer(512), sha256: '38c7fd35ef5e456d86b03f50f380d499519835fa84b7516fbd7b1cd1012b91da'}
  const context = {
    exports: {},
    module: {exports: {}},
    navigator: {onLine: true},
    process: {env: {
      VUE_APP_BIOTRON_FIRMWARE_TARGET: '1.9.8',
      VUE_APP_BIOTRON_FIRMWARE_NAME: 'biotron-1.9.8-beta08-organic-led.uf2',
      VUE_APP_BIOTRON_FIRMWARE_URL: '/firmware/biotron-1.9.8-beta08-organic-led.uf2',
      VUE_APP_BIOTRON_FIRMWARE_SHA256: prepared.sha256,
      VUE_APP_BIOTRON_FIRMWARE_SIZE: '110592'
    }},
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
      showDirectoryPicker: async () => ({name: 'RPI-RP2'})
    },
    setTimeout: fn => {
      calls.push(['timer', fn])
      return calls.length
    },
    clearTimeout: id => calls.push(['clear', id]),
    require: name => {
      if (name === '@/assets/js/LoadFirmware') {
        return {
          compareFirmwareVersions: () => 1,
          GetLatestFirmware: async () => {},
          LoadFirmware: async () => {},
          prepareFirmware: async firmware => {
            calls.push(['prepare', firmware.version])
            return prepared
          },
          writeFirmware: async (value, firmware) => {
            calls.push(['write', value, firmware.version])
            if (writeFailure) throw writeFailure
          }
        }
      }
      if (name === '@/assets/js/SysExCommand') {
        return {bootDevice: async device => calls.push(['boot', device])}
      }
      throw new Error(`Unexpected import: ${name}`)
    }
  }
  context.exports = context.module.exports
  vm.runInNewContext(compiledComponent, context)
  const definition = context.module.exports.default
  const build = props => {
    const instance = {...definition.data(), repo: 'Playtronica/biotron-firmware', versionAware: true, ...props}
    for (const [name, method] of Object.entries(definition.methods)) instance[name] = method.bind(instance)
    for (const [name, computed] of Object.entries(definition.computed)) {
      Object.defineProperty(instance, name, {get: computed.bind(instance)})
    }
    return instance
  }
  const drive = /💾 Choose drive RPI-RP2 → Select\. 🍎 Mac: left sidebar · 🪟 Windows: This PC\./

  // Normal path: Biotron answers over MIDI with 1.9.7 — verify, restart, choose drive, write, reconnect.
  const instance = build({device: 'selected-midi-output', currentVersion: '1.9.7'})
  assert.strictEqual(instance.buttonText, 'Update to 1.9.8')
  await instance.runStep()
  assert.strictEqual(instance.phase, 'prepared')
  assert.deepStrictEqual(calls[0], ['prepare', '1.9.8'])
  await instance.runStep()
  assert.strictEqual(instance.phase, 'select-drive')
  assert.deepStrictEqual(calls[1], ['boot', 'selected-midi-output'])
  assert.match(instance.message, drive)
  await instance.runStep()
  assert.strictEqual(instance.phase, 'reconnecting')
  assert.strictEqual(calls[2][0], 'write')
  definition.watch.currentVersion.call(instance, '1.9.8')
  assert.strictEqual(instance.phase, 'complete')
  assert.strictEqual(instance.prepared, null)
  assert.match(instance.message, /installed and verified/)

  // F3: page opened while Biotron is already in update mode — no MIDI device, no version, drive RPI-RP2 present.
  calls.length = 0
  const lost = build({device: null, currentVersion: ''})
  assert.strictEqual(lost.buttonText, '💾 Biotron shows as RPI-RP2?')
  assert.strictEqual(lost.recovery, true)
  assert.strictEqual(lost.ready, true)
  assert.strictEqual(lost.actionDisabled, false)
  assert.strictEqual(lost.actionText, '⬇️ Download & check')
  await lost.runStep()
  assert.strictEqual(lost.phase, 'select-drive')
  assert.match(lost.message, drive)
  assert.deepStrictEqual(calls.map(call => call[0]), ['prepare'])
  assert.strictEqual(lost.actionText, '💾 Choose RPI-RP2 → install')
  await lost.runStep()
  assert.strictEqual(lost.phase, 'reconnecting')
  assert.deepStrictEqual(calls.map(call => call[0]), ['prepare', 'write', 'timer'])
  definition.watch.currentVersion.call(lost, '1.9.8')
  assert.strictEqual(lost.phase, 'complete')

  // Device visible but version unknown: the button asks the parent to check firmware, the modal path is not taken.
  const silent = build({device: 'selected-midi-output', currentVersion: ''})
  assert.strictEqual(silent.buttonText, 'Check firmware')
  assert.strictEqual(silent.recovery, true)

  // F2: cancelled picker and a wrong folder both return to the drive step with the sidebar hint; nothing is lost.
  calls.length = 0
  writeFailure = Object.assign(new Error('cancelled'), {name: 'AbortError'})
  const retry = build({device: null, currentVersion: ''})
  await retry.runStep()
  await retry.runStep()
  assert.strictEqual(retry.phase, 'select-drive')
  assert.strictEqual(retry.error, '')
  assert.match(retry.message, /^❌ No drive chosen\. 💾 Choose drive RPI-RP2/)
  writeFailure = new Error('Select the RPI-RP2 drive. No file was written.')
  await retry.runStep()
  assert.strictEqual(retry.phase, 'select-drive')
  assert.strictEqual(retry.error, 'Select the RPI-RP2 drive. No file was written.')
  assert.strictEqual(retry.actionDisabled, false)
  writeFailure = null
  await retry.runStep()
  assert.strictEqual(retry.phase, 'reconnecting')
  assert.deepStrictEqual(calls.map(call => call[0]), ['prepare', 'write', 'write', 'write', 'timer'])

  // Device lost between verify and restart: restart needs MIDI, the action waits instead of guessing.
  const dropped = build({device: 'selected-midi-output', currentVersion: '1.9.7'})
  await dropped.runStep()
  assert.strictEqual(dropped.phase, 'prepared')
  dropped.device = null
  assert.strictEqual(dropped.actionDisabled, true)
}

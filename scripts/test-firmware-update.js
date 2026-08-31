const assert = require('assert')
const babel = require('@babel/core')
const fs = require('fs')
const vm = require('vm')

const source = fs.readFileSync('src/assets/js/LoadFirmware.js', 'utf8')
const compiled = babel.transformSync(source, {
  filename: 'src/assets/js/LoadFirmware.js',
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
}).code

async function run({ online, response }) {
  const events = []
  const context = {
    exports: {},
    module: { exports: {} },
    navigator: { onLine: online },
    fetch: async () => response,
    window: { location: { assign: url => events.push(['download', url]) } },
    require: name => {
      assert.strictEqual(name, '@/assets/js/SysExCommand')
      return { bootDevice: async device => {
        events.push(['boot-start', device])
        await Promise.resolve()
        events.push(['boot-done', device])
      } }
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
  return { events, error }
}

;(async () => {
  const {compareFirmwareVersions} = contextForHelpers()
  assert.strictEqual(compareFirmwareVersions('1.9.3', '1.8.2'), 1)
  assert.strictEqual(compareFirmwareVersions('v1.8.2', '1.8.2'), 0)
  assert.strictEqual(compareFirmwareVersions('1.8.2', '1.9.3'), -1)

  let result = await run({ online: false })
  assert.match(result.error.message, /internet connection/)
  assert.deepStrictEqual(result.events, [])

  result = await run({ online: true, response: { ok: false, status: 503 } })
  assert.match(result.error.message, /503/)
  assert.deepStrictEqual(result.events, [])

  result = await run({ online: true, response: { ok: true, json: async () => ({ assets: [] }) } })
  assert.match(result.error.message, /exactly one verified/)
  assert.deepStrictEqual(result.events, [])

  result = await run({
    online: true,
    response: { ok: true, json: async () => ({ assets: [
      { name: 'readme.txt', browser_download_url: 'https://github.com/Playtronica/biotron-firmware/releases/download/1.8.2/readme.txt' },
      { name: 'firmware.uf2', browser_download_url: 'https://evil.example/firmware.uf2' }
    ] }) }
  })
  assert.match(result.error.message, /exactly one verified/)
  assert.deepStrictEqual(result.events, [])

  result = await run({
    online: true,
    response: { ok: true, json: async () => ({ assets: [
      { name: 'release-notes.txt', browser_download_url: 'https://github.com/Playtronica/biotron-firmware/releases/download/1.8.2/release-notes.txt' },
      { name: 'biotron-firmware_1.8.2.uf2', browser_download_url: 'https://github.com/Playtronica/biotron-firmware/releases/download/1.8.2/biotron-firmware_1.8.2.uf2' }
    ] }) }
  })
  assert.ifError(result.error)
  assert.deepStrictEqual(result.events, [
    ['boot-start', 'device'],
    ['boot-done', 'device'],
    ['download', 'https://github.com/Playtronica/biotron-firmware/releases/download/1.8.2/biotron-firmware_1.8.2.uf2']
  ])

  console.log('Firmware update verified: offline/API/missing/untrusted failures stay out of BOOT; one repository-scoped UF2 boots before download.')
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

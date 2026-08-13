const assert = require('assert')
const babel = require('@babel/core')
const fs = require('fs')
const vm = require('vm')

const source = fs.readFileSync('src/assets/js/LoadFirmware.js', 'utf8')
const compiled = babel.transformSync(source, {
  filename: 'src/assets/js/LoadFirmware.js',
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
      return { bootDevice: device => events.push(['boot', device]) }
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
  let result = await run({ online: false })
  assert.match(result.error.message, /internet connection/)
  assert.deepStrictEqual(result.events, [])

  result = await run({ online: true, response: { ok: false, status: 503 } })
  assert.match(result.error.message, /503/)
  assert.deepStrictEqual(result.events, [])

  result = await run({ online: true, response: { ok: true, json: async () => ({ assets: [] }) } })
  assert.match(result.error.message, /does not contain/)
  assert.deepStrictEqual(result.events, [])

  result = await run({
    online: true,
    response: { ok: true, json: async () => ({ assets: [{ browser_download_url: 'https://example.test/firmware.uf2' }] }) }
  })
  assert.ifError(result.error)
  assert.deepStrictEqual(result.events, [
    ['boot', 'device'],
    ['download', 'https://example.test/firmware.uf2']
  ])

  console.log('Firmware update verified: 3 failure paths stay out of BOOT; success boots before download.')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

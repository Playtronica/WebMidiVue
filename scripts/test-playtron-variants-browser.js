const assert = require('node:assert/strict')
const path = require('node:path')
const {chromium} = require('playwright-core')
const {chromePath, createStaticServer} = require('./browser-test-harness')

const root = process.env.PLAYTRON_DIST_ROOT || path.resolve(__dirname, '..', 'dist')
const server = createStaticServer(root)

;(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch({executablePath: chromePath(), headless: true})
  try {
    const context = await browser.newContext()
    context.setDefaultTimeout(5000)
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'requestMIDIAccess', {configurable: true, value: async () => ({
        inputs: new Map(), outputs: new Map(), addEventListener() {}, removeEventListener() {}
      })})
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const [route, chords] of [['/playtron', false], ['/playtron/test', true]]) {
      await page.goto(`${origin}/#${route}`, {waitUntil: 'networkidle'})
      await page.getByRole('heading', {name: 'Playtron Settings ⚙️'}).waitFor()
      await page.getByRole('button', {name: '💾 Save Preset'}).waitFor()
      assert.equal(await page.getByText('🎼 Chords Mode', {exact: true}).count(), chords ? 1 : 0,
        `${route} Chords visibility changed`)
      assert.equal(await page.evaluate(() => localStorage.getItem('PlaytronWebMidiId')), '1',
        `${route} changed its preset namespace`)
    }
    await page.evaluate(() => { location.hash = '#/playtron' })
    await page.getByText('🎼 Chords Mode', {exact: true}).waitFor({state: 'detached'})
    await page.evaluate(() => { location.hash = '#/playtron/test' })
    await page.getByText('🎼 Chords Mode', {exact: true}).waitFor()
    assert.deepEqual(errors, [])
    await context.close()
    console.log('Playtron browser variants verified: both routes, Chords visibility and shared preset namespace.')
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
})().catch(error => { console.error(error); process.exitCode = 1 })

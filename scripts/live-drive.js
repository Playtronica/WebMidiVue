// Drives the live beta over CDP: clicks, waits for stages, dumps the trace. Andrey only touches the plant.
const {chromium} = require('playwright-core'); const {execFileSync} = require('child_process')
const TARGET = process.argv[2], STEP = process.argv[3] || 'hear'
// The first-play route. Given #/biotron or #/biotron/play alike; the other steps strip /play themselves.
const PLAY = TARGET.replace(/\/play\/?$/, '') + '/play'
const CDP = process.env.CDP || 'http://127.0.0.1:9444'
const STEPS = STEP === 'all' ? ['hear', 'calibrate', 'beat', 'release'] : [STEP]
const PY = process.env.HOME + '/ProjectData/playtronica-firmware/tools/py310-midi/bin/python'
const BENCH = '/Users/andreymanirko/Projects/Claude/Playtronica Claude/projects/firmware-engineering/scripts/biotron_mac_bench.py'
const health = tag => { try { execFileSync(PY, [BENCH, 'health', '--version', '1.9.8', '--log', `/tmp/live-${tag}.json`], {stdio: 'ignore', cwd: '/Users/andreymanirko/Projects/Claude/Playtronica Claude/projects/firmware-engineering'}) ; const d = JSON.parse(require('fs').readFileSync(`/tmp/live-${tag}.json`)); const f = {}; d.observations.filter(o => o.kind === 'health_page').forEach(o => Object.assign(f, o.fields)); return {rejected: f.tx_rejected, malformed0: f.cable0_malformed, tx: f.tx_enqueued} } catch (e) { return {error: String(e).slice(0, 80)} } }
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
;(async () => {
  const browser = await chromium.connectOverCDP(CDP)
  const context = browser.contexts()[0]
  await context.grantPermissions(['midi', 'midi-sysex'], {origin: new URL(TARGET).origin})
  const page = context.pages()[0] || await context.newPage()
  const stage = () => page.locator('.sound-lab').getAttribute('data-reveal-stage')
  const status = () => page.locator('.sound-lab__status, [class*=status]').first().innerText().catch(() => '')
  const trace = async () => page.evaluate(() => (globalThis.__biotronTrace || []).slice(-40))
  log('connected to', browser.version())
  for (const STEP of STEPS) {
  log(`===== step ${STEP} =====`)
  if (STEP === 'hear') {
    // A hash-only change does not reload the document, so a tab already on the beta (or with sound running)
    // never returns to 'intro' and 'Hear Biotron' is not there. Reload: a fresh document starts at intro.
    await page.goto(PLAY); await page.reload(); await page.locator('.sound-lab[data-reveal-stage="intro"]').waitFor({timeout: 20000})
    log('page intro, build', await page.locator('footer, .build, [class*=build]').first().innerText().catch(() => '?'))
    await page.getByRole('button', {name: 'Hear Biotron'}).click(); log('CLICK Hear Biotron')
    const t0 = Date.now(); let last = ''
    for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); const s = await stage(); if (s !== last) { log(`stage → ${s} (+${((Date.now() - t0) / 1000).toFixed(1)}s) voices=${await page.locator('.sound-lab').getAttribute('data-active-voices')}`); last = s } if (s === 'revealed') break }
    log('final stage', await stage(), '| voices', await page.locator('.sound-lab').getAttribute('data-active-voices'))
  }
  if (STEP === 'calibrate') {
    await page.goto(TARGET.replace('/play', '')); await page.getByRole('button', {name: 'Calibrate plant again'}).waitFor({timeout: 20000})
    await page.getByRole('button', {name: 'Calibrate plant again'}).click(); log('CLICK Calibrate plant again')
    for (let i = 0; i < 40; i++) { await page.waitForTimeout(1000); const v = await page.locator('.sound-lab').getAttribute('data-active-voices').catch(() => 'n/a'); if (i % 5 === 0) log(`+${i}s voices=${v}`) }
  }
  if (STEP === 'beat') {
    await page.goto(TARGET.replace('/play', '')); await page.getByRole('button', {name: 'Check saved settings'}).waitFor({timeout: 20000})
    await page.waitForTimeout(3000)
    const slider = page.locator('input[type=range]').first(); const v0 = await slider.inputValue(); log('The Beat before', v0)
    await slider.fill(String(Number(v0) + 20)); await slider.dispatchEvent('input'); await slider.dispatchEvent('change'); log('SET The Beat', Number(v0) + 20)
    await page.waitForTimeout(4000); log('status', (await page.locator('body').innerText()).split('\n').filter(l => /Saved|saved|Changed|could not/i.test(l)).slice(0, 3).join(' | '))
    await slider.fill(v0); await slider.dispatchEvent('input'); await slider.dispatchEvent('change'); log('RESTORE The Beat', v0); await page.waitForTimeout(3000)
  }
  if (STEP === 'release') {
    await page.goto(TARGET.replace('/play', '')); await page.getByRole('button', {name: 'Release device for DAW'}).waitFor({timeout: 20000})
    await page.waitForTimeout(3000)
    const has = async re => (await page.locator('body').innerText()).match(re) !== null
    log('before release: firmware shown', await has(/Firmware 1\.9\.8/), '| settings loaded', await has(/Settings loaded/))
    await page.getByRole('button', {name: 'Release device for DAW'}).click(); log('CLICK Release device for DAW')
    await page.getByRole('button', {name: 'Reconnect settings'}).waitFor({timeout: 10000})
    log('released: caption', (await page.locator('body').innerText()).match(/[^\n]*free for Reaper[^\n]*/)?.[0]?.slice(0, 120))
    const ports = await page.evaluate(async () => { const a = await navigator.requestMIDIAccess({sysex: true}); return [...a.inputs.values()].map(i => i.name + ':' + i.connection) })
    log('input ports after release', JSON.stringify(ports))
    await page.getByRole('button', {name: 'Reconnect settings'}).click(); log('CLICK Reconnect settings')
    const t0 = Date.now(); let ok = false
    for (let i = 0; i < 15; i++) { await page.waitForTimeout(1000); if (await has(/Firmware 1\.9\.8/) && await has(/Settings loaded/)) { ok = true; break } }
    log(ok ? `reconnected: firmware + settings loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s` : 'RECONNECT INCOMPLETE: ' + (await page.locator('body').innerText()).split('\n').filter(l => /Firmware|settings|MIDI/i.test(l)).slice(0, 4).join(' | '))
  }
  }
  const tr = await trace(); log('trace tail:'); for (const e of tr.slice(-25)) console.log('   ', e.t, e.kind, JSON.stringify(e.data))
  await browser.close()
})().catch(e => { console.error('DRIVER ERROR', e.message); process.exitCode = 1 })

const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const {chromium} = require('playwright-core')

const root = path.resolve(__dirname, '..')
const mime = {'.js':'text/javascript','.mjs':'text/javascript'}

const chromePath = () => {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ].filter(Boolean)
  const executable = candidates.find(fs.existsSync)
  assert(executable, 'Chrome/Chromium not found; set CHROME_PATH')
  return executable
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname
  if (pathname === '/') {
    response.writeHead(200, {'Content-Type': 'text/html', 'Cache-Control': 'no-store'})
    response.end('<!doctype html><meta charset="utf-8"><title>Sound level test</title>')
    return
  }
  const file = path.resolve(root, pathname.slice(1))
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404)
    response.end()
    return
  }
  response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'})
  response.end(fs.readFileSync(file))
})

;(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = await chromium.launch({executablePath: chromePath(), headless: true})
  try {
    const page = await browser.newPage()
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    const metrics = await page.evaluate(async () => {
      const {SynthEngine} = await import('/src/audio/engine.mjs')
      const {SOUND_VARIANTS} = await import('/src/audio/presets.mjs')
      const render = async (name, preset, notes, velocity, quality, volume) => {
        const sampleRate = 48000
        const seconds = 3
        const context = new OfflineAudioContext(2, sampleRate * seconds, sampleRate)
        const engine = new SynthEngine(context, {preset, quality, volume})
        for (const note of notes) engine.noteOn('level-test', 0, note, velocity, 0.05)
        for (const note of notes) engine.noteOff('level-test', 0, note, 0.55)
        const rendered = await context.startRendering()
        const channel = rendered.getChannelData(0)
        let peak = 0
        let energy = 0
        let nonFinite = 0
        for (const sample of channel) {
          if (!Number.isFinite(sample)) nonFinite += 1
          peak = Math.max(peak, Math.abs(sample))
          energy += sample * sample
        }
        return {name, quality, peak, rms: Math.sqrt(energy / channel.length), nonFinite}
      }
      const qualities = ['standard', 'safe']
      const singleNotes = await Promise.all(qualities.flatMap(quality => SOUND_VARIANTS.map(preset =>
        render(preset.name, preset, [72], 100, quality))))
      const quietBiotronNotes = await Promise.all(qualities.flatMap(quality => SOUND_VARIANTS.map(preset =>
        render(`${preset.name} velocity 1`, preset, [72], 1, quality))))
      const denseChords = await Promise.all(qualities.flatMap(quality => SOUND_VARIANTS.map(preset =>
        render(`${preset.name} dense chord`, preset, [36, 40, 43, 47, 52, 55, 59, 64], 127, quality))))
      const maximumDenseChords = await Promise.all(qualities.flatMap(quality => SOUND_VARIANTS.map(preset =>
        render(`${preset.name} maximum-volume dense chord`, preset,
          [36, 40, 43, 47, 52, 55, 59, 64], 127, quality, 100))))
      const volumeSweep = await Promise.all([0, 50, 70, 100].map(volume =>
        render(`volume ${volume}`, SOUND_VARIANTS[0], [72], 100, 'standard', volume)))
      return {singleNotes, quietBiotronNotes, denseChords, maximumDenseChords, volumeSweep}
    })

    for (const metric of [
      ...metrics.singleNotes, ...metrics.quietBiotronNotes,
      ...metrics.denseChords, ...metrics.maximumDenseChords
    ]) {
      assert.strictEqual(metric.nonFinite, 0, `${metric.name} produced non-finite audio`)
      assert(metric.peak <= 0.98, `${metric.name} peak ${metric.peak} exceeds 0.98`)
    }
    assert(Math.min(...metrics.singleNotes.map(metric => metric.peak)) >= 0.65,
      `quietest single-note peak is ${Math.min(...metrics.singleNotes.map(metric => metric.peak))}`)
    assert(Math.min(...metrics.singleNotes.map(metric => metric.rms)) >= 0.06,
      `quietest single-note RMS is ${Math.min(...metrics.singleNotes.map(metric => metric.rms))}`)
    assert(Math.min(...metrics.quietBiotronNotes.map(metric => metric.peak)) >= 0.55,
      `velocity-1 Biotron note is too quiet: ${Math.min(...metrics.quietBiotronNotes.map(metric => metric.peak))}`)
    assert(Math.max(...metrics.denseChords.map(metric => metric.peak)) <= 0.975,
      `dense chord safety peak is ${Math.max(...metrics.denseChords.map(metric => metric.peak))}`)
    assert(Math.min(...metrics.denseChords.map(metric => metric.peak)) >= 0.35,
      `quietest dense chord peak is unexpectedly low: ${Math.min(...metrics.denseChords.map(metric => metric.peak))}`)
    assert(metrics.volumeSweep[0].peak < 0.001, `volume zero peak is ${metrics.volumeSweep[0].peak}`)
    assert(metrics.volumeSweep[3].rms > metrics.volumeSweep[1].rms,
      `maximum-volume RMS ${metrics.volumeSweep[3].rms} did not exceed 50% RMS ${metrics.volumeSweep[1].rms}`)
    assert(metrics.volumeSweep[3].peak <= 0.98,
      `maximum-volume peak ${metrics.volumeSweep[3].peak} exceeds 0.98`)
    assert(Math.max(...metrics.maximumDenseChords.map(metric => metric.peak)) <= 0.98,
      `maximum-volume dense chord peak is ${Math.max(...metrics.maximumDenseChords.map(metric => metric.peak))}`)
    console.log(`Sound levels verified: ${JSON.stringify(metrics)}`)
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

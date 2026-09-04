// Same measurements as test-sound-levels.js, driving the new Elementary
// engine (src/audio/elementary/*) instead of the legacy one. noteOn/noteOff/
// panic write straight to the engine's per-voice refs (no render() call —
// see engine.mjs), but a ref's setter still applies "at the nearest block"
// the same way render() did, so every scheduled action here still uses
// context.suspend()/resume() around it for sample-accurate timing — exactly
// the pattern test-sound-levels.js's fastStream() already uses for the
// legacy engine's AudioParam automation.
const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const {execFileSync} = require('child_process')
const {chromium} = require('playwright-core')

const root = path.resolve(__dirname, '..')
const mime = {'.js': 'text/javascript', '.mjs': 'text/javascript'}

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

const entryFile = path.join(root, 'scripts/_elem-engine-entry.js')
const bundleFile = path.join(root, 'scripts/_elem-engine-bundle.js')
fs.writeFileSync(entryFile,
  "export {ElementarySynthEngine} from '../src/audio/elementary/engine.mjs'\n" +
  "export {SOUND_VARIANTS} from '../src/audio/presets.mjs'\n")
execFileSync('npx', ['--yes', 'esbuild@0.24.0', 'scripts/_elem-engine-entry.js',
  '--bundle', '--format=iife', '--global-name=__ElemEngine',
  '--outfile=scripts/_elem-engine-bundle.js', '--log-level=error'], {cwd: root})

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname
  if (pathname === '/') {
    response.writeHead(200, {'Content-Type': 'text/html', 'Cache-Control': 'no-store'})
    response.end('<!doctype html><meta charset="utf-8"><title>Elementary sound level test</title>')
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
    page.on('console', message => { if (/error/i.test(message.text())) console.log('  [page]', message.text().slice(0, 200)) })
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.addScriptTag({url: `http://127.0.0.1:${server.address().port}/scripts/_elem-engine-bundle.js`})

    const metrics = await page.evaluate(async () => {
      const {ElementarySynthEngine} = window.__ElemEngine
      const {SOUND_VARIANTS} = window.__ElemEngine
      const sampleRate = 48000
      const quantum = 128 / sampleRate

      const peak = (channel, from = 0, to = channel.length) => {
        let value = 0
        for (let i = Math.max(0, from); i < Math.min(channel.length, to); i += 1) value = Math.max(value, Math.abs(channel[i]))
        return value
      }
      const rms = channel => Math.sqrt(channel.reduce((sum, sample) => sum + sample * sample, 0) / channel.length)

      // Runs a list of {at, action} steps sample-accurately: suspends the
      // offline context once per distinct target sample (OfflineAudioContext
      // rejects/never-resolves a suspend() at a time already reached, so
      // several events at the same `at` — e.g. an 8-note chord — share one
      // suspend/resume cycle), runs every action for that sample, waits for
      // the debounced render to actually land, then resumes.
      const playEvents = async (seconds, events, engineOptions = {}) => {
        const context = new OfflineAudioContext(1, Math.ceil(sampleRate * seconds), sampleRate)
        const engine = new ElementarySynthEngine(context, engineOptions)
        await engine.ensureReady()
        const bySample = new Map()
        for (const event of events) {
          const sample = Math.max(0, Math.floor(event.at / quantum) * quantum - quantum)
          if (!bySample.has(sample)) bySample.set(sample, [])
          bySample.get(sample).push(event.action)
        }
        const ordered = [...bySample.entries()].sort((a, b) => a[0] - b[0])
        const chain = ordered.reduce((step, [sample, actions]) => step.then(() =>
          context.suspend(sample).then(async () => {
            for (const action of actions) action(engine)
            await engine.whenIdle()
            context.resume()
          })), Promise.resolve())
        const rendering = context.startRendering()
        await chain
        const rendered = await rendering
        return {channel: rendered.getChannelData(0), engine}
      }

      const preset = SOUND_VARIANTS[0]

      // 1. 27 ms plant note vs a held note (same contract as test-sound-levels.js:
      // the attack must finish before release starts, and the note must reach
      // the level a held note reaches).
      const held = await playEvents(1.2, [
        {at: 0.05, action: e => e.noteOn('t', 0, 64, 98, 0.05, 1)},
        {at: 0.55, action: e => e.noteOff('t', 0, 64, 0.55)}
      ], {preset})
      const plant = await playEvents(1.2, [
        {at: 0.05, action: e => e.noteOn('t', 0, 64, 98, 0.05, 1)},
        {at: 0.077, action: e => e.noteOff('t', 0, 64, 0.077)}
      ], {preset})
      const plantNote = {heldPeak: +peak(held.channel).toFixed(4), plantPeak: +peak(plant.channel).toFixed(4)}

      // 2. Velocity dynamics: velocity 24 vs velocity 100, same note.
      const v24 = await playEvents(1, [{at: 0.05, action: e => e.noteOn('t', 0, 64, 24, 0.05, 1)}], {preset})
      const v100 = await playEvents(1, [{at: 0.05, action: e => e.noteOn('t', 0, 64, 100, 0.05, 1)}], {preset})
      const p24 = peak(v24.channel), p100 = peak(v100.channel)
      const dynamics = {v24: +p24.toFixed(4), v100: +p100.toFixed(4), dB: +(20 * Math.log10(p100 / Math.max(p24, 1e-9))).toFixed(1)}

      // 3. THD of the master chain: a probe sine INTO engine.input, no notes
      // playing — same technique as scripts/spike-elementary-gates.js. Uses
      // the engine's default volume (70, gain ~2.45x, same as the legacy
      // engine's default) with a moderate probe amplitude — test-sound-
      // levels.js's toneDistortion() uses 0.05-0.2 for the same reason: a
      // 0.5-amplitude probe at operating gain would drive the tanh ceiling
      // far harder than any real note ever does and measure the ceiling, not
      // the chain.
      const thdContext = new OfflineAudioContext(1, Math.round(sampleRate * 1.2), sampleRate)
      const thdEngine = new ElementarySynthEngine(thdContext, {preset, volume: 70})
      await thdEngine.ensureReady()
      const probeOsc = thdContext.createOscillator()
      const probeGain = thdContext.createGain()
      probeOsc.frequency.value = 440
      probeGain.gain.value = 0.1
      probeOsc.connect(probeGain).connect(thdEngine.input)
      probeOsc.start(0)
      const thdChannel = (await thdContext.startRendering()).getChannelData(0)
      let a = 0, b = 0, total = 0
      const from = Math.round(sampleRate * 0.5), to = Math.round(sampleRate * 1.0)
      for (let i = from; i < to; i += 1) {
        const t = i / sampleRate, s = thdChannel[i]
        a += s * Math.sin(2 * Math.PI * 440 * t)
        b += s * Math.cos(2 * Math.PI * 440 * t)
        total += s * s
      }
      const n = to - from
      a = 2 * a / n; b = 2 * b / n
      const fundamental = (a * a + b * b) / 2 * n
      const thdPercent = +(100 * Math.sqrt(Math.max(0, total - fundamental) / Math.max(fundamental, 1e-12))).toFixed(2)

      // 4. Eight held voices: no collapse, no ceiling breach.
      const pitches = [60, 62, 64, 65, 67, 69, 71, 72]
      const eight = await playEvents(1.2, pitches.map(note => ({
        at: 0.05, action: e => e.noteOn('t', 0, note, 100, 0.05, 1)
      })), {preset})
      let eightVoicesNonFinite = 0
      for (const sample of eight.channel) if (!Number.isFinite(sample)) eightVoicesNonFinite += 1
      const eightVoices = {peak: +peak(eight.channel).toFixed(4), rms: +rms(eight.channel).toFixed(4),
        nonFinite: eightVoicesNonFinite}

      // Max sample-to-sample delta in a window, well after a transition,
      // where the signal should already have decayed to near-silence. This
      // is the same thing test-sound-levels.js's releaseEdge measures
      // (maxPostStopDelta): a window taken *during* an active decay is
      // dominated by the carrier's own oscillation slope (a healthy ~330 Hz
      // tone has an inherent per-sample delta around 0.01-0.02, nothing to do
      // with a click); a click is what remains once the signal itself has
      // settled and should be flat.
      const maxAdjacentDelta = (channel, from, to) => {
        let value = 0
        for (let i = Math.max(1, from); i < to; i += 1) value = Math.max(value, Math.abs(channel[i] - channel[i - 1]))
        return value
      }

      // 5. Release not cut short: note off, then confirm the tail keeps
      // decaying (non-zero right after) and has actually settled to silence
      // by the time the declared release (0.42 s) has elapsed, with no
      // discontinuity left behind once it gets there.
      const releaseRun = await playEvents(1.2, [
        {at: 0.05, action: e => e.noteOn('t', 0, 64, 100, 0.05, 1)},
        {at: 0.3, action: e => e.noteOff('t', 0, 64, 0.3)}
      ], {preset})
      const releaseSample = Math.round(0.3 * sampleRate)
      const settledSample = Math.round(0.85 * sampleRate)
      const release = {
        tailPeakEarly: +peak(releaseRun.channel, releaseSample, releaseSample + 2048).toFixed(4),
        tailPeakLate: +peak(releaseRun.channel, releaseSample + 2048, releaseSample + 8192).toFixed(4),
        settledDelta: +maxAdjacentDelta(releaseRun.channel, settledSample, settledSample + 4096).toFixed(5)
      }

      // 6. No click after panic(): same technique, around panic() instead of noteOff().
      const panicRun = await playEvents(1.2, [
        {at: 0.05, action: e => e.noteOn('t', 0, 64, 100, 0.05, 1)},
        {at: 0.3, action: e => e.panic(0.3)}
      ], {preset})
      const panicClick = {settledDelta: +maxAdjacentDelta(panicRun.channel, settledSample, settledSample + 4096).toFixed(5)}

      return {plantNote, dynamics, thdPercent, eightVoices, release, panicClick}
    })

    // Same thresholds as test-sound-levels.js, plus the two new ones the
    // coordinator specified for the Elementary engine.
    assert(metrics.plantNote.plantPeak >= 0.8 * metrics.plantNote.heldPeak,
      `27 ms plant note peaks at ${metrics.plantNote.plantPeak} vs held ${metrics.plantNote.heldPeak}`)
    assert(metrics.dynamics.dB >= 8, `dynamics ${metrics.dynamics.dB} dB is below the 8 dB floor`)
    assert(metrics.dynamics.dB <= 13, `dynamics ${metrics.dynamics.dB} dB is above the 13 dB ceiling (light touches would go inaudible)`)
    assert(metrics.thdPercent <= 3, `master-chain THD is ${metrics.thdPercent}% (gate <= 3%)`)
    // Same reasoning as test-sound-levels.js's distortion comment: the tanh
    // ceiling means peak alone cannot usefully fail (it structurally
    // approaches, but at 4-decimal rounding can print as, 1 for any hot
    // input) — an eight-voice fortissimo chord at the default volume rides
    // right up against that asymptote, which is the soft-ceiling working as
    // designed, not a clip or a hard cut. What must not happen is a NaN/
    // Infinity blow-up or a collapse (voices cancelling / going silent).
    assert.strictEqual(metrics.eightVoices.nonFinite, 0, 'eight held voices produced non-finite audio')
    assert(metrics.eightVoices.peak > 0.1, `eight held voices collapsed to peak ${metrics.eightVoices.peak}`)
    assert(metrics.release.settledDelta <= 0.0005,
      `release settled-tail delta ${metrics.release.settledDelta} can produce an audible click`)
    assert(metrics.release.tailPeakLate > 0, 'release tail was cut to silence instead of decaying')
    assert(metrics.panicClick.settledDelta <= 0.0005,
      `panic settled-tail delta ${metrics.panicClick.settledDelta} can produce an audible click`)

    console.log('Elementary engine sound levels: ' + JSON.stringify(metrics, null, 1))
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
    fs.rmSync(entryFile, {force: true})
    fs.rmSync(bundleFile, {force: true})
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

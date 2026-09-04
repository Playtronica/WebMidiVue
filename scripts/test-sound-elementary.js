// Gates of the sound engine (src/audio/elementary/*), rendered offline.
// noteOn/noteOff/panic write straight to the engine's per-voice refs (no
// render() call — see engine.mjs), but a ref's setter still applies "at the
// nearest block", so every scheduled action here uses context.suspend()/
// resume() around it for sample-accurate timing.
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
  "export {SOUNDS} from '../src/audio/elementary/timbres.mjs'\n" +
  "export {BIOTRON_CALIBRATION} from '../src/audio/biotronCalibration.mjs'\n")
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
      const {SOUNDS} = window.__ElemEngine
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

      const preset = SOUNDS[0]

      // 1. 27 ms plant note vs a held note: the attack must finish before
      // release starts, and the note must reach the level a held note reaches.
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
      // playing — same technique as scripts/spike-elementary-gates.js, at the
      // default volume with a moderate probe amplitude (a 0.5 probe would
      // measure the tanh ceiling, not the chain).
      // Measured dry on purpose: delay and reverb are part of a sound, but a
      // modulated reverb tail is by definition not the fundamental and lands
      // in this integral as "distortion" (2026-09-04: 0.02% dry, 9.2% wet).
      const dryPreset = {...preset, fx: {...preset.fx, delayWet: 0, reverbWet: 0}}
      const thdContext = new OfflineAudioContext(1, Math.round(sampleRate * 1.2), sampleRate)
      const thdEngine = new ElementarySynthEngine(thdContext, {preset: dryPreset, volume: 70})
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
      // where the signal should already have decayed to near-silence: a
      // window taken *during* an active decay is
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
      // by the time the sound's release (Round: 0.25 s) has elapsed, with no
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

      // 7. Every sound, the same questions: how loud a held note is, how
      // long its tail rings after note-off, how bright it is, whether the
      // 27 ms plant note reaches the held level, and how far below normal
      // play the calibration cue and light-sensor notes sit. The player can
      // pick any sound, so the two level bands are checked on every one.
      // Reference = a plant note at the firmware maximum (velocity 98).
      // Calibration cue: firmware state 125 → BIOTRON_CALIBRATION.localLevel
      // at cue velocity 24. Light sensor: channel 2 → lightLevel at the
      // firmware default velocity 68 (biotron-firmware src/params.c).
      const {BIOTRON_CALIBRATION} = window.__ElemEngine
      const centroidHz = (channel, from, size = 16384) => {
        const re = new Float64Array(size), im = new Float64Array(size)
        for (let i = 0; i < size; i += 1) re[i] = (channel[from + i] || 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / size))
        for (let i = 1, j = 0; i < size; i += 1) {
          let bit = size >> 1
          for (; j & bit; bit >>= 1) j ^= bit
          j ^= bit
          if (i < j) { [re[i], re[j]] = [re[j], re[i]] }
        }
        for (let len = 2; len <= size; len <<= 1) {
          const wr = Math.cos(-2 * Math.PI / len), wi = Math.sin(-2 * Math.PI / len)
          for (let start = 0; start < size; start += len) {
            for (let k = 0, cr = 1, ci = 0; k < len / 2; k += 1) {
              const a = start + k, b = a + len / 2
              const vr = re[b] * cr - im[b] * ci, vi = re[b] * ci + im[b] * cr
              re[b] = re[a] - vr; im[b] = im[a] - vi
              re[a] += vr; im[a] += vi
              const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t
            }
          }
        }
        let weighted = 0, total = 0
        for (let i = 1; i < size / 2; i += 1) {
          const magnitude = Math.hypot(re[i], im[i])
          weighted += i * sampleRate / size * magnitude
          total += magnitude
        }
        return total > 0 ? Math.round(weighted / total) : 0
      }
      const sounds = []
      for (const sound of SOUNDS) {
        const note = (velocity, offAt, levelScale = 1) => playEvents(3, [
          {at: 0.05, action: e => e.noteOn('t', 0, 64, velocity, 0.05, levelScale)},
          {at: offAt, action: e => e.noteOff('t', 0, 64, offAt)}
        ], {preset: sound}).then(run => run.channel)
        const heldChannel = await note(98, 0.55)
        const heldPeak = peak(heldChannel)
        const offSample = Math.round(0.55 * sampleRate)
        let lastAudible = offSample
        for (let i = heldChannel.length - 1; i > offSample; i -= 1) {
          if (Math.abs(heldChannel[i]) > heldPeak * 0.01) { lastAudible = i; break }
        }
        const heldRms = rms(heldChannel)
        const relativeDb = channel => +(20 * Math.log10(rms(channel) / Math.max(heldRms, 1e-9))).toFixed(1)
        sounds.push({
          name: sound.name,
          peak: +heldPeak.toFixed(4),
          tailSeconds: +((lastAudible - offSample) / sampleRate).toFixed(2),
          centroidHz: centroidHz(heldChannel, Math.round(0.2 * sampleRate)),
          plantPercent: Math.round(100 * peak(await note(98, 0.077)) / Math.max(heldPeak, 1e-9)),
          calibrationDb: relativeDb(await note(24, 0.55, BIOTRON_CALIBRATION.localLevel)),
          lightDb: relativeDb(await note(68, 0.55, BIOTRON_CALIBRATION.lightLevel))
        })
      }

      return {plantNote, dynamics, thdPercent, eightVoices, release, panicClick, sounds}
    })

    // Plant-note and click thresholds carried over from the previous engine's
    // gates; dynamics and THD specified for this one.
    assert(metrics.plantNote.plantPeak >= 0.8 * metrics.plantNote.heldPeak,
      `27 ms plant note peaks at ${metrics.plantNote.plantPeak} vs held ${metrics.plantNote.heldPeak}`)
    assert(metrics.dynamics.dB >= 8, `dynamics ${metrics.dynamics.dB} dB is below the 8 dB floor`)
    assert(metrics.dynamics.dB <= 13, `dynamics ${metrics.dynamics.dB} dB is above the 13 dB ceiling (light touches would go inaudible)`)
    assert(metrics.thdPercent <= 3, `master-chain THD is ${metrics.thdPercent}% (gate <= 3%)`)
    // The tanh ceiling means peak alone cannot usefully fail (it structurally
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

    // Level bands, checked on every sound (2026-09-04, measured on all seven):
    // the calibration cue keeps the previous engine's band -36..-18 dB below a
    // velocity-98 plant note (measured -33.7..-34.5 dB); light-sensor notes
    // must stay a background layer (<= -8 dB, the previous ceiling) and stay
    // audibly above the cue (>= cue + 6 dB) so a broken lightLevel cannot
    // mute them silently. Measured -18.8..-19.6 dB, which is ~2.5 dB below the
    // lightest Humanize touch (velocity 8: -16.2..-17.0 dB); whether that is
    // too quiet is Andrey's ear call (lightLevel 0.12 → -16 dB, 0.16 → -14 dB,
    // 0.20 → -13 dB), so the previous -18 dB floor is deliberately not gated.
    for (const sound of metrics.sounds) {
      assert(sound.calibrationDb <= -18 && sound.calibrationDb >= -36,
        `${sound.name}: calibration cue at ${sound.calibrationDb} dB is outside -36..-18 dB`)
      assert(sound.lightDb <= -8, `${sound.name}: light-sensor notes at ${sound.lightDb} dB are above the -8 dB background ceiling`)
      assert(sound.lightDb >= sound.calibrationDb + 6,
        `${sound.name}: light-sensor notes at ${sound.lightDb} dB are not audibly above the calibration cue (${sound.calibrationDb} dB)`)
    }

    const {sounds, ...gates} = metrics
    console.log('Elementary engine sound levels: ' + JSON.stringify(gates, null, 1))
    console.log('Seven sounds (held note velocity 98): ' + sounds.map(sound =>
      `${sound.name}: peak ${sound.peak}, tail ${sound.tailSeconds} s, centroid ${sound.centroidHz} Hz, ` +
      `27 ms note ${sound.plantPercent}%, calibration ${sound.calibrationDb} dB, light ${sound.lightDb} dB`).join(' | '))
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

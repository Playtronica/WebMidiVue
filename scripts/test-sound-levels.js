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
      const {BIOTRON_CALIBRATION} = await import('/src/audio/biotronCalibration.mjs')
      const render = async (name, preset, notes, velocity, quality, volume, levelScale = 1) => {
        const sampleRate = 48000
        const seconds = 3
        const context = new OfflineAudioContext(2, sampleRate * seconds, sampleRate)
        const engine = new SynthEngine(context, {preset, quality, volume})
        for (const note of notes) engine.noteOn('level-test', 0, note, velocity, 0.05, levelScale)
        for (const note of notes) engine.noteOff('level-test', 0, note, 0.55)
        const rendered = await context.startRendering()
        const channel = rendered.getChannelData(0)
        let peak = 0
        let energy = 0
        let nonFinite = 0
        let ceilingSamples = 0
        for (const sample of channel) {
          if (!Number.isFinite(sample)) nonFinite += 1
          if (Math.abs(sample) >= 0.94999) ceilingSamples += 1
          peak = Math.max(peak, Math.abs(sample))
          energy += sample * sample
        }
        return {name, quality, peak, rms: Math.sqrt(energy / channel.length), nonFinite,
          ceilingFraction: ceilingSamples / channel.length}
      }
      const renderSequence = async (name, preset, events, quality, volume) => {
        const sampleRate = 48000
        const seconds = Math.max(...events.map(event => event.at + event.duration)) + preset.release + 0.75
        const context = new OfflineAudioContext(2, Math.ceil(sampleRate * seconds), sampleRate)
        const engine = new SynthEngine(context, {preset, quality, volume})
        for (const event of events) {
          engine.noteOn('sequence-test', 0, event.note, event.velocity, event.at, event.levelScale)
          engine.noteOff('sequence-test', 0, event.note, event.at + event.duration)
        }
        const rendered = await context.startRendering()
        const channel = rendered.getChannelData(0)
        let peak = 0
        let energy = 0
        let nonFinite = 0
        let ceilingSamples = 0
        for (const sample of channel) {
          if (!Number.isFinite(sample)) nonFinite += 1
          if (Math.abs(sample) >= 0.94999) ceilingSamples += 1
          peak = Math.max(peak, Math.abs(sample))
          energy += sample * sample
        }
        return {name, quality, peak, rms: Math.sqrt(energy / channel.length), nonFinite,
          ceilingFraction: ceilingSamples / channel.length}
      }
      const sampleRate = 48000
      // Distortion of the whole master chain on a steady tone, measured as THD+N
      // against the fitted 440 Hz fundamental.
      const toneDistortion = async (amplitude, volume, quality) => {
        const seconds = 1.5
        const context = new OfflineAudioContext(1, sampleRate * seconds, sampleRate)
        const engine = new SynthEngine(context, {preset: SOUND_VARIANTS[0], quality, volume})
        const osc = context.createOscillator()
        const gain = context.createGain()
        osc.frequency.value = 440
        gain.gain.value = amplitude
        osc.connect(gain).connect(engine.input)
        osc.start(0); osc.stop(seconds)
        const channel = (await context.startRendering()).getChannelData(0)
        const from = Math.round(sampleRate * 0.8), to = Math.round(sampleRate * 1.3)
        let a = 0, b = 0, total = 0, peak = 0
        for (let i = from; i < to; i++) {
          const t = i / sampleRate, s = channel[i]
          a += s * Math.sin(2 * Math.PI * 440 * t)
          b += s * Math.cos(2 * Math.PI * 440 * t)
          total += s * s
          peak = Math.max(peak, Math.abs(s))
        }
        const n = to - from
        a = 2 * a / n; b = 2 * b / n
        const fundamental = (a * a + b * b) / 2 * n
        return {amplitude, volume, quality, peak: Number(peak.toFixed(4)),
          thdPercent: Number((100 * Math.sqrt(Math.max(0, total - fundamental) / Math.max(fundamental, 1e-12))).toFixed(2))}
      }

      // Fast repeated notes, scheduled in render order (suspend/resume) the way a
      // live performance arrives. Batch-scheduling every note at t=0 made the
      // retire queue dispose voices before they sounded and reported "inaudible"
      // notes that never happen live (2026-09-03). The honest question is
      // masking: is the new attack louder than the tails still ringing under it?
      const fastStream = async (notesPerSecond, seconds, quality, volume, base = SOUND_VARIANTS[0]) => {
        const preset = {...base, mixB: 0, delayWet: 0, reverbWet: 0}
        const gap = 1 / notesPerSecond
        const count = Math.floor(seconds * notesPerSecond)
        const quantum = 128 / sampleRate
        const context = new OfflineAudioContext(1, Math.ceil(sampleRate * (seconds + preset.release + 0.5)), sampleRate)
        const engine = new SynthEngine(context, {preset, quality, volume})
        const pitches = [60, 64, 67, 71, 72, 67, 64, 60]
        const events = []
        for (let i = 0; i < count; i++) {
          const at = 0.1 + i * gap
          events.push({t: at, on: true, n: pitches[i % 8]}, {t: at + gap * 0.6, on: false, n: pitches[i % 8]})
        }
        events.sort((a, b) => a.t - b.t)
        const chain = events.reduce((step, event) => step.then(() =>
          context.suspend(Math.max(0, Math.floor(event.t / quantum) * quantum - quantum)).then(() => {
            if (event.on) engine.noteOn('fast', 0, event.n, 100, event.t)
            else engine.noteOff('fast', 0, event.n, event.t)
            context.resume()
          })), Promise.resolve())
        const rendering = context.startRendering()
        await chain
        const channel = (await rendering).getChannelData(0)
        const peakBetween = (from, to) => {
          let peak = 0
          for (let i = Math.max(0, from); i < Math.min(channel.length, to); i++) peak = Math.max(peak, Math.abs(channel[i]))
          return peak
        }
        const onsets = events.filter(event => event.on).map(event => Math.round(event.t * sampleRate))
        const window = Math.round(Math.min(gap, 0.05) * sampleRate)
        // The first note has nothing under it, so it is judged over its own full attack;
        // every later note over the gap it actually gets.
        const attacks = onsets.map((at, i) => peakBetween(at, at + (i ? window : Math.round((preset.attack + 0.03) * sampleRate))))
        const tails = onsets.map(at => peakBetween(at - Math.round(0.01 * sampleRate), at))
        const masked = onsets.slice(1).filter((_, i) => tails[i + 1] > 0.8 * attacks[i + 1]).length
        const clear = onsets.slice(1).filter((_, i) => attacks[i + 1] >= 2 * tails[i + 1]).length
        return {notesPerSecond, quality, notes: count, name: base.name, clearUpTo: base.clearUpTo,
          clearPercent: Math.round(100 * clear / Math.max(1, onsets.length - 1)),
          // "did not start" is absolute: nothing audible in the attack window. A relative
          // threshold flagged the first note, whose window has no ringing tails under it.
          silentNotes: attacks.filter(peak => peak < 0.02).length,
          maskedNotes: masked,
          meanAttack: Number((attacks.reduce((a, b) => a + b, 0) / attacks.length).toFixed(3)),
          meanTailBeforeOnset: Number((tails.slice(1).reduce((a, b) => a + b, 0) / Math.max(1, tails.length - 1)).toFixed(3))}
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
          [36, 40, 43, 47, 52, 55, 59, 64], 127, quality, 150))))
      const volumeSweep = await Promise.all([0, 50, 70, 100, 150].map(volume =>
        render(`volume ${volume}`, SOUND_VARIANTS[0], [72], 100, 'standard', volume)))
      const normalPlay = await render('normal Biotron play', SOUND_VARIANTS[0], [64], 98, 'safe', 70, 1)
      const calibration = await render('quiet calibration', SOUND_VARIANTS[0], [64], 24,
        'safe', 70, BIOTRON_CALIBRATION.localLevel)
      const calibrationEvents = [
        [0.3, 64, 0.3], [0.8, 65, 0.3], [1.3, 67, 0.4], [1.8, 72, 0.4],
        [2.4, 71, 0.3], [2.9, 67, 0.3], [3.4, 62, 0.4], [4.0, 60, 0.9]
      ].map(([at, note, duration]) => ({at, note, duration, velocity: 24,
        levelScale: BIOTRON_CALIBRATION.localLevel}))
      const calibrationPhrase = await renderSequence('quiet full calibration phrase', SOUND_VARIANTS[0],
        calibrationEvents, 'safe', 70)
      const calibration194Velocities = [22, 24, 26, 28, 26, 24, 22, 18]
      const calibration194Phrase = await renderSequence('1.9.4 full calibration phrase', SOUND_VARIANTS[0],
        calibrationEvents.map((event, index) => ({...event, velocity: calibration194Velocities[index]})),
        'safe', 70)
      const ordinaryPhrase = await renderSequence('ordinary phrase at calibration rhythm', SOUND_VARIANTS[0],
        calibrationEvents.map(event => ({...event, velocity: 98, levelScale: 1})), 'safe', 70)
      const legacyCalibrationEvents = Array.from({length: 20}, (_, index) => ({
        at: 0.1 + index * 0.1,
        note: index % 2 ? 91 : 92,
        duration: 0.1,
        velocity: 90,
        levelScale: BIOTRON_CALIBRATION.localLevel
      }))
      const legacyCalibrationPhrase = await renderSequence('1.9.3 legacy calibration phrase', SOUND_VARIANTS[0],
        legacyCalibrationEvents, 'safe', 70)
      const lightSensor = await render('light sensor', SOUND_VARIANTS[0], [64], 75,
        'safe', 70, BIOTRON_CALIBRATION.lightLevel)
      const renderReleaseEdge = async () => {
        const sampleRate = 48000
        const context = new OfflineAudioContext(1, sampleRate, sampleRate)
        const release = 0.1
        const noteOff = 0.25
        const stopTime = noteOff + release + 0.025
        const preset = {...SOUND_VARIANTS[0], mixB: 0, delayWet: 0, reverbWet: 0, release}
        const engine = new SynthEngine(context, {preset, quality: 'safe', volume: 150})
        engine.noteOn('release-edge', 0, 72, 127, 0.05)
        engine.noteOff('release-edge', 0, 72, noteOff)
        const rendered = await context.startRendering()
        const channel = rendered.getChannelData(0)
        const stopSample = Math.round(stopTime * sampleRate)
        let maxAdjacentDelta = 0
        let maxPostStopDelta = 0
        let maxPostStopDeltaOffset = 0
        let peakNearStop = 0
        for (let index = stopSample - 256; index <= stopSample + 256; index++) {
          peakNearStop = Math.max(peakNearStop, Math.abs(channel[index] || 0))
          maxAdjacentDelta = Math.max(maxAdjacentDelta,
            Math.abs((channel[index] || 0) - (channel[index - 1] || 0)))
        }
        for (let index = stopSample; index <= stopSample + 4096; index++) {
          const delta = Math.abs((channel[index] || 0) - (channel[index - 1] || 0))
          if (delta > maxPostStopDelta) {
            maxPostStopDelta = delta
            maxPostStopDeltaOffset = index - stopSample
          }
        }
        return {
          maxAdjacentDelta,
          maxPostStopDelta,
          maxPostStopDeltaOffset,
          peakNearStop,
          stopSample,
          stopDelta: Math.abs((channel[stopSample] || 0) - (channel[stopSample - 1] || 0)),
          sampleBeforeStop: channel[stopSample - 1] || 0,
          sampleAtStop: channel[stopSample] || 0
        }
      }
      const releaseEdge = await renderReleaseEdge()
      const toneDistortions = []
      for (const amplitude of [0.05, 0.1, 0.2]) toneDistortions.push(await toneDistortion(amplitude, 70, 'standard'))
      const fastStreams = []
      for (const rate of [4, 8, 12, 16, 20, 25]) fastStreams.push(await fastStream(rate, 2, 'standard', 70))
      for (const rate of [4, 12]) fastStreams.push(await fastStream(rate, 2, 'safe', 70))
      // Every preset is rendered at the articulation limit it declares.
      const declared = []
      // clearUpTo 0 means a pad: it never separates attacks and is not gated.
      for (const preset of SOUND_VARIANTS.filter(item => item.clearUpTo > 0)) declared.push(await fastStream(preset.clearUpTo, preset.clearUpTo < 4 ? 6 : 2, 'standard', 70, preset))
      return {
        singleNotes, quietBiotronNotes, denseChords, maximumDenseChords,
        volumeSweep, normalPlay, calibration, calibrationPhrase, calibration194Phrase, ordinaryPhrase,
        legacyCalibrationPhrase, lightSensor, releaseEdge, toneDistortions, fastStreams, declared
      }
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
    assert(metrics.volumeSweep[4].rms > metrics.volumeSweep[3].rms,
      `150% boost RMS ${metrics.volumeSweep[4].rms} did not exceed 100% RMS ${metrics.volumeSweep[3].rms}`)
    assert(metrics.volumeSweep[4].peak <= 0.98,
      `150% boost peak ${metrics.volumeSweep[4].peak} exceeds 0.98`)
    assert(metrics.volumeSweep[2].rms >= 0.17,
      `default-volume RMS ${metrics.volumeSweep[2].rms} is below the loudness floor`)
    const calibrationDb = 20 * Math.log10(metrics.calibration.rms / metrics.normalPlay.rms)
    const calibrationPhraseDb = 20 * Math.log10(metrics.calibrationPhrase.rms / metrics.ordinaryPhrase.rms)
    const lightSensorDb = 20 * Math.log10(metrics.lightSensor.rms / metrics.normalPlay.rms)
    const calibration194Db = 20 * Math.log10(metrics.calibration194Phrase.rms / metrics.ordinaryPhrase.rms)
    assert(calibrationDb <= -18 && calibrationDb >= -36,
      `calibration relative level ${calibrationDb.toFixed(2)} dB is outside -36..-18 dB`)
    assert(calibrationPhraseDb <= -18 && calibrationPhraseDb >= -36,
      `full calibration phrase relative level ${calibrationPhraseDb.toFixed(2)} dB is outside -36..-18 dB`)
    assert(calibration194Db <= -18 && calibration194Db >= -36,
      `1.9.4 calibration relative level ${calibration194Db.toFixed(2)} dB is outside -36..-18 dB`)
    assert(lightSensorDb <= -8 && lightSensorDb >= -18,
      `light relative level ${lightSensorDb.toFixed(2)} dB is outside -18..-8 dB`)
    assert(Math.max(...metrics.maximumDenseChords.map(metric => metric.peak)) <= 0.98,
      `maximum-volume dense chord peak is ${Math.max(...metrics.maximumDenseChords.map(metric => metric.peak))}`)
    assert(Math.max(...metrics.singleNotes.map(metric => metric.ceilingFraction)) <= 0.001,
      `single-note ceiling saturation is ${Math.max(...metrics.singleNotes.map(metric => metric.ceilingFraction))}`)
    assert(metrics.releaseEdge.maxPostStopDelta <= 0.0005,
      `release edge ${metrics.releaseEdge.maxPostStopDelta} can produce an audible click`)
    // Distortion ratchet. Peak alone cannot fail: the soft ceiling caps output at
    // SOFT_CEILING, so `peak < 0.98` is structurally always true. THD+N is what a
    // listener actually calls clipping, so that is what is gated here.
    const quietTone = metrics.toneDistortions[0]
    const loudTone = metrics.toneDistortions[1]
    assert(quietTone.thdPercent <= 4,
      `quiet-tone distortion is ${quietTone.thdPercent}% (was 3.15% on 2026-09-02)`)
    assert(loudTone.thdPercent <= 11,
      `ordinary loud-note distortion is ${loudTone.thdPercent}% (was 9.92% on 2026-09-02)`)

    // Fast-play articulation, live order: every note must start. Masking of the
    // new attack by ringing tails is reported, not gated — it is a voicing
    // decision (attack/release of the preset), owned by Andrey.
    for (const stream of metrics.fastStreams) {
      assert.strictEqual(stream.silentNotes, 0,
        `${stream.silentNotes} of ${stream.notes} notes did not start at ${stream.notesPerSecond} notes/s (${stream.quality})`)
    }
    // Articulation contract: at the rate a preset declares, at least 90% of new
    // attacks must be 6 dB above the tails still ringing under them (dry render).
    for (const stream of metrics.declared) {
      assert(stream.clearPercent >= 90,
        `${stream.name} declares clearUpTo ${stream.clearUpTo} notes/s but only ${stream.clearPercent}% of attacks are clear there`)
    }
    console.log('Articulation: ' + metrics.declared.map(stream => `${stream.name} ${stream.clearUpTo}/s → ${stream.clearPercent}% clear`).join(' | '))
    console.log(`Sound levels verified: ${JSON.stringify(metrics)}`)
    console.log('Distortion (THD+N): ' + metrics.toneDistortions
      .map(tone => `peak ${tone.peak} -> ${tone.thdPercent}%`).join(', '))
    console.log('Fast play (live order): ' + metrics.fastStreams
      .map(stream => `${stream.notesPerSecond}/s ${stream.quality}: ${stream.maskedNotes}/${stream.notes - 1} attacks masked by tails (attack ${stream.meanAttack}, tail ${stream.meanTailBeforeOnset})`).join(' | '))
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

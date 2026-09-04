// Gate zero for Elementary Audio: does its AudioWorkletNode render inside a plain
// OfflineAudioContext (where all our sound gates live), and can it take an input?
const fs = require('fs'), http = require('http'), path = require('path')
const {chromium} = require('playwright-core')
const root = path.resolve(__dirname, '..'), mime = {'.js': 'text/javascript', '.mjs': 'text/javascript'}
const chromePath = () => [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find(fs.existsSync)
const server = http.createServer((q, r) => {
  const p = decodeURIComponent(new URL(q.url, 'http://127.0.0.1').pathname)
  if (p === '/') { r.writeHead(200, {'Content-Type': 'text/html'}); r.end('<!doctype html><meta charset="utf-8">'); return }
  const f = path.resolve(root, p.slice(1))
  if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return }
  r.writeHead(200, {'Content-Type': mime[path.extname(f)] || 'application/octet-stream'}); r.end(fs.readFileSync(f))
})
;(async () => {
  await new Promise(res => server.listen(0, '127.0.0.1', res))
  const browser = await chromium.launch({executablePath: chromePath(), headless: true})
  try {
    const page = await browser.newPage()
    page.on('console', m => { if (/elem|error|Error/i.test(m.text())) console.log('  [page]', m.text().slice(0, 160)) })
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.addScriptTag({url: `http://127.0.0.1:${server.address().port}/scripts/_elem-bundle.js`})
    const out = await page.evaluate(async () => {
      const {el, WebRenderer} = window.__elem
      const peak = ch => { let p = 0; for (const s of ch) p = Math.max(p, Math.abs(s)); return +p.toFixed(4) }
      const rms = ch => { let e = 0; for (const s of ch) e += s * s; return +Math.sqrt(e / ch.length).toFixed(4) }
      const result = {}
      // A: WebRenderer inside OfflineAudioContext — the path our gates need
      try {
        const ctx = new OfflineAudioContext(1, 48000, 48000)
        const core = new WebRenderer()
        const node = await core.initialize(ctx, {numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1]})
        node.connect(ctx.destination)
        await core.render(el.mul(0.5, el.cycle(440)))
        const buf = await ctx.startRendering()
        result.A = {peak: peak(buf.getChannelData(0)), rms: rms(buf.getChannelData(0)), inputs: node.numberOfInputs, outputs: node.numberOfOutputs}
      } catch (e) { result.A = {error: String(e).slice(0, 200)} }
      // B: same but with an input, to see if our THD probe could feed it
      try {
        const ctx = new OfflineAudioContext(1, 48000, 48000)
        const core = new WebRenderer()
        const node = await core.initialize(ctx, {numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1]})
        const osc = ctx.createOscillator(); osc.frequency.value = 440; osc.connect(node); osc.start(0)
        node.connect(ctx.destination)
        await core.render(el.mul(1, el.in({channel: 0})))
        const buf = await ctx.startRendering()
        result.B = {peak: peak(buf.getChannelData(0)), inputs: node.numberOfInputs}
      } catch (e) { result.B = {error: String(e).slice(0, 200)} }
      // C: gate-driven note, the way a real voice would work (const key flipped between renders)
      try {
        const ctx = new OfflineAudioContext(1, 48000, 48000)
        const core = new WebRenderer()
        const node = await core.initialize(ctx, {numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1]})
        node.connect(ctx.destination)
        const voice = g => el.mul(el.adsr(0.005, 0.1, 0.6, 0.3, g), el.cycle(440), 0.5)
        await core.render(voice(el.const({key: 'g1', value: 1})))
        const buf = await ctx.startRendering()
        result.C = {peak: peak(buf.getChannelData(0)), rms: rms(buf.getChannelData(0))}
      } catch (e) { result.C = {error: String(e).slice(0, 200)} }
      return result
    })
    console.log(JSON.stringify(out, null, 1))
    const ok = out.A && !out.A.error && out.A.peak > 0.05
    console.log(ok ? 'GATE 0 (Elementary): PASS' : 'GATE 0 (Elementary): FAIL')
  } finally { await browser.close(); await new Promise(res => server.close(res)) }
})().catch(e => { console.error('SPIKE ERROR', e.message); process.exitCode = 1 })

// Наши боевые числа, но на патче Elementary: динамика velocity, THD, нота 27 мс,
// хвост при 8 удержанных голосах. Офлайн-рендер, как в test-sound-levels.js.
const fs = require('fs'), http = require('http'), path = require('path'), {execFileSync} = require('child_process')
const {chromium} = require('playwright-core')
const root = path.resolve(__dirname, '..'), mime = {'.js': 'text/javascript', '.mjs': 'text/javascript'}
const chromePath = () => [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find(fs.existsSync)
fs.writeFileSync(path.join(root, 'scripts/_elem-entry.js'),
  "import {el} from '@elemaudio/core'\nimport WebRenderer from '@elemaudio/web-renderer'\nwindow.__elem = {el, WebRenderer}\n")
execFileSync('npx', ['--yes', 'esbuild@0.24.0', 'scripts/_elem-entry.js', '--bundle', '--format=iife', '--outfile=scripts/_elem-bundle.js', '--log-level=error'], {cwd: root})
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
    page.on('console', m => { if (/error/i.test(m.text())) console.log('  [page]', m.text().slice(0, 140)) })
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.addScriptTag({url: `http://127.0.0.1:${server.address().port}/scripts/_elem-bundle.js`})
    const out = await page.evaluate(async (VEL_EXP) => {
      const {el, WebRenderer} = window.__elem
      const SR = 48000
      const peak = (ch, a = 0, b = ch.length) => { let p = 0; for (let i = a; i < b; i++) p = Math.max(p, Math.abs(ch[i])); return p }
      // Один голос: velocity влияет на громкость И на яркость фильтра — как у настоящего инструмента.
      const voice = (gate, freq, vel) => {
        const env = el.adsr(0.006, 0.18, 0.35, 0.42, gate)
        const cut = el.mul(el.add(300, el.mul(4200, vel)), 1)
        const osc = el.add(el.mul(0.75, el.cycle(freq)), el.mul(0.25, el.triangle(el.mul(freq, 2))))
        return el.mul(env, el.pow(vel, VEL_EXP), el.lowpass(cut, 0.7, osc), 0.5)
      }
      const render = async (build, seconds) => {
        const ctx = new OfflineAudioContext(1, Math.round(SR * seconds), SR)
        const core = new WebRenderer()
        const node = await core.initialize(ctx, {numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1]})
        node.connect(ctx.destination)
        await core.render(build(el))
        return (await ctx.startRendering()).getChannelData(0)
      }
      const gateOn = k => el.const({key: k, value: 1})
      const res = {}
      // 1. Динамика: velocity 24 против velocity 100 (наша цель — заметная разница)
      const v = x => el.const({key: 'vel', value: x})
      const p24 = peak(await render(() => voice(gateOn('g'), el.const({key: 'f', value: 261.6}), v(24 / 127)), 1))
      const p100 = peak(await render(() => voice(gateOn('g'), el.const({key: 'f', value: 261.6}), v(100 / 127)), 1))
      res.dynamics = {v24: +p24.toFixed(4), v100: +p100.toFixed(4), dB: +(20 * Math.log10(p100 / Math.max(p24, 1e-9))).toFixed(1)}
      // 2. THD мастер-цепи: чистый тон ВНУТРЬ ноды через вход, как зонд в test-sound-levels.js.
      // Мерить THD на самом патче нельзя — его второй осциллятор гармоничен намеренно.
      const renderThroughMaster = async (amp, seconds) => {
        const ctx = new OfflineAudioContext(1, Math.round(SR * seconds), SR)
        const core = new WebRenderer()
        const node = await core.initialize(ctx, {numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1]})
        const osc = ctx.createOscillator(); osc.frequency.value = 440
        const g = ctx.createGain(); g.gain.value = amp
        osc.connect(g).connect(node); osc.start(0)
        node.connect(ctx.destination)
        // мастер-цепь: мягкий потолок вместо компрессора с подъёмом
        await core.render(el.tanh(el.mul(el.in({channel: 0}), 1.0)))
        return (await ctx.startRendering()).getChannelData(0)
      }
      const ch = await renderThroughMaster(0.5, 1.2)
      let a = 0, b = 0, total = 0
      const from = Math.round(SR * 0.5), to = Math.round(SR * 1.0)
      for (let i = from; i < to; i++) { const t = i / SR, s = ch[i]; a += s * Math.sin(2 * Math.PI * 440 * t); b += s * Math.cos(2 * Math.PI * 440 * t); total += s * s }
      const n = to - from; a = 2 * a / n; b = 2 * b / n
      const fund = (a * a + b * b) / 2 * n
      res.thdMasterPercent = +(100 * Math.sqrt(Math.max(0, total - fund) / Math.max(fund, 1e-12))).toFixed(2)
      res.thdNote = 'не мерим на патче: вторая гармоника в нём намеренная'
      // 3. Полифония: 8 удержанных голосов — пик не должен схлопнуться и не должен упереться в 1.0
      const many = await render(E => {
        let sum = 0
        for (let i = 0; i < 8; i++) sum = E.add(sum, voice(gateOn('g' + i), E.const({key: 'f' + i, value: 220 * Math.pow(2, i / 12)}), v(100 / 127)))
        return E.tanh(E.mul(sum, 0.9))
      }, 1.2)
      res.eightVoices = {peak: +peak(many).toFixed(4)}
      return res
    }, Number(process.argv[2] || 0.78))
    console.log('vel^' + (process.argv[2] || 0.78), JSON.stringify(out))
  } finally {
    await browser.close(); await new Promise(res => server.close(res))
    fs.rmSync(path.join(root, 'scripts/_elem-entry.js'), {force: true}); fs.rmSync(path.join(root, 'scripts/_elem-bundle.js'), {force: true})
  }
})().catch(e => { console.error('ERROR', e.message); process.exitCode = 1 })

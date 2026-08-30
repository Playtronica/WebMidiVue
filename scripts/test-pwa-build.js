const assert = require('assert')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const root = path.resolve(__dirname, '..', 'dist')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

for (const file of ['index.html', 'manifest.json', 'service-worker.js']) {
  assert(fs.existsSync(path.join(root, file)), `${file} is missing from the production build`)
}

const manifest = JSON.parse(read('manifest.json'))
assert.strictEqual(manifest.name, 'Biotron Settings Offline Beta')
assert.strictEqual(manifest.short_name, 'Biotron Beta')
assert.strictEqual(manifest.id, './biotron-settings-offline-beta')
assert.strictEqual(manifest.start_url, './#/biotron/play')
assert.strictEqual(manifest.display, 'standalone')
assert(manifest.icons.some(icon => icon.sizes === '192x192'))
assert(manifest.icons.some(icon => icon.sizes === '512x512'))

const serviceWorker = read('service-worker.js')
assert(serviceWorker.includes('precacheAndRoute'), 'Workbox precache is not enabled')
assert(serviceWorker.includes('index.html'), 'app shell is not precached')
assert(serviceWorker.includes('revision'), 'precache entries are not revisioned')
for (const icon of ['img/icons/icon-192x192.png', 'img/icons/icon-512x512.png']) {
  assert(serviceWorker.includes(icon), `${icon} is not in the precache manifest`)
}

const html = read('index.html')
const bundles = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1].replace(/^\//, ''))
assert(bundles.length > 0, 'no application bundles found in index.html')
for (const bundle of bundles) {
  assert(serviceWorker.includes(bundle), `${bundle} is not in the precache manifest`)
}

const javascript = bundles
  .filter(bundle => bundle.endsWith('.js'))
  .map(read)
  .join('\n')
const allJavascriptFiles = fs.readdirSync(path.join(root, 'js'))
  .filter(file => file.endsWith('.js'))
const allJavascript = allJavascriptFiles.map(file => read(path.join('js', file))).join('\n')
const biotronBundle = allJavascriptFiles.find(file => read(path.join('js', file)).includes('Release device for DAW'))
const soundBundle = allJavascriptFiles.find(file => read(path.join('js', file)).includes('Play your device'))
assert(javascript.includes('Ready offline'), 'the production UI has no truthful offline-readiness status')
assert(javascript.includes('Install offline app'), 'the production UI has no explicit PWA install action')
assert(javascript.includes('Biotron offline beta'), 'the production UI has no visible beta build identity')
assert(biotronBundle, 'the beta build does not include the Biotron DAW handoff')
assert(allJavascript.includes('Release device for DAW'), 'the Biotron lifecycle was not emitted into any route chunk')
assert(serviceWorker.includes(`js/${biotronBundle}`), 'the lazy Biotron settings chunk is not available offline')
assert(soundBundle, 'the beta build does not include the lazy sound lab')
assert(read(path.join('js', soundBundle)).includes('Clear Glass'), 'the sound lab does not include six sound variants')
assert(read(path.join('js', soundBundle)).includes('Meet Biotron'), 'the beta build has no Biotron first-play reveal')
assert(serviceWorker.includes(`js/${soundBundle}`), 'the sound lab chunk is not available offline')
const soundGzipBytes = zlib.gzipSync(fs.readFileSync(path.join(root, 'js', soundBundle))).length
assert(soundGzipBytes <= 25 * 1024, `sound lab exceeds its 25 KiB gzip budget: ${soundGzipBytes} bytes`)

console.log(`PWA build verified: ${bundles.length} app bundles, revisioned app shell, readiness UI, 2 install icons, sound lab ${soundGzipBytes} gzip bytes.`)

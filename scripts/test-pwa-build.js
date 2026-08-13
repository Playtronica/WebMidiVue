const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'dist')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

for (const file of ['index.html', 'manifest.json', 'service-worker.js']) {
  assert(fs.existsSync(path.join(root, file)), `${file} is missing from the production build`)
}

const manifest = JSON.parse(read('manifest.json'))
assert.strictEqual(manifest.start_url, './#/')
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

console.log(`PWA build verified: ${bundles.length} app bundles, revisioned app shell, 2 install icons.`)

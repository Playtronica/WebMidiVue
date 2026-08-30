const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'dist')
for (const file of ['service-worker.js', 'manifest.json']) {
  assert(!fs.existsSync(path.join(root, file)), `${file} leaked into the normal production build`)
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
assert(!/rel=["']manifest["']/i.test(html), 'PWA manifest link leaked into the normal production build')

const javascript = fs.readdirSync(path.join(root, 'js'))
  .filter(file => file.endsWith('.js'))
  .map(file => fs.readFileSync(path.join(root, 'js', file), 'utf8'))
  .join('\n')
assert(!javascript.includes('service-worker.js'), 'service-worker registration leaked into the normal production bundle')
assert(!javascript.includes('Release device for DAW'), 'beta MIDI lifecycle leaked into the normal production bundle')
assert(!javascript.includes('Play your device'), 'beta sound lab leaked into the normal production bundle')
assert(!javascript.includes('Meet Biotron'), 'beta first-play experience leaked into the normal production bundle')
assert(!javascript.includes('Clear Glass'), 'beta synth presets leaked into the normal production bundle')
assert(!javascript.includes('Compatibility check'), 'beta compatibility UI leaked into the normal production bundle')
assert(!javascript.includes('needs a computer'), 'beta device advice leaked into the normal production bundle')
assert(!javascript.includes('Step back and keep still'), 'beta calibration UX leaked into the normal production bundle')

console.log('Production isolation verified: normal build has no PWA, beta MIDI lifecycle, or sound lab.')

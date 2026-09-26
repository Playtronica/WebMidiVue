const assert = require('assert')
const fs = require('fs')
const path = require('path')

const read = file => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8')
const app = read('src/App.vue')
const taskNav = read('src/components/DeviceTaskNav.vue')
const biotron = read('src/components/BiotronPage/BiotronPageUpdated.vue')
const selector = read('src/components/MidiComponents/BiotronDeviceSelector.vue')
const sound = read('src/components/SoundLab/SoundLab.vue')

assert(app.includes("betaBuild ? 'Choose a device' : 'Devices'"),
  'top navigation must identify itself as a device chooser in beta')
assert(app.includes('<router-link to="/biotron"'),
  'the top-level Biotron destination must open its settings workspace')
assert(!app.includes('<router-link to="/sound"'),
  'Sound must not appear beside physical devices in the top-level menu')
assert(app.includes('mailto:manirko@playtronica.com'),
  'the beta must offer a direct feedback channel to Andrey')
assert(app.includes('What were you trying to make Biotron do?') &&
  app.includes('Where did you hesitate or get a result you did not expect?') &&
  app.includes('If we changed one thing before the next version, what should it be?'),
  'the beta feedback action must preserve the three research questions')
assert(app.includes('Nothing is sent automatically.'),
  'the feedback action must explain that opening an email does not send it')
assert(app.includes('More tools → Apps → Install this site as an app.'),
  'the beta must show the current Edge install path')
assert(taskNav.includes("{id: 'play', label: 'Play'"), 'device tasks must include Play')
assert(taskNav.includes("{id: 'settings', label: 'Settings'"), 'device tasks must include Settings')
assert(taskNav.includes(':aria-current="task.id === activeTask ? \'page\' : null"'),
  'the selected device task must be exposed accessibly')
assert(biotron.includes('active-task="settings"'), 'Biotron settings must show Settings as current')
assert(biotron.includes('biotron-settings-beta') && biotron.includes('Shape your Biotron') &&
  biotron.includes('Connect Biotron, then shape how it listens, plays, and responds.'),
  'the beta settings page must preserve the outcome-first visual hierarchy')
assert(biotron.includes("betaBuild ? 'preset-actions'"),
  'the beta preset actions must use the responsive action grid')
assert(biotron.includes('play-route="/biotron/play"'), 'Biotron settings must link directly to Play')
assert(biotron.includes('Calibrate plant again'), 'Biotron settings must expose explicit recalibration')
assert(biotron.includes('Input variation (experimental)') &&
  biotron.includes("It does not increase the sensor's measured sensitivity or control velocity."),
  'CC15 must describe the exact firmware behavior without a sensitivity claim')
assert(selector.includes('RECALIBRATE_COMMAND = 125'), 'Web and firmware recalibration command must stay aligned')
assert(selector.includes('123 is reserved for persisted-settings readback'), 'Settings readback ID must remain reserved')
assert(selector.includes('[0xf0, 0x14, 0x0d, RECALIBRATE_COMMAND, nonce, 0xf7]'),
  'recalibration must use the vendor SysEx command with a request nonce')
assert(selector.includes('data[1] === 0x0b'),
  'recalibration progress must require the device response envelope')
assert(sound.includes('active-task="play"'), 'Biotron first play must show Play as current')
assert(sound.includes("{{ revealExpanded ? 'Hide sounds' : 'Choose a sound' }}"),
  'sound choice action must use the same plain-language noun as the task')
assert(sound.includes('>Settings</router-link>'),
  'first play must offer the same Settings label as the task navigation')

console.log('Navigation contract verified: devices are global; Play and Settings are device-level tasks.')

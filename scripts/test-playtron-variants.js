const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const read = path => fs.readFileSync(path, 'utf8')
const evaluate = (source, context, names) => {
  vm.runInNewContext(source.replace(/^import .*$/gm, '').replace(/^export /gm, '') +
    `\nmodule.exports = {${names.join(', ')}}`, context)
  return context.module.exports
}

const commandsContext = {module: {exports: {}}, console: {log() {}}}
const {SysExCommand} = evaluate(read('src/assets/js/SysExCommand.js'), commandsContext, ['SysExCommand'])
class FakeDb {
  constructor(commands) { this.commands = commands }
  async initialize(seed) { this.seed = seed; return true }
  async getPatch(id) {
    const patch = {id: 1, saved: false, data: this.seed[0].data}
    return id ? patch : [patch]
  }
  async updatePatch(id, data) { this.lastSaved = {id, data} }
}
const dbContext = {module: {exports: {}}, Db: FakeDb, SysExCommand, Map}
const {PlaytronCommandsData, PlaytronDb} = evaluate(read('src/components/PlaytronPage/PlaytronIDB.js'),
  dbContext, ['PlaytronCommandsData', 'PlaytronDb'])

const main = read('src/main.js')
for (const route of ['/playtron', '/playtron/test']) {
  const line = main.split('\n').find(value => value.includes(`path: '${route}'`))
  assert(line?.includes('id: "PlaytronWebMidiId"'), `${route} lost its preset namespace`)
  assert(line.includes(`showChords: ${route.endsWith('/test')}`), `${route} lost its variant prop`)
}
const db = new PlaytronDb()
assert.equal(db.DB_NAME, 'PlaytronDB')
assert.equal(db.STORE_NAME, 'Playtron_Patches')
assert.equal(db.VERSION, 6)

assert(!fs.existsSync('src/components/PlaytronPage/PlaytronPageRelease.vue'))
assert(!fs.existsSync('src/components/PlaytronPage/PlaytronPageTest.vue'))

const variants = [
  {route: '/playtron', file: 'src/components/PlaytronPage/PlaytronPage.vue', chords: false},
  {route: '/playtron/test', file: 'src/components/PlaytronPage/PlaytronPage.vue', chords: true}
]

async function characterize({route, file, chords}) {
  const source = read(file)
  const template = source.slice(0, source.indexOf('<script>'))
  assert(template.includes('Chords Mode') && template.includes('<GroupOfCommands v-if="showChords">'),
    `${route} Chords control lost its variant gate`)
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  const savedFiles = []
  const storage = new Map()
  const localStorage = {
    getItem(key) { return storage.get(key) ?? null },
    setItem(key, value) { storage.set(key, String(value)) }
  }
  const context = {
    module: {exports: {}}, PlaytronCommandsData, PlaytronDb, localStorage,
    PatchSelector: {}, DeviceSelector: {}, LoaderComponent: {}, GroupOfCommands: {},
    SliderCommand: {}, FileDropArea: {}, UpdateFirmwareComponent: {}, BootstrapCollapse: {},
    SelectCommand: {}, createListenerScope() {}, withMidiWriteSession() {},
    withPresetFeedback: (_id, _action, work) => work(),
    saveAs(file, name) { savedFiles.push({file, name}) },
    File: class { constructor(parts, name) { this.parts = parts; this.name = name } }
  }
  vm.runInNewContext(script.replace(/^import .*$/gm, '').replace('export default', 'module.exports ='), context)
  const page = context.module.exports
  assert.equal(page.props.showChords.default, false)
  const target = {...page.data(), id: 'PlaytronWebMidiId', showChords: chords}
  for (const [name, method] of Object.entries(page.methods)) target[name] = method.bind(target)
  await page.created.call(target)
  assert.equal(storage.get('PlaytronWebMidiId'), '1')
  assert.equal(target.commands_data.channel.value, 1)
  assert.equal(target.commands_data.chord_mode.value, 0)
  assert.equal(target.commands_data.Note_C3.value, 60)

  const sent = [], waits = []
  await target.sendData({send: bytes => sent.push(Array.from(bytes)), wait: ms => { waits.push(ms); return Promise.resolve() }})
  const frame = [240, 11, 20, 13, 126, 247]
  const expected = [frame, [240, 20, 13, 127, 0, 247], [240, 20, 13, 1, 0, 247],
    ...Array.from({length: 16}, (_, index) => [240, 20, 13, 0, index, 60 + index, 247]), frame]
  assert.deepEqual(sent, expected, `${route} MIDI wire bytes changed`)
  assert.deepEqual(waits, Array(20).fill(100), `${route} released MIDI pacing changed`)

  target.commands_data.channel.set_value(5)
  await target.saveData()
  assert.equal(target.db.lastSaved.id, '1')
  assert.equal(target.db.lastSaved.data.channel, 5)
  await target.loadDataFromPreset(JSON.stringify({commands: [
    {name: 'channel', value: 3}, {name: 'chord_mode', value: 2}
  ]}))
  assert.equal(target.db.lastSaved.data.channel, 3)
  assert.equal(target.db.lastSaved.data.chord_mode, 2)
  target.createPreset()
  assert.equal(savedFiles[0].name, 'playtron-preset.txt')
  const savedCommands = JSON.parse(savedFiles[0].file.parts[0]).commands
  assert(savedCommands.some(command => command.name === 'channel' && command.value === 3))
  assert(savedCommands.some(command => command.name === 'chord_mode' && command.value === 2))
}

;(async () => {
  for (const variant of variants) await characterize(variant)
  console.log('Playtron routes characterized: Chords visibility, shared preset identity, load/save and exact MIDI bytes/100 ms pacing.')
})().catch(error => { console.error(error); process.exitCode = 1 })

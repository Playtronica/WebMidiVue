const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const read = file => fs.readFileSync(file, 'utf8')
const evaluate = (source, context, names) => {
  vm.runInNewContext(source.replace(/^import .*$/gm, '').replace(/^export /gm, '') +
    `\nmodule.exports = {${names.join(', ')}}`, context)
  return context.module.exports
}
const {div, SysExCommand} = evaluate(read('src/assets/js/SysExCommand.js'),
  {module: {exports: {}}, console: {log() {}}}, ['div', 'SysExCommand'])
class FakeDb {
  async initialize(seed) { this.seed = seed; return true }
  async getPatch(id) { const patch = {id: 1, saved: false, data: this.seed[0].data}; return id ? patch : [patch] }
  async updatePatch(id, data) { this.lastSaved = {id, data} }
}
const {ScalesCommandsData, ScalesDb} = evaluate(read('src/components/ScalesPage/ScalesIDB.js'),
  {module: {exports: {}}, Db: FakeDb, div, SysExCommand, Map}, ['ScalesCommandsData', 'ScalesDb'])
const variants = [
  {route: '/scales', file: 'src/components/ScalesPage/ScalesPage.vue', extra: true},
  {route: '/scales/test', file: 'src/components/ScalesPage/ScalesPage.vue', extra: false}
]
const expected = [
  [240, 11, 20, 13, 126, 247],
  [240, 20, 13, 0, 120, 247], [240, 20, 13, 1, 0, 247],
  [240, 20, 13, 2, 0, 64, 127, 247], [240, 20, 13, 4, 0, 247],
  [240, 20, 13, 5, 0, 247], [240, 20, 13, 6, 0, 247],
  [240, 20, 13, 7, 0, 247], [240, 20, 13, 8, 90, 247],
  [240, 11, 20, 13, 126, 247]
]
async function characterize({route, file, extra}) {
  const source = read(file)
  assert(source.includes('<BootstrapCollapse v-if="showExtraControls" name_of_collapse="Extra">'))
  const routeLine = read('src/main.js').split('\n').find(line => line.includes(`path: '${route}'`))
  assert(routeLine?.includes(`showExtraControls: ${extra}`), `${route} lost its variant prop`)
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  const savedFiles = [], storage = new Map()
  const localStorage = {
    getItem(key) { return storage.get(key) ?? null },
    setItem(key, value) { storage.set(key, String(value)) }
  }
  const context = {module: {exports: {}}, ScalesCommandsData, ScalesDb, localStorage,
    FileDropArea: {}, GroupOfCommands: {}, PatchSelector: {}, DeviceSelector: {},
    UpdateFirmwareComponent: {}, LoaderComponent: {}, BootstrapCollapse: {},
    SliderCommand: {}, SelectCommand: {}, ColorPicker: {}, SwitchComponent: {},
    createListenerScope() {}, withMidiWriteSession() {},
    withPresetFeedback: (_id, _action, work) => work(),
    saveAs(file, name) { savedFiles.push({file, name}) },
    File: class { constructor(parts, name) { this.parts = parts; this.name = name } }
  }
  vm.runInNewContext(script.replace(/^import .*$/gm, '').replace('export default', 'module.exports ='), context)
  const page = context.module.exports
  assert.equal(page.props.showExtraControls.default, false)
  const target = {...page.data(), id: 'ScalesWebMidiId_1', showExtraControls: extra}
  for (const [name, method] of Object.entries(page.methods)) target[name] = method.bind(target)
  await page.created.call(target)
  assert.equal(storage.get('ScalesWebMidiId_1'), '1')
  assert.equal(target.commands_data.bpm.value, 120)
  assert.equal(target.commands_data.music_cc_num.value, 90)
  const sent = [], waits = []
  await target.sendData({send: bytes => sent.push(Array.from(bytes)), wait: ms => {waits.push(ms); return Promise.resolve()}})
  assert.deepEqual(sent, expected, `${route} MIDI wire bytes changed`)
  assert.deepEqual(waits, Array(12).fill(100), `${route} MIDI pacing changed`)
  target.commands_data.bpm.set_value(140)
  await target.saveData()
  assert.equal(target.db.lastSaved.id, '1')
  assert.equal(target.db.lastSaved.data.bpm, 140)
  await target.loadDataFromPreset(JSON.stringify({commands: [{name: 'bpm', value: 160}]}))
  assert.equal(target.db.lastSaved.data.bpm, 160)
  target.createPreset()
  assert.equal(savedFiles[0].name, 'scales-preset.txt')
  assert(JSON.parse(savedFiles[0].file.parts[0]).commands.some(command => command.name === 'bpm' && command.value === 160))
}
;(async () => {
  const db = new ScalesDb()
  assert.equal(db.DB_NAME, 'ScaleDB')
  assert.equal(db.STORE_NAME, 'Scale_Patches')
  assert.equal(db.VERSION, 12)
  assert(!fs.existsSync('src/components/ScalesPage/ScalesPageTest.vue'))
  for (const variant of variants) await characterize(variant)
  console.log('Scales variants characterized: Extra controls, preset identity/defaults/load/save, MIDI bytes and pacing.')
})().catch(error => {console.error(error); process.exitCode = 1})

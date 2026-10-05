const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const {createHash} = require('node:crypto')
const read = file => fs.readFileSync(file, 'utf8')
const evaluate = (source, context, names) => {
  vm.runInNewContext(source.replace(/^import .*$/gm, '').replace(/^export /gm, '') +
    `\nmodule.exports = {${names.join(', ')}}`, context)
  return context.module.exports
}
const {div, SysExCommand} = evaluate(read('src/assets/js/SysExCommand.js'),
  {module: {exports: {}}, console: {log() {}}}, ['div', 'SysExCommand'])
class FakeDb {
  async initialize(seed) {this.seed = seed; return true}
  async getPatch(id) {const patch = {id: 1, saved: false, data: this.seed[0].data}; return id ? patch : [patch]}
  async updatePatch(id, data) {this.lastSaved = {id, data}}
}
const {TouchMeCommandsData, TouchMeDb} = evaluate(read('src/components/TouchMePage/TouchMeIDB.js'),
  {module: {exports: {}}, Db: FakeDb, div, SysExCommand, Map}, ['TouchMeCommandsData', 'TouchMeDb'])
const variants = [
  {route: '/touchme', file: 'src/components/TouchMePage/TouchMePage.vue', modes: false},
  {route: '/touchme/test', file: 'src/components/TouchMePage/TouchMePage.vue', modes: true}
]
async function characterize({route, file, modes}) {
  const source = read(file)
  assert(source.includes('<SelectCommand v-if="showPagedModes"'))
  assert(source.includes('<SelectCommand v-else'))
  const routeLine = read('src/main.js').split('\n').find(line => line.includes(`path: '${route}'`))
  assert(routeLine?.includes(`showPagedModes: ${modes}`), `${route} lost its variant prop`)
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  const savedFiles = [], storage = new Map()
  const localStorage = {getItem(key) {return storage.get(key) ?? null}, setItem(key, value) {storage.set(key, String(value))}}
  const context = {module: {exports: {}}, TouchMeCommandsData, TouchMeDb, localStorage,
    SelectCommand: {}, GroupOfCommands: {}, DeviceSelector: {}, SliderCommand: {},
    FileDropArea: {}, SwitchComponent: {}, SliderRangeCommand: {}, PatchSelector: {},
    UpdateFirmwareComponent: {}, LoaderComponent: {}, BootstrapCollapse: {},
    createListenerScope() {}, withMidiWriteSession() {}, console: {log() {}},
    withPresetFeedback: (_id, _action, work) => work(),
    saveAs(file, name) {savedFiles.push({file, name})},
    File: class {constructor(parts, name) {this.parts = parts; this.name = name}}
  }
  vm.runInNewContext(script.replace(/^import .*$/gm, '').replace('export default', 'module.exports ='), context)
  const page = context.module.exports
  assert.equal(page.props.showPagedModes.default, false)
  const target = {...page.data(), id: 'TouchmeWebMidiId_2', showPagedModes: modes}
  for (const [name, method] of Object.entries(page.methods)) target[name] = method.bind(target)
  for (const [name, method] of Object.entries(page.computed || {})) Object.defineProperty(target, name, {get: method.bind(target)})
  await page.created.call(target)
  assert.equal(storage.get('TouchmeWebMidiId_2'), '1')
  assert.equal(target.commands_data.Key.value, 8)
  assert.equal(target.commands_data.PlayMode.value, 0)
  const sent = [], waits = []
  await target.sendData({send: bytes => sent.push(Array.from(bytes)), wait: ms => {waits.push(ms); return Promise.resolve()}})
  const digest = createHash('sha256').update(JSON.stringify(sent)).digest('hex')
  assert.equal(digest, 'eca78aaf95c851006d147173db2c867db73b295b9b66576f3eca7f50225400cb', `${route} MIDI wire bytes changed`)
  assert.equal(sent.length, 28)
  assert.deepEqual(waits, Array(TouchMeCommandsData.size).fill(100))
  assert.deepEqual(sent[0], [240, 20, 13, 0, 0, 247])
  assert.equal(target.db.lastSaved.id, '1')
  if (modes) {
    target.commands_data.play_mode_page.set_value(1)
    await target.play_mode_page_changed(target.commands_data.play_mode_page)
    assert.equal(target.commands_data.PlayMode.value, 12)
    assert.equal(target.modes_on_page[12], 'Major Chord')
  }
  await target.loadDataFromPreset(JSON.stringify({commands: [{name: 'Key', value: 9}]}))
  assert.equal(target.db.lastSaved.data.Key, 9)
  await target.createPreset()
  assert.equal(savedFiles[0].name, 'touchme-preset.txt')
  assert(JSON.parse(savedFiles[0].file.parts[0]).commands.some(command => command.name === 'Key' && command.value === 9))
}
;(async () => {
  const db = new TouchMeDb()
  assert.equal(db.DB_NAME, 'TouchMeDB'); assert.equal(db.STORE_NAME, 'TouchMe_Patches'); assert.equal(db.VERSION, 11)
  assert(!fs.existsSync('src/components/TouchMePage/TouchMePageRelease.vue'))
  assert(!fs.existsSync('src/components/TouchMePage/TouchMePageTest.vue'))
  for (const variant of variants) await characterize(variant)
  console.log('TouchMe variants characterized: mode controls, shared preset identity, load/save and exact MIDI bytes/100 ms pacing.')
})().catch(error => {console.error(error); process.exitCode = 1})

const assert = require('assert')
const babel = require('@babel/core')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.resolve(__dirname, '..')
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'test-contracts/device-matrix.json'), 'utf8'))
const moduleCache = new Map()

function resolveModule(request, parent) {
  if (request === 'vue') return request
  if (request.startsWith('@/')) return path.join(root, 'src', request.slice(2))
  if (request.startsWith('.')) return path.resolve(path.dirname(parent), request)
  return request
}

function loadModule(filename) {
  if (filename === 'vue') return {toRaw: value => value}
  const withExtension = path.extname(filename) ? filename : `${filename}.js`
  if (!withExtension.startsWith(root)) return require(withExtension)
  if (moduleCache.has(withExtension)) return moduleCache.get(withExtension).exports

  const source = fs.readFileSync(withExtension, 'utf8')
  const compiled = babel.transformSync(source, {
    filename: withExtension,
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs']
  }).code
  const module = {exports: {}}
  moduleCache.set(withExtension, module)
  const context = {
    module,
    exports: module.exports,
    require: request => loadModule(resolveModule(request, withExtension)),
    console: {log() {}, error() {}},
    window: {},
    setTimeout,
    clearTimeout
  }
  vm.runInNewContext(compiled, context, {filename: withExtension})
  return module.exports
}

function commandReferences(component) {
  const source = fs.readFileSync(path.join(root, component), 'utf8')
  const keys = new Set()
  const pattern = /commands_data(?:\[['"]([A-Za-z0-9_]+)['"]\]|\.([A-Za-z0-9_]+))/g
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    keys.add(match[1] || match[2])
  }
  return keys
}

function assertMidiBytes(device, key, command) {
  assert.strictEqual(command.name, key, `${device.id}.${key}: command name drift`)
  assert(Number.isFinite(command.min_value), `${device.id}.${key}: min_value is not finite`)
  assert(Number.isFinite(command.max_value), `${device.id}.${key}: max_value is not finite`)
  assert(command.min_value <= command.max_value, `${device.id}.${key}: invalid range`)
  assert(Number.isFinite(command.step) && command.step > 0, `${device.id}.${key}: invalid step`)

  for (const value of new Set([
    command.min_value,
    Math.floor((command.min_value + command.max_value) / 2),
    command.max_value
  ])) {
    const sent = []
    command.set_value(value)
    command.sendToMidi({send: message => sent.push(Array.from(message))})
    if (!command.sendable) {
      assert.deepStrictEqual(sent, [], `${device.id}.${key}: sendable=false emitted MIDI`)
      continue
    }
    assert.strictEqual(sent.length, 1, `${device.id}.${key}: valid value did not emit once`)
    const message = sent[0]
    assert.deepStrictEqual(message.slice(0, 3), [0xF0, 20, 13], `${device.id}.${key}: bad SysEx prefix`)
    assert.strictEqual(message.at(-1), 0xF7, `${device.id}.${key}: missing SysEx terminator`)
    for (const byte of message.slice(1, -1)) {
      assert(Number.isInteger(byte) && byte >= 0 && byte <= 0x7F,
        `${device.id}.${key}: non-7-bit data byte ${byte}`)
    }
  }

  for (const value of [command.min_value - 1, command.max_value + 1]) {
    const sent = []
    command.set_value(value)
    command.sendToMidi({send: message => sent.push(message)})
    assert.deepStrictEqual(sent, [], `${device.id}.${key}: out-of-range value was sent`)
  }
}

assert.strictEqual(matrix.schema_version, 1)
assert(matrix.devices.length >= 5, 'all Settings devices must be declared')
const deviceIds = matrix.devices.map(device => device.id)
assert.strictEqual(new Set(deviceIds).size, deviceIds.length, 'duplicate device id')
const allRoutes = []
const mainSource = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8')

for (const device of matrix.devices) {
  assert(device.firmware_repo, `${device.id}: missing firmware repository`)
  assert(device.capabilities.includes('connect'), `${device.id}: connect capability missing`)
  assert(device.capabilities.includes('settings-write'), `${device.id}: settings-write capability missing`)
  assert(device.routes.includes(device.primary_route), `${device.id}: primary route not declared`)
  allRoutes.push(...device.routes)

  for (const route of device.routes) {
    assert(mainSource.includes(`path: '${route}'`) || mainSource.includes(`path: "${route}"`),
      `${device.id}: router no longer exposes ${route}`)
  }
  for (const component of device.components) {
    assert(fs.existsSync(path.join(root, component)), `${device.id}: missing ${component}`)
  }

  const exports = loadModule(path.join(root, device.command_module))
  const commands = exports[device.command_export]
  assert(commands && typeof commands.entries === 'function' && Number.isInteger(commands.size),
    `${device.id}: ${device.command_export} is not a Map-like registry`)
  assert.strictEqual(commands.size, device.expected_command_count,
    `${device.id}: command count changed; update firmware/web contract deliberately`)

  const referenced = new Set()
  for (const component of device.components) {
    for (const key of commandReferences(component)) referenced.add(key)
  }
  for (const key of referenced) {
    assert(commands.has(key), `${device.id}: UI references unknown command ${key}`)
  }
  const dynamicPrefixes = device.dynamic_ui_prefixes || []
  for (const key of commands.keys()) {
    assert(referenced.has(key) || dynamicPrefixes.some(prefix => key.startsWith(prefix)),
      `${device.id}: command ${key} has no Settings UI reference or declared dynamic binding`)
  }
  for (const [key, command] of commands) assertMidiBytes(device, key, command)
}

for (const tool of matrix.tools.filter(tool => tool.route)) {
  allRoutes.push(tool.route)
  assert(fs.existsSync(path.join(root, tool.component)), `${tool.id}: missing component`)
  assert(mainSource.includes(`path: '${tool.route}'`) || mainSource.includes(`path: "${tool.route}"`),
    `${tool.id}: router no longer exposes ${tool.route}`)
}
assert.strictEqual(new Set(allRoutes).size, allRoutes.length, 'a route belongs to more than one surface')

console.log(`All-device contract verified: ${matrix.devices.length} devices, ${allRoutes.length} routes, ${matrix.devices.reduce((sum, device) => sum + device.expected_command_count, 0)} command codecs.`)

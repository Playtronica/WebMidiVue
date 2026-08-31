import assert from 'node:assert/strict'
import test from 'node:test'
import {createListenerScope} from '../src/assets/js/ListenerScope.mjs'

class FakeTarget {
  listeners = new Map()
  addEventListener(type, listener) {
    const group = this.listeners.get(type) || new Set()
    group.add(listener)
    this.listeners.set(type, group)
  }
  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener)
  }
  emit(type) {
    for (const listener of this.listeners.get(type) || []) listener()
  }
}

test('listener scope removes every registered callback exactly once', () => {
  const target = new FakeTarget()
  const scope = createListenerScope()
  let calls = 0
  scope.on(target, 'change', () => calls++)
  scope.on(target, 'change', () => calls++)
  target.emit('change')
  assert.equal(calls, 2)

  scope.clear()
  scope.clear()
  target.emit('change')
  assert.equal(calls, 2)
  assert.throws(() => scope.on(target, 'change', () => {}), /disposed/)
})

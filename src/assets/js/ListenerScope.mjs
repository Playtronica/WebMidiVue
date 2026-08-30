export function createListenerScope() {
  const listeners = []
  let disposed = false

  return {
    on(target, type, listener, options) {
      if (disposed) throw new Error('Listener scope is already disposed')
      target.addEventListener(type, listener, options)
      listeners.push({target, type, listener, options})
      return listener
    },
    clear() {
      disposed = true
      for (const {target, type, listener, options} of listeners.splice(0)) {
        target.removeEventListener(type, listener, options)
      }
    }
  }
}

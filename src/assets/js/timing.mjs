export function delay(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return Promise.reject(new RangeError('Delay must be a non-negative finite number'))
  }
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

class MidiWriteCancelled extends Error {}

export async function withMidiWriteSession(device, getCurrentDevice, write) {
  const isActive = () => Boolean(
    device &&
    getCurrentDevice() === device &&
    device.state !== 'disconnected' &&
    device.connection !== 'closed'
  )
  const assertActive = () => {
    if (!isActive()) throw new MidiWriteCancelled()
  }
  const output = {
    send(message) {
      assertActive()
      device.send(message)
    },
    async wait(milliseconds) {
      assertActive()
      await delay(milliseconds)
      assertActive()
    }
  }

  try {
    assertActive()
    await write(output)
    return true
  } catch (error) {
    if (error instanceof MidiWriteCancelled) return false
    throw error
  }
}

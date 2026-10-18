// MIDI DIN daisy-chain: devices are addressed by the second key byte, F0 14 (0D + N) <cmd> ... F7,
// where N is the distance from the device connected over USB (0 = master).
export const KEY_FIRST = 0x14
export const KEY_SECOND = 0x0D
export const CHAIN_LENGTH_COMMAND = 11

// Only the device that got the request is linked to an input, other USB devices are ignored
const LINK_TIMEOUT_MS = 1000

export function chainFlag(target) {
    return [KEY_FIRST, KEY_SECOND + target]
}

export class MidiChainTracker {
    output = null
    inputId = null
    length = 1
    linkUntil = 0
    midi = null
    listenedInputs = new Set()

    constructor(onLengthChanged) {
        this.onLengthChanged = onLengthChanged
        this.messageHandler = (event) => this.handleMessage(event)
        this.stateHandler = () => this.attachInputs()
    }

    async start() {
        this.midi = await navigator.requestMIDIAccess({sysex: true})
        this.midi.addEventListener("statechange", this.stateHandler)
        this.attachInputs()
        this.request()
    }

    stop() {
        if (!this.midi) return
        this.midi.removeEventListener("statechange", this.stateHandler)
        for (const input of this.midi.inputs.values()) {
            input.removeEventListener("midimessage", this.messageHandler)
        }
        this.listenedInputs.clear()
    }

    attachInputs() {
        if (!this.midi) return
        for (const input of this.midi.inputs.values()) {
            if (this.listenedInputs.has(input.id)) continue
            input.addEventListener("midimessage", this.messageHandler)
            this.listenedInputs.add(input.id)
        }
        // Linked input is gone - the device was unplugged
        if (this.inputId !== null) {
            const input = this.midi.inputs.get(this.inputId)
            if (!input || input.state !== "connected") {
                this.inputId = null
                this.setLength(1)
            }
        }
    }

    setOutput(output) {
        // DeviceSelector re-emits the same device on every port state change, don't ask again
        if (output && this.output && output.id === this.output.id && this.inputId !== null) return

        this.output = output || null
        this.inputId = null
        this.setLength(1)
        this.request()
    }

    // Each request makes the firmware save settings to flash, so it is sent only on device change
    request() {
        if (!this.output || !this.midi) return
        this.linkUntil = Date.now() + LINK_TIMEOUT_MS
        this.output.send([0xF0, KEY_FIRST, KEY_SECOND, CHAIN_LENGTH_COMMAND, 0xF7])
    }

    // Answer and change notification: F0 14 0D 0B <n> F7
    handleMessage(event) {
        const data = event.data
        if (data.length !== 6 ||
            data[0] !== 0xF0 ||
            data[1] !== KEY_FIRST ||
            data[2] !== KEY_SECOND ||
            data[3] !== CHAIN_LENGTH_COMMAND ||
            data[5] !== 0xF7) return

        const inputId = event.target.id
        if (this.inputId === null) {
            if (Date.now() > this.linkUntil) return
            this.inputId = inputId
        } else if (inputId !== this.inputId) {
            return
        }

        this.setLength(Math.max(1, data[4]))
    }

    setLength(length) {
        if (length === this.length) return
        this.length = length
        this.onLengthChanged(length)
    }
}

// Settings by id (PLSDK/settings.h): requests F0 14 (0D + N) <cmd> <req> ... F7,
// every device of the chain answers with the same raised key on USB MIDI cable 1.
import { KEY_FIRST, KEY_SECOND } from "@/assets/js/MidiChain"

const REQ_ALL = 0x60
const REQ_GET = 0x61
const REQ_SET = 0x62
const REQ_STATE = 0x63
const REQ_SAVE = 0x64
const REQ_ACTION = 0x65

const ANS_VALUE = 0x68
const ANS_CHANGED = 0x69
const ANS_STATE = 0x6A
const ANS_ACTION = 0x6B

export const SETTING_STATUS = ["OK", "unknown id", "wrong length", "out of range", "can't be set"]
export const ACTIONS = {reboot: 0, bootloader: 1, factoryReset: 2, eraseToBootloader: 3}

// Lowest protocol version this page knows
const MIN_VERSION = 1
// Old firmware doesn't answer the probe, then the old commands are used.
// After a page reload the device can be busy (the chain length request saves settings to flash),
// so the probe is repeated a few times
const PROBE_TIMEOUT_MS = 500
const PROBE_ATTEMPTS = 4
const ANSWER_TIMEOUT_MS = 500
// Answers to request 60 come one per main loop pass, the timer restarts on each of them
const ALL_ANSWER_TIMEOUT_MS = 1000

// Unsigned value -> 7-bit groups, lowest first
export function toGroups(value, groups) {
    const result = []
    for (let i = 0; i < groups; i++) {
        result.push(value % 128)
        value = Math.floor(value / 128)
    }
    return result
}

export function fromGroups(data, offset, groups) {
    let value = 0
    for (let i = groups - 1; i >= 0; i--) {
        value = value * 128 + data[offset + i]
    }
    return value
}

// Setting description: {id, groups, toDevice?: value => elements, fromDevice?: elements => value}
export function encodeSetting(setting, value) {
    const elements = setting.toDevice ? setting.toDevice(value) : [value]
    return elements.flatMap((element) => toGroups(element, setting.groups))
}

export function decodeSetting(setting, data) {
    const elements = []
    for (let offset = 0; offset + setting.groups <= data.length; offset += setting.groups) {
        elements.push(fromGroups(data, offset, setting.groups))
    }
    return setting.fromDevice ? setting.fromDevice(elements) : elements[0]
}

export class SettingsProtocol {
    midi = null
    output = null
    active = false
    version = 0
    count = 0
    nextReq = 0
    probeToken = 0
    probing = false
    // `${keySecond}:${req}` -> {resolve, timer, timeout, values}, values is null unless answers are collected
    pending = new Map()
    // Inputs that answered requests to the selected output, CHANGED of other USB devices is skipped
    deviceInputs = new Set()
    listenedInputs = new Set()

    constructor(onActiveChanged, onChanged = null) {
        this.onActiveChanged = onActiveChanged
        this.onChanged = onChanged
        this.messageHandler = (event) => this.handleMessage(event)
        this.stateHandler = () => {
            this.attachInputs()
            // A port opened later (after a reload inputs open one by one) - the device may answer now
            if (this.output && !this.active && !this.probing) this.probe()
        }
    }

    start() {
        this.ready = navigator.requestMIDIAccess({sysex: true}).then((midi) => {
            this.midi = midi
            this.midi.addEventListener("statechange", this.stateHandler)
            return this.attachInputs()
        })
        return this.ready
    }

    stop() {
        this.probeToken++
        for (const request of this.pending.values()) {
            clearTimeout(request.timer)
            request.resolve(null)
        }
        this.pending.clear()
        if (!this.midi) return
        this.midi.removeEventListener("statechange", this.stateHandler)
        for (const input of this.midi.inputs.values()) {
            input.removeEventListener("midimessage", this.messageHandler)
        }
        this.listenedInputs.clear()
    }

    // Answers come on cable 1, which is a separate input port, so every input is listened to.
    // Inputs are opened explicitly: after a reload they are closed and an answer sent before the open is lost
    attachInputs() {
        if (!this.midi) return Promise.resolve()
        const opening = []
        for (const input of this.midi.inputs.values()) {
            if (this.listenedInputs.has(input.id)) continue
            input.addEventListener("midimessage", this.messageHandler)
            this.listenedInputs.add(input.id)
            opening.push(input.open().catch((err) => console.warn("MIDI input is not opened", err)))
        }
        return Promise.all(opening)
    }

    setOutput(output) {
        // DeviceSelector re-emits the same device on every port state change, the probe isn't restarted then
        if (output && this.output && output.id === this.output.id && (this.active || this.probing)) return

        this.output = output || null
        this.deviceInputs.clear()
        this.probeToken++
        this.probing = false
        this.setActive(false)
        if (this.output) this.probe()
    }

    async probe() {
        const token = ++this.probeToken
        this.probing = true
        await this.ready

        let state = null
        for (let attempt = 0; attempt < PROBE_ATTEMPTS && !state; attempt++) {
            state = await this.state([KEY_FIRST, KEY_SECOND], PROBE_TIMEOUT_MS)
            if (token !== this.probeToken) return
        }

        this.probing = false
        this.version = state ? state.version : 0
        this.count = state ? state.count : 0
        this.setActive(!!state && state.version >= MIN_VERSION)
    }

    setActive(active) {
        if (active === this.active) return
        this.active = active
        this.onActiveChanged(active)
    }

    // Resolves with the parsed answer, or with null when there is no answer in time
    request(flag, command, body = [], timeout = ANSWER_TIMEOUT_MS, collect = false) {
        if (!this.output) return Promise.resolve(null)

        const req = this.nextReq
        this.nextReq = (this.nextReq + 1) % 128
        const key = `${flag[1]}:${req}`

        return new Promise((resolve) => {
            const request = {resolve, timeout, values: collect ? [] : null}
            request.timer = setTimeout(() => this.finish(key, null), timeout)
            this.pending.set(key, request)
            this.output.send([0xF0, ...flag, command, req, ...body, 0xF7])
        })
    }

    finish(key, answer) {
        const request = this.pending.get(key)
        if (!request) return
        clearTimeout(request.timer)
        this.pending.delete(key)
        request.resolve(answer)
    }

    // {values: [VALUE...], state: STATE}
    getAll(flag) {
        return this.request(flag, REQ_ALL, [], ALL_ANSWER_TIMEOUT_MS, true)
    }

    // VALUE: {status, id, value: [groups...]}
    get(flag, id) {
        return this.request(flag, REQ_GET, [id])
    }

    set(flag, id, value) {
        return this.request(flag, REQ_SET, [id, ...value])
    }

    // STATE: {version, count, generation, dirty}
    state(flag, timeout = ANSWER_TIMEOUT_MS) {
        return this.request(flag, REQ_STATE, [], timeout)
    }

    save(flag) {
        return this.request(flag, REQ_SAVE)
    }

    // ACTION: {status, action}
    action(flag, action) {
        return this.request(flag, REQ_ACTION, [action])
    }

    handleMessage(event) {
        const data = event.data
        if (data.length < 6 ||
            data[0] !== 0xF0 ||
            data[1] !== KEY_FIRST ||
            data[2] < KEY_SECOND ||
            data[data.length - 1] !== 0xF7) return

        const command = data[3]
        if (command === ANS_CHANGED) {
            if (this.onChanged && this.active && this.deviceInputs.has(event.target.id)) {
                this.onChanged(data[2] - KEY_SECOND, data[4], Array.from(data.slice(5, -1)))
            }
            return
        }

        const key = `${data[2]}:${data[4]}`
        const request = this.pending.get(key)
        if (!request) return
        this.deviceInputs.add(event.target.id)

        if (command === ANS_VALUE && data.length >= 8) {
            const value = {status: data[5], id: data[6], value: Array.from(data.slice(7, -1))}
            if (request.values) {
                request.values.push(value)
                clearTimeout(request.timer)
                request.timer = setTimeout(() => this.finish(key, null), request.timeout)
            } else {
                this.finish(key, value)
            }
        } else if (command === ANS_STATE && data.length >= 14) {
            const state = {
                version: data[5],
                count: data[6],
                generation: fromGroups(data, 7, 5),
                dirty: data[12] === 1,
            }
            this.finish(key, request.values ? {values: request.values, state} : state)
        } else if (command === ANS_ACTION && data.length >= 8) {
            this.finish(key, {status: data[5], action: data[6]})
        }
    }
}

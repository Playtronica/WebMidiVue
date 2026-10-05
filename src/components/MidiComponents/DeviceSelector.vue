<template>
  <div class="form-floating mb-3">
    <select id="midi-device" v-model="currentMidiNum" class="form-control" @change="this.deviceChanged">
      <option v-for="(value, key) in midiOut" v-bind:key="key" :value="key" >{{value.name}} {{this.versions[key]}}</option>
    </select>
    <label for="midi-device">{{ this.text_label }}</label>
  </div>
</template>

<script>
  export default {
    props: {
      regexName: {
        default: ".*",
        type: String
      },
      checkVersionsFlag: {
        default: false,
        type: Boolean
      },
      text_label: {
        default: "Select device",
        type: String,
      },
    },
    emits: ["device_changed"],
    name: "DeviceSelector",
    data() {
      return {
        midiIn: {},
        midiOut: {},
        versions: {},
        currentMidiNum: 0,
        midiAccess: null,
        versionTimeouts: [],
        stateHandler: null,
        messageHandler: null,
        refreshId: 0,
        disposed: false
      }
    },
    methods: {
      async midiReady(midi) {
        if (this.disposed) return
        if (this.midiAccess?.onstatechange === this.stateHandler) this.midiAccess.onstatechange = null
        this.midiAccess = midi
        this.stateHandler = (event) => {
          if (this.disposed) return
          this.initDevices(event.target).catch(error => console.log('Could not refresh MIDI devices', error))
        };
        midi.onstatechange = this.stateHandler
        await this.initDevices(midi);
      },
      releaseInputs() {
        for (const input of Object.values(this.midiIn)) {
          if (input.onmidimessage === this.messageHandler) input.onmidimessage = null
        }
      },
      async closeOutput(output) {
        try { await output.close?.() }
        catch (error) { console.log('Could not close MIDI output', error) }
      },
      async initDevices(midi) {
        if (this.disposed) return
        const generation = ++this.refreshId
        this.clearVersionTimeouts()
        this.releaseInputs()
        const oldOutputs = Object.values(this.midiOut)
        this.midiIn = {};
        this.midiOut = {};
        this.versions = {};
        if (!this.messageHandler) {
          this.messageHandler = event => {
            if (!this.disposed) this.handleMidiMessage(event)
          }
        }

        const inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          if (input.value.state !== 'disconnected' && input.value.name.match(this.regexName)) {
            this.midiIn[input.value.id] = input.value;
            input.value.onmidimessage = this.messageHandler;
          }
        }

        let midi_output_id = 0;
        const outputs = midi.outputs.values();
        for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
          if (output.value.state !== 'disconnected' && output.value.name.match(this.regexName)) {
            this.midiOut[midi_output_id] = output.value
            midi_output_id++;
          }
        }
        const currentOutputs = Object.values(this.midiOut)
        for (const output of oldOutputs) {
          if (!currentOutputs.includes(output)) this.closeOutput(output)
        }
        for (const output of currentOutputs) {
          try { await output.open() }
          catch (error) {
            if (this.disposed || generation !== this.refreshId) {
              if (this.disposed || !Object.values(this.midiOut).includes(output)) await this.closeOutput(output)
              return
            }
            this.releaseInputs()
            this.midiIn = {}
            this.midiOut = {}
            for (const owned of currentOutputs) await this.closeOutput(owned)
            this.deviceChanged()
            throw error
          }
          if (this.disposed || generation !== this.refreshId) {
            if (this.disposed || !Object.values(this.midiOut).includes(output)) await this.closeOutput(output)
            return
          }
        }

        this.deviceChanged()

        if (!this.checkVersionsFlag) return;

        for (const [key, midi_output] of Object.entries(this.midiOut)) {
          const timeout = setTimeout(() => {
            if (!this.disposed && generation === this.refreshId &&
                midi_output.state !== 'disconnected' && midi_output.connection !== 'closed') {
              midi_output.send([240, 20, 13, 126, Number(key), 247])
            }
          }, 3000)
          this.versionTimeouts.push(timeout)
        }
      },
      clearVersionTimeouts() {
        for (const timeout of this.versionTimeouts) clearTimeout(timeout)
        this.versionTimeouts = []
      },
      handleMidiMessage(event) {
        const [start_sys_ex, flag_byte, num_com, id_of_output, x, y, z, end_sys_ex] = event.data;
        if (start_sys_ex === 0xF0 &&
            end_sys_ex === 0xF7 &&
            flag_byte === 0x0B &&
            num_com === 126 &&
            event.data.length === 8
        ) {
          this.versions[id_of_output] = `v${x}.${y}.${z}`
        }
      },
      deviceChanged() {
        this.$emit("device_changed", this.midiOut[this.currentMidiNum])
      }
    },
    mounted() {
        navigator.requestMIDIAccess({sysex: true})
            .then((midi) => this.midiReady(midi))
            .catch((err) => console.log('Something went wrong', err));
    },
    beforeUnmount() {
      this.disposed = true
      this.refreshId += 1
      this.clearVersionTimeouts()
      if (this.midiAccess?.onstatechange === this.stateHandler) this.midiAccess.onstatechange = null
      this.releaseInputs()
      for (const output of Object.values(this.midiOut)) this.closeOutput(output)
      this.midiIn = {}
      this.midiOut = {}
      this.midiAccess = null
      this.$emit("device_changed", undefined)
    }
  }
</script>

<style scoped>

</style>

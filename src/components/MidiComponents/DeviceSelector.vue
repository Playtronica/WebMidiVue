<template>
  <div class="form-floating mb-3">
    <select v-model="currentMidiNum" class="form-control" @change="this.deviceChanged">
      <option v-for="(value, key) in midiOut" v-bind:key="key" :value="key" >{{value.name}} {{this.versions[key]}}</option>
    </select>
    <label for="device">{{ this.text_label }}</label>
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
        versionTimeouts: []
      }
    },
    methods: {
      async midiReady(midi) {
        this.midiAccess = midi
        midi.onstatechange = (event) => {
          this.initDevices(event.target).catch(error => console.log('Could not refresh MIDI devices', error))
        };
        await this.initDevices(midi);
      },
      async initDevices(midi) {
        this.clearVersionTimeouts()
        this.midiIn = {};
        this.midiOut = {};
        this.versions = {};

        const inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          if (input.value.name.match(this.regexName)) {
            this.midiIn[input.id] = input.value;
            input.value.onmidimessage = (event) => this.handleMidiMessage(event);
          }
        }

        let midi_output_id = 0;
        const outputs = midi.outputs.values();
        for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
          if (output.value.name.match(this.regexName)) {
            this.midiOut[midi_output_id] = output.value
            await output.value.open()
            midi_output_id++;
          }
        }

        this.deviceChanged()

        if (!this.checkVersionsFlag) return;

        for (const [key, midi_output] of Object.entries(this.midiOut)) {
          const timeout = setTimeout(() => {
            if (midi_output.state !== 'disconnected' && midi_output.connection !== 'closed') {
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
      this.clearVersionTimeouts()
      if (this.midiAccess) this.midiAccess.onstatechange = null
      for (const input of Object.values(this.midiIn)) input.onmidimessage = null
      for (const output of Object.values(this.midiOut)) output.close?.().catch(() => {})
      this.$emit("device_changed", undefined)
    }
  }
</script>

<style scoped>

</style>

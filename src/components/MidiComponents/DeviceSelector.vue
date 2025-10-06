<template>
  <div class="form-floating mb-3">
    <select v-model="currentMidiNum" class="form-control" @change="this.deviceChanged">
      <option v-for="(value, key) in midiOut" v-bind:key="key" :value="key" >{{value.name}} {{this.versions[key]}}</option>
    </select>
    <label for="device">{{ this.text_label }}</label>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
  import {sleep} from "@/assets/js/SysExCommand";

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
        updateTimeout: null
      }
    },
    methods: {
      midiReady(midi) {

        midi.onstatechange = (event) => {
          this.initDevices(event.target)
        };
        this.initDevices(midi);
      },
      initDevices(midi) {
        this.midiIn = {};
        this.midiOut = {};
        this.versions = {};

        const inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          if (input.value.name.match(this.regexName))
            this.midiIn[input.id] = input.value;
            input.value.onmidimessage = (event) => this.handleMidiMessage(event);
        }

        let midi_output_id = 0;
        const outputs = midi.outputs.values();
        for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
          if (output.value.name.match(this.regexName)) {
            this.midiOut[midi_output_id] = output.value
            output.value.send([])
            sleep(100)
            midi_output_id++;
          }
        }

        this.deviceChanged()

        if (!this.checkVersionsFlag) return;

        for (const [key, midi_output] of Object.entries(this.midiOut)) {
          setTimeout(() => {
                midi_output.send([240, 20, 13, 126, key, 247])
                sleep(100)
          }, 3000)
        }



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
        console.log(this.currentMidiNum)
        this.$emit("device_changed", this.midiOut[this.currentMidiNum])
      }
    },
    mounted() {
        navigator.requestMIDIAccess({sysex: true})
            .then(
                (midi) => this.midiReady(midi),
                (err) => console.log('Something went wrong', err));
    }
  }
</script>

<style scoped>

</style>
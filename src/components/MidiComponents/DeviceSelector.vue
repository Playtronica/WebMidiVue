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
      // Device Info answer, both formats are accepted:
      // old firmware: F0 0B 7E <id> <major> <minor> <patch> F7
      // new firmware: F0 14 0D 7E <id> <major> <minor> <patch> F7 (answers of slaves have key 0E, 0F... and are skipped)
      handleMidiMessage(event) {
        const data = event.data;
        if (data[0] !== 0xF0 || data[data.length - 1] !== 0xF7) return;

        let info;
        if (data.length === 8 && data[1] === 0x0B) {
          info = data.slice(2, 7);
        } else if (data.length === 9 && data[1] === 0x14 && data[2] === 0x0D) {
          info = data.slice(3, 8);
        } else {
          return;
        }

        const [num_com, id_of_output, x, y, z] = info;
        if (num_com === 126) {
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
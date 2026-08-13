<template>
  <div class="mb-3">
    <div class="form-floating">
      <select v-model="currentMidiNum" class="form-control" @change="this.deviceChanged" :disabled="released">
        <option v-for="(value, key) in midiOut" v-bind:key="key" :value="key" >{{value.name}} {{this.versions[key]}}</option>
      </select>
      <label for="device">{{ this.text_label }}</label>
    </div>
    <div class="d-flex gap-2 align-items-center mt-2">
      <button v-if="!released" type="button" class="btn btn-outline-primary" @click="releaseMidi">
        Release device for DAW
      </button>
      <button v-else type="button" class="btn btn-primary" @click="connectMidi">
        Reconnect settings
      </button>
      <small class="text-muted">
        {{ released ? "The MIDI port is free for Reaper, Ableton, or another app." : "Windows may allow only one app to use a MIDI port. Release it before opening your DAW." }}
      </small>
    </div>
    <div v-if="midiError" class="alert alert-warning mt-2 mb-0" role="alert">{{ midiError }}</div>
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
        updateTimeouts: [],
        midiAccess: null,
        released: false,
        midiError: ""
      }
    },
    methods: {
      midiReady(midi) {
        this.clearUpdateTimeouts();
        this.midiAccess = midi;
        this.released = false;
        midi.onstatechange = (event) => {
          this.initDevices(event.target)
        };
        this.initDevices(midi);
      },
      async connectMidi() {
        try {
          this.midiError = "";
          const midi = this.midiAccess || await navigator.requestMIDIAccess({sysex: true});
          this.midiReady(midi);
        } catch (err) {
          this.midiError = "Could not open the MIDI port. Close your DAW or other MIDI apps, then retry.";
          console.log('Something went wrong', err);
        }
      },
      clearUpdateTimeouts() {
        for (const timeout of this.updateTimeouts) clearTimeout(timeout);
        this.updateTimeouts = [];
      },
      async releaseMidi() {
        if (!this.midiAccess) return;

        this.clearUpdateTimeouts();
        this.midiError = "";
        this.midiAccess.onstatechange = null;
        const ports = [...Object.values(this.midiIn), ...Object.values(this.midiOut)];
        const failures = [];
        for (const port of ports) {
          if (port.type === "input") port.onmidimessage = null;
          try {
            await port.close();
          } catch (err) {
            failures.push(port.name);
            console.log('Could not close MIDI port', err);
          }
        }

        const stillOpen = ports.filter((port) => port.connection !== "closed").map((port) => port.name);
        failures.push(...stillOpen);
        if (failures.length) {
          this.midiError = `Could not release: ${[...new Set(failures)].join(", ")}. Close this tab before opening your DAW.`;
          return;
        }

        this.midiIn = {};
        this.midiOut = {};
        this.versions = {};
        this.released = true;
        this.$emit("device_changed", undefined);
      },
      initDevices(midi) {
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
            midi_output_id++;
          }
        }

        this.deviceChanged()

        if (!this.checkVersionsFlag) return;

        for (const [key, midi_output] of Object.entries(this.midiOut)) {
          const timeout = setTimeout(async () => {
            if (this.released) return;
            try {
              await midi_output.open();
              if (!this.released) midi_output.send([240, 20, 13, 126, key, 247]);
            } catch (err) {
              this.midiError = "Could not query the device. Another MIDI app may be using it.";
            }
          }, 3000);
          this.updateTimeouts.push(timeout);
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
      this.connectMidi();
    },
    beforeUnmount() {
      this.releaseMidi();
    }
  }
</script>

<style scoped>

</style>

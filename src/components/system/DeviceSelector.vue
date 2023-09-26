<template>
  <div class="form-floating mb-3">
    <select class="form-control">
      <option v-for="midi in midiOut" v-bind:key="midi.id">{{midi.name}}</option>
    </select>
    <label for="device">Select device</label>
  </div>
</template>

<script>
  export default {
    props: {
      regexName: {
        default: ".*",
        type: String
      }
    },
    name: "DeviceSelector",
    data() {
      return {
        midiIn: [],
        midiOut: []
      }
    },
    methods: {
      midiReady(midi) {
        midi.addEventListener('statechange', (event) => this.initDevices(event.target));
        this.initDevices(midi);
      },
      initDevices(midi) {
        this.midiIn = [];
        this.midiOut = [];

        const inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          if (input.value.name.match(this.regexName))
            this.midiIn.push(input.value);
        }

        const outputs = midi.outputs.values();
        for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
          if (output.value.name.match(this.regexName))
            this.midiOut.push(output.value)
        }
      },
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
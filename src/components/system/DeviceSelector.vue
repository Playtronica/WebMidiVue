<template>
  <div class="form-floating mb-3">
    <select id="device" class="form-control"></select>
    <label for="device">Select device</label>
  </div>
</template>

<script>
  export default {
    name: "DeviceSelector",
    data() {
      return {
        midiIn: [],
        midiOut: []
      }
    },
    methods: {
      midiReady(midi) {
        // Also react to device changes.
        midi.addEventListener('statechange', (event) => this.initDevices(event.target));
        this.initDevices(midi); // see the next section!
      },
      initDevices(midi) {
        this.midiIn = [];
        this.midiOut = [];

        const inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          this.midiIn.push(input.value);
          console.log(input.value);
        }

        const outputs = midi.outputs.values();
        for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
          this.midiOut.push(output.value);
        }
      },
    },
    mounted() {
      navigator.requestMIDIAccess()
          .then(
              (midi) => this.midiReady(midi),
              (err) => console.log('Something went wrong', err));
    }
  }


</script>

<style scoped>

</style>
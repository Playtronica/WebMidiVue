<template>
  <div class="mb-3">
    <div class="form-floating">
      <select v-model.number="currentMidiNum" class="form-control" @change="deviceChanged" :disabled="released || connecting">
        <option v-for="(device, key) in devices" :key="device.output.id" :value="key">
          {{ device.output.name }} {{ versions[device.output.id] }}
        </option>
      </select>
      <label for="device">{{ text_label }}</label>
    </div>
    <div v-if="allowDawHandoff" class="d-flex gap-2 align-items-center mt-2">
      <button v-if="!released" type="button" class="btn btn-outline-primary" @click="releaseMidi" :disabled="connecting || !selectedDevice">
        Release device for DAW
      </button>
      <button v-else type="button" class="btn btn-primary" @click="connectMidi" :disabled="connecting">
        Reconnect settings
      </button>
      <small class="text-muted">
        {{ released ? "The selected MIDI port is free for Reaper, Ableton, or another app." : "Windows may allow only one app to use a MIDI port. Release the selected device before opening your DAW." }}
      </small>
    </div>
    <div v-if="midiError" class="alert alert-warning mt-2 mb-0" role="alert">{{ midiError }}</div>
  </div>
</template>

<script>
  const portIdentity = (port) => [port.manufacturer || "", port.name || ""].join("\u0000");
  let midiAccessPromise = null;

  const requestMidiAccess = () => {
    if (!navigator.requestMIDIAccess) {
      return Promise.reject(new Error("Web MIDI is not supported by this browser."));
    }
    if (!midiAccessPromise) {
      midiAccessPromise = navigator.requestMIDIAccess({sysex: true}).catch((error) => {
        midiAccessPromise = null;
        throw error;
      });
    }
    return midiAccessPromise;
  };

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
      allowDawHandoff: {
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
        devices: [],
        versions: {},
        currentMidiNum: 0,
        updateTimeout: null,
        midiAccess: null,
        selectedDevice: null,
        released: false,
        connecting: false,
        midiError: "",
        operationId: 0,
        unmounted: false
      }
    },
    methods: {
      matchingPorts(ports) {
        return [...ports.values()].filter((port) => port.name && port.name.match(this.regexName));
      },
      pairDevices(midi) {
        const inputsByIdentity = new Map();
        for (const input of this.matchingPorts(midi.inputs)) {
          const identity = portIdentity(input);
          if (!inputsByIdentity.has(identity)) inputsByIdentity.set(identity, []);
          inputsByIdentity.get(identity).push(input);
        }

        return this.matchingPorts(midi.outputs).map((output) => {
          const matchingInputs = inputsByIdentity.get(portIdentity(output)) || [];
          return {output, input: matchingInputs.shift()};
        });
      },
      hasAmbiguousIdentity(devices) {
        const counts = new Map();
        for (const device of devices) {
          const identity = portIdentity(device.output);
          counts.set(identity, (counts.get(identity) || 0) + 1);
        }
        return [...counts.values()].some((count) => count > 1);
      },
      midiReady(midi) {
        this.midiAccess = midi;
        midi.onstatechange = () => {
          if (!this.released && !this.connecting) this.refreshDevices();
        };
        return this.refreshDevices();
      },
      async connectMidi() {
        const operationId = ++this.operationId;
        this.connecting = true;
        this.midiError = "";
        try {
          const midi = this.midiAccess || await requestMidiAccess();
          if (operationId !== this.operationId || this.unmounted) return;
          this.released = false;
          await this.midiReady(midi);
        } catch (err) {
          if (operationId === this.operationId && !this.unmounted) {
            this.midiError = "Could not open the MIDI port. Close your DAW or other MIDI apps, then retry.";
          }
          console.log('Something went wrong', err);
        } finally {
          if (operationId === this.operationId && !this.unmounted) this.connecting = false;
        }
      },
      clearUpdateTimeout() {
        if (this.updateTimeout !== null) clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
      },
      async closeDevice(device) {
        if (!device) return [];
        const failures = [];
        if (device.input) device.input.onmidimessage = null;
        for (const port of [device.input, device.output].filter(Boolean)) {
          try {
            await port.close();
          } catch (err) {
            failures.push(port.name);
            console.log('Could not close MIDI port', err);
          }
        }
        return failures;
      },
      async releaseMidi() {
        const operationId = ++this.operationId;
        this.connecting = true;
        this.clearUpdateTimeout();
        this.midiError = "";
        if (this.midiAccess) this.midiAccess.onstatechange = null;

        const device = this.selectedDevice;
        const failures = await this.closeDevice(device);
        if (operationId !== this.operationId) return;
        this.connecting = false;

        if (failures.length) {
          this.midiError = `Could not release: ${[...new Set(failures)].join(", ")}. Retry, or close this tab before opening your DAW.`;
          this.released = false;
          this.$emit("device_changed", undefined);
          return;
        }

        this.selectedDevice = null;
        this.released = true;
        this.$emit("device_changed", undefined);
      },
      async refreshDevices() {
        if (!this.midiAccess || this.released) return;
        const previousOutputId = this.selectedDevice && this.selectedDevice.output.id;
        this.devices = this.pairDevices(this.midiAccess);
        if (this.hasAmbiguousIdentity(this.devices)) {
          this.clearUpdateTimeout();
          const failures = await this.closeDevice(this.selectedDevice);
          if (failures.length) {
            this.$emit("device_changed", undefined);
            this.midiError = `More than one identical device is connected, and ${[...new Set(failures)].join(", ")} did not close. Disconnect the extra device, then retry Release.`;
            this.connecting = false;
            return;
          }
          this.selectedDevice = null;
          this.$emit("device_changed", undefined);
          this.midiError = "More than one identical device is connected. Disconnect the others so Settings can match the correct MIDI input and output.";
          this.connecting = false;
          return;
        }
        const previousIndex = this.devices.findIndex((device) => device.output.id === previousOutputId);
        if (previousIndex >= 0) this.currentMidiNum = previousIndex;
        else if (!this.devices[this.currentMidiNum]) this.currentMidiNum = 0;
        await this.deviceChanged();
      },
      async deviceChanged() {
        if (this.released) return;
        const operationId = ++this.operationId;
        this.connecting = true;
        this.clearUpdateTimeout();
        this.midiError = "";

        const previousDevice = this.selectedDevice;
        const nextDevice = this.devices[this.currentMidiNum];
        if (previousDevice && (!nextDevice || previousDevice.output.id !== nextDevice.output.id)) {
          const failures = await this.closeDevice(previousDevice);
          if (operationId !== this.operationId || this.unmounted) return;
          if (failures.length) {
            const previousIndex = this.devices.findIndex((device) => device.output.id === previousDevice.output.id);
            if (previousIndex >= 0) this.currentMidiNum = previousIndex;
            this.connecting = false;
            this.$emit("device_changed", undefined);
            this.midiError = `Could not switch devices: ${[...new Set(failures)].join(", ")} did not close. Retry, or close this tab.`;
            return;
          }
        }
        if (operationId !== this.operationId || this.unmounted) return;

        this.selectedDevice = nextDevice || null;
        if (!nextDevice) {
          this.connecting = false;
          this.$emit("device_changed", undefined);
          return;
        }

        try {
          await nextDevice.output.open();
          if (nextDevice.input) {
            await nextDevice.input.open();
            if (operationId !== this.operationId || this.unmounted) {
              await this.closeDevice(nextDevice);
              return;
            }
            nextDevice.input.onmidimessage = (event) => this.handleMidiMessage(event, operationId);
          }
          if (operationId !== this.operationId || this.unmounted) {
            await this.closeDevice(nextDevice);
            return;
          }
          this.$emit("device_changed", nextDevice.output);
          this.scheduleVersionQuery(nextDevice, operationId);
        } catch (err) {
          await this.closeDevice(nextDevice);
          if (operationId === this.operationId && !this.unmounted) {
            this.selectedDevice = null;
            this.$emit("device_changed", undefined);
            this.midiError = "Could not open the selected device. Another MIDI app may be using it.";
          }
          console.log('Could not open MIDI port', err);
        } finally {
          if (operationId === this.operationId && !this.unmounted) this.connecting = false;
        }
      },
      scheduleVersionQuery(device, operationId) {
        if (!this.checkVersionsFlag) return;
        this.updateTimeout = setTimeout(() => {
          this.updateTimeout = null;
          if (operationId !== this.operationId || this.released || this.selectedDevice !== device) return;
          try {
            device.output.send([240, 20, 13, 126, this.currentMidiNum, 247]);
          } catch (err) {
            if (operationId === this.operationId) this.midiError = "Could not query the selected device.";
          }
        }, 3000);
      },
      handleMidiMessage(event, operationId) {
        if (operationId !== this.operationId || this.released) return;
        const [start_sys_ex, flag_byte, num_com, id_of_output, x, y, z, end_sys_ex] = event.data;
        if (start_sys_ex === 0xF0 && end_sys_ex === 0xF7 && flag_byte === 0x0B &&
            num_com === 126 && event.data.length === 8 && id_of_output === this.currentMidiNum) {
          this.versions[this.selectedDevice.output.id] = `v${x}.${y}.${z}`;
        }
      }
    },
    mounted() {
      this.connectMidi();
    },
    beforeUnmount() {
      this.unmounted = true;
      ++this.operationId;
      this.clearUpdateTimeout();
      if (this.midiAccess) this.midiAccess.onstatechange = null;
      // An in-flight lifecycle operation observes operationId and closes its
      // device. Avoid racing it with a second close from the unmount hook.
      if (!this.connecting) this.closeDevice(this.selectedDevice);
    }
  }
</script>

<style scoped>

</style>

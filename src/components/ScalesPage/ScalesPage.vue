<template>
  <LoaderComponent v-if="this.is_loading" :key="forceRerender"/>
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div v-for="item in this.notifications" :key="item.key" class="toast show" role="status">
      <div class="toast-body">
        <b>{{ item.device }}</b>: {{ item.label }} → {{ item.value }}
      </div>
    </div>
  </div>
  <h1 class="text-center">Scales change settings</h1>
  <DeviceSelector regex-name="Scales" @device_changed="this.deviceChanged" text_label="🔌 Select Device" class="m-2" check-versions-flag/>
  <div class="form-floating m-2">
    <select v-model.number="this.target" class="form-control" :disabled="this.chain_length <= 1">
      <option :value="GENERAL_TARGET">General</option>
      <option v-for="n in this.chain_length" :key="n" :value="n - 1">{{ n === 1 ? "Master" : `Slave ${n - 1}` }}</option>
    </select>
    <label>🔗 Target Device ({{ this.chain_length }} in chain)</label>
  </div>
  <div v-if="this.device" class="mx-2 small text-muted">
    Protocol: {{ this.settings_protocol_active ? "settings by id" : "legacy commands" }}
  </div>
  <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id" text_label="📂 Preset" class="m-2"/>
  <div class="row gx-1 mb-5">
    <div class="col">
      <button @mouseup="change_data_loader" :disabled="!this.device" class="btn btn-primary w-100 h-100">SEND</button>
    </div>
    <div class="col" v-if="this.settings_protocol_active">
      <button @click="this.readFromDevice" :disabled="!this.device" class="btn btn-primary w-100 h-100">READ</button>
    </div>
    <div class="col">
      <button @click="this.createPreset" class="btn btn-primary w-100 h-100">SAVE</button>
    </div>
    <div class="col">
      <UpdateFirmwareComponent class="w-100 h-100" text="🔄 Update Firmware" repo="Playtronica/scales-releases" :device="this.device"/>
    </div>

    <div class="col">
      <FileDropArea name="UPLOAD" @get_drop="(e) => loadDataFromPreset(e)"/>
    </div>
  </div>


  <div>
    <BootstrapCollapse name_of_collapse="Scales settings" open_by_default>
      <template v-slot:objects>
        <GroupOfCommands>
          <template v-slot:objects>
            <SliderCommand
                command-label="BPM"
                :key="`bpm-${this.forceRerender}`"
                :command-object="this.commands_data.bpm"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />

            <SelectCommand
                command-label="🎼 Sensitivity"
                :key="`sensitivity-${this.forceRerender}`"
                :list-of-variants="this.sensitivity_modes"
                :command-object="commands_data.sensitivity"
                @input-changed="this.sys_ex_changed"
                class="m-3"
            />

            <SelectCommand
                command-label="🎼 Scale"
                :key="`scale-${this.forceRerender}`"
                :list-of-variants="this.scales"
                :command-object="commands_data.scale"
                @input-changed="this.sys_ex_changed"
                class="m-3"
            />

          </template>
        </GroupOfCommands>
      </template>
    </BootstrapCollapse>

    <BootstrapCollapse name_of_collapse="Arpeggio">
      <template v-slot:objects>
        <GroupOfCommands name-of-group="">
          <template v-slot:objects>
            <SelectCommand
                command-label="Arp Rate"
                :key="this.forceRerender"
                :list-of-variants="this.arp_rates"
                :command-object="commands_data.arp_rate"
                description="Arpeggio steps per beat of the BPM clock. Slow rates step on the same beats of the 8-beat bar on all synced devices."
                @input-changed="this.sys_ex_changed"
                class="m-3"
            />
          </template>
        </GroupOfCommands>
      </template>
    </BootstrapCollapse>

    <BootstrapCollapse name_of_collapse="Color Settings">
      <template v-slot:objects>
        <GroupOfCommands name-of-group="">
          <template v-slot:objects>
            <ColorPicker
                command-label="Undercover color"
                :key="this.forceRerender"
                :command-color-object="this.commands_data.color"
                :command-bright-object="this.commands_data.brightness"
                :command-color-and-brightness-object="this.commands_data.undercover_color"
                @input-changed="this.sys_ex_changed"
                class="m-3"
            />

          </template>
        </GroupOfCommands>
      </template>
    </BootstrapCollapse>

    <BootstrapCollapse name_of_collapse="Extra">
      <template v-slot:objects>
        <GroupOfCommands name-of-group="">
          <template v-slot:objects>
            <div class="row">
              <SwitchComponent
                  class="col-sm"
                  commandLabel="Performance Mode"
                  :command-object=this.commands_data.performance
                  @input-changed="this.sys_ex_changed"
              />

              <SwitchComponent
                  class="col-sm"
                  commandLabel="Beginners Mode"
                  :command-object=this.commands_data.beginning_mode
                  @input-changed="this.sys_ex_changed"
              />

              <SwitchComponent
                  class="col-sm"
                  commandLabel="One Channel Mode"
                  :command-object=this.commands_data.one_channel_mode
                  @input-changed="this.sys_ex_changed"
              />

              <SwitchComponent
                  class="col-sm"
                  commandLabel="Arp Plus"
                  :command-object=this.commands_data.arp_plus
                  description="Arpeggio mode: a note is added automatically after it stays the same for 1.5 s (the FUNCTION button no longer adds notes or pauses)"
                  @input-changed="this.sys_ex_changed"
              />

              <SwitchComponent
                  class="col-sm"
                  commandLabel="Sensor Mute"
                  :command-object=this.commands_data.sensor_mute
                  description="Mutes only the note played directly from the weight (Hold, Arpeggio and Pitch modes). Arpeggio, BPM sequence, Hold stuck notes and Music CC keep working. The MUTE button still silences everything."
                  @input-changed="this.sys_ex_changed"
              />
            </div>
          </template>
        </GroupOfCommands>
        <GroupOfCommands>
          <template v-slot:objects>
            <SliderCommand
                command-label="🎛️ Music CC Number"
                :key="this.forceRerender"
                :command-object="this.commands_data.music_cc_num"
                @input-changed="this.sys_ex_changed"
                description="MIDI Continuous Controller number sent during music play (0–127, default 90)"
                class="m-2"
            />
          </template>
        </GroupOfCommands>
      </template>
    </BootstrapCollapse>
  </div>
</template>

<script>

import { sleep } from "@/assets/js/SysExCommand"
import { saveAs } from '@progress/kendo-file-saver';
import FileDropArea from "@/components/MidiComponents/FileDropArea.vue";
import GroupOfCommands from "@/components/MidiComponents/GroupOfCommands.vue";
import PatchSelector from "@/components/MidiComponents/PatchSelector.vue";
import DeviceSelector from "@/components/MidiComponents/DeviceSelector.vue";
import UpdateFirmwareComponent from "@/components/MidiComponents/UpdateFirmwareComponent.vue";
import LoaderComponent from "@/components/MidiComponents/LoaderComponent.vue";
import BootstrapCollapse from "@/components/BootstrapCollapse.vue";
import {ScalesCommandsData, ScalesDb, ScalesSettings} from "@/components/ScalesPage/ScalesIDB";
import SliderCommand from "@/components/MidiComponents/SliderCommand.vue";
import SelectCommand from "@/components/MidiComponents/SelectCommand.vue";
import ColorPicker from "@/components/MidiComponents/ColorPicker.vue";
import SwitchComponent from "@/components/MidiComponents/Switch.vue";
import { chainFlag, MidiChainTracker } from "@/assets/js/MidiChain";
import { decodeSetting, encodeSetting, SETTING_STATUS, SettingsProtocol } from "@/assets/js/SettingsProtocol";
import { matchUndercoverColor } from "@/assets/js/UndercoverPalette";

// Target value that sends the command to every device in the chain
const GENERAL_TARGET = -1;
// Pause between copies of one command sent to different devices of the chain
const CHAIN_SEND_DELAY_MS = 100;
// How long a notification about a setting changed on the device is shown
const NOTIFICATION_MS = 3000;
// Names of settings in notifications
const SETTING_LABELS = {
  bpm: "BPM",
  sensitivity: "Sensitivity",
  undercover_color: "Undercover color",
  scale: "Scale",
  performance: "Performance Mode",
  one_channel_mode: "One Channel Mode",
  beginning_mode: "Beginners Mode",
  music_cc_num: "Music CC Number",
  arp_plus: "Arp Plus",
  sensor_mute: "Sensor Mute",
  arp_rate: "Arp Rate",
};


export default  {
  components: {
    SwitchComponent,
    ColorPicker,
    SelectCommand,
    SliderCommand,
    BootstrapCollapse,
    LoaderComponent,
    UpdateFirmwareComponent,
    DeviceSelector,
    PatchSelector,
    GroupOfCommands,
    FileDropArea},
  props: {
    id: {
      type: String,
      required: true,
    },
    test: {
      type: Boolean,
      default: false
    },
  },
  computed: {
    targetFlags() {
      if (this.target === GENERAL_TARGET) {
        return Array.from({length: this.chain_length}, (_, n) => chainFlag(n));
      }
      return [chainFlag(this.target)];
    },
  },
  watch: {
    // New protocol: the page shows settings of the selected device (General reads the master)
    target() {
      this.readFromDevice();
    },
  },
  methods: {
    async change_data_loader() {
      if (!this.device) return
      sleep(100)
       this.is_loading = true;
       this.forceRerender++;

      setTimeout(function () {
        this.is_loading = false;
        this.forceRerender++;
      }.bind(this),3000)

      setTimeout(function () {
        this.sendData()
      }.bind(this),10)

    },

    async sendData() {
      if (this.settings_protocol_active) {
        await this.sendDataById();
        return;
      }
      if (this.device) {
        this.device.send([240, 11, 20, 13, 126, 247]);
        sleep(100);
        let extraComp = []

        extraComp.push("plantBpm");
        for (let comm in this.commands_data) {
          if (!extraComp.includes(comm)) {
            for (const flag of this.flagsFor(this.commands_data[comm])) {
              this.commands_data[comm].sendToMidi(this.device, flag)
              sleep(100);
            }
          }
        }
        sleep(100);
        this.device.send([240, 11, 20, 13, 126, 247]);
      }
    },

    // New protocol: every answer is awaited instead of fixed pauses, then the targets save right away
    async sendDataById() {
      if (!this.device) return
      for (const comm in this.commands_data) {
        for (const flag of this.flagsFor(this.commands_data[comm])) {
          await this.sendSetting(this.commands_data[comm], flag);
        }
      }
      for (const flag of this.targetFlags) {
        await this.settingsProtocol.save(flag);
      }
    },

    async sendSetting(object, flag) {
      const setting = ScalesSettings[object.name];
      if (!setting || !object.check_params()) return
      const answer = await this.settingsProtocol.set(flag, setting.id, encodeSetting(setting, object.value));
      if (!answer) {
        console.warn(`Setting ${object.name}: no answer`);
      } else if (answer.status !== 0) {
        console.warn(`Setting ${object.name}: ${SETTING_STATUS[answer.status] ?? answer.status}`);
      }
    },

    // Loads settings of the target (the master for General) into the current preset
    async readFromDevice() {
      if (!this.device || !this.settings_protocol_active) return
      const flag = chainFlag(this.target === GENERAL_TARGET ? 0 : this.target);
      const answer = await this.settingsProtocol.getAll(flag);
      if (!answer) {
        console.warn("Read settings: no answer");
        return
      }

      for (const {status, id, value} of answer.values) {
        if (status !== 0) continue
        const name = Object.keys(ScalesSettings).find(key => ScalesSettings[key].id === id);
        if (name) this.commands_data[name].set_value(decodeSetting(ScalesSettings[name], value));
      }
      // The picker keeps a base color and brightness, they are found back if the color is one of the picker's
      const picked = matchUndercoverColor(this.commands_data.undercover_color.value);
      if (picked) {
        this.commands_data.color.set_value(picked.color);
        this.commands_data.brightness.set_value(picked.brightness);
      }

      await this.patchChanged();
      this.forceRerender++;
      this.patchRerender++;
    },

    // CHANGED: a setting was changed on the device (button, weight, other commands)
    async settingChanged(device, id, value) {
      const name = Object.keys(ScalesSettings).find(key => ScalesSettings[key].id === id);
      if (!name) return
      const decoded = decodeSetting(ScalesSettings[name], value);
      this.notify(device, name, decoded);

      // The page shows the selected device (the master for General), BPM is always the master's
      const shown = name === "bpm" || this.target === GENERAL_TARGET ? 0 : this.target;
      if (device !== shown) return

      this.commands_data[name].set_value(decoded);
      if (name === "undercover_color") {
        const picked = matchUndercoverColor(decoded);
        if (picked) {
          this.commands_data.color.set_value(picked.color);
          this.commands_data.brightness.set_value(picked.brightness);
        }
      }

      await this.patchChanged();
      this.forceRerender++;
      this.patchRerender++;
    },

    // A new change of the same setting of the same device replaces its notification
    notify(device, name, value) {
      const key = `${device}:${name}`;
      clearTimeout(this.notificationTimers[key]);
      const item = {
        key,
        device: device === 0 ? "Master" : `Slave ${device}`,
        label: SETTING_LABELS[name] ?? name,
        value: this.describeValue(name, value),
      };
      const index = this.notifications.findIndex(n => n.key === key);
      if (index >= 0) this.notifications.splice(index, 1, item);
      else this.notifications.push(item);

      this.notificationTimers[key] = setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.key !== key);
        delete this.notificationTimers[key];
      }, NOTIFICATION_MS);
    },

    describeValue(name, value) {
      switch (name) {
        case "sensitivity": return this.sensitivity_modes[value] ?? value;
        case "scale": return this.scales[value] ?? value;
        case "arp_rate": return this.arp_rates[value] ?? value;
        case "undercover_color": return "#" + value.toString(16).toUpperCase().padStart(6, "0");
        case "performance":
        case "one_channel_mode":
        case "beginning_mode":
        case "arp_plus":
        case "sensor_mute":
          return value ? "On" : "Off";
        default: return value;
      }
    },

    saveData() {
      let state = {}
      for (let val of Object.values(this.commands_data)) {
        state[val.name] = val.value
      }

      this.db.updatePatch(localStorage.getItem(this.id), state)
    },

    async loadData() {
      let preset = await this.db.getPatch(localStorage.getItem(this.id))
      if (!preset) {
        localStorage.setItem(this.id, 1)
        preset = await this.db.getPatch(localStorage.getItem(this.id))
      }

      for (const [key, value] of Object.entries(preset.data)) {
        this.commands_data[key].set_value(value);
      }

      this.forceRerender++;
    },
    createPreset() {
      let state = []
      for (let item in this.commands_data) {
        state.push(this.commands_data[item].toShortDict())
      }

      let value = {"commands": state}
      let myFile = new File([JSON.stringify(value)], "scales-preset.txt",
          {type: "text/plain;charset=utf-8"})
      saveAs(myFile, "scales-preset.txt");
    },
    async loadDataFromPreset(e) {
      await this.patchChanged();
      for (let item of JSON.parse(e).commands) {
        this.commands_data[item.name].set_value(item.value);
      }
      this.saveData();
      this.forceRerender++;
    },
    async patchChanged() {
      let patch_id = parseInt(localStorage.getItem(this.id));

      if (this.patches.find(item => item.id === patch_id).saved) {
        patch_id = await this.db.getUnsavedPatch();
        this.patches = await this.db.getPatch();
        localStorage.setItem(this.id, patch_id);
      }
      this.saveData();
    },
    async sys_ex_changed(object) {
      await this.patchChanged();

      if (this.device) {
        const flags = this.flagsFor(object);
        for (const [i, flag] of flags.entries()) {
          if (this.settings_protocol_active) {
            await this.sendSetting(object, flag);
            continue;
          }
          if (i > 0) await new Promise(resolve => setTimeout(resolve, CHAIN_SEND_DELAY_MS));
          await object.sendToMidi(this.device, flag)
        }
      }

      this.forceRerender++;
      this.patchRerender++;
    },

    // BPM is always sent to the master, other settings go to the selected target (or to all of them)
    flagsFor(object) {
      return object === this.commands_data.bpm ? [chainFlag(0)] : this.targetFlags
    },

    deviceChanged(device) {
      if (!device || !this.device || device.id !== this.device.id) {
        this.target = 0;
      }
      this.device = device;
      this.chainTracker.setOutput(device);
      this.settingsProtocol.setOutput(device);
    },

    chainLengthChanged(length) {
      this.chain_length = length;
      // Selected slave was disconnected - fall back to the master
      if (this.target !== GENERAL_TARGET && this.target >= length) {
        this.target = 0;
      }
    },
  },
  data() {
    return {
      GENERAL_TARGET,
      page_is_inited: false,
      device: null,
      chain_length: 1,
      settings_protocol_active: false,
      notifications: [],
      target: 0,
      forceRerender: 0,
      patchRerender: 0,
      db: {
        type: ScalesDb
      },
      patches: [],
      patch_id: 0,
      is_loading: false,
      commands_data: Object.fromEntries(ScalesCommandsData),
      scales: ["Major", "Minor", "Chrom", "Dorian", "Mixolydian",
        "Lydian", "Wholetone", "Minblues", "Majblues", "Minpen",
        "Majpen", "Diminished"],
      sensitivity_modes: ["250g", "500g", "1000g", "1500g", "2000g"],
      arp_rates: ["/8", "/4", "/2", "x1", "x2", "x4"],
    }
  },
  async created() {
    // Kept out of data(): MIDI port objects must not be wrapped in reactive proxies
    this.chainTracker = new MidiChainTracker((length) => this.chainLengthChanged(length));
    this.chainTracker.start();
    // Firmware with the new protocol answers its STATE request, the old commands are used otherwise
    this.notificationTimers = {};
    this.settingsProtocol = new SettingsProtocol(
        (active) => this.settings_protocol_active = active,
        (device, id, value) => this.settingChanged(device, id, value));
    this.settingsProtocol.start();

    if (!localStorage.getItem(this.id)) {
      localStorage.setItem(this.id, "1")
    }

    this.db = new ScalesDb();
    await this.db.openDB();

    this.patches = await this.db.getPatch();
    this.patch_id = parseInt(localStorage.getItem(this.id));

    await this.loadData()
    this.forceRerender++;
    this.page_is_inited = true

  },
  mounted() {
    document.addEventListener( 'keyup', event => {
      if (event.code === 'Enter' && !this.is_loading) this.change_data_loader();
    })
    document.addEventListener( 'PatchChanged', async () => {
      await this.loadData();
      this.forceRerender++;
    })
    document.addEventListener("PatchSave",  async (ev) => {
      this.db.savePatch(localStorage.getItem(this.id), ev.detail)
      this.patches = await this.db.getPatch()
      this.patchRerender++;
    })
    document.addEventListener( 'PatchDelete', async () => {
      this.db.deletePatch(parseInt(localStorage.getItem(this.id)))
      localStorage.setItem(this.id, "1")
      this.patches = await this.db.getPatch()
      await this.loadData();
      this.forceRerender++;
    })

  },
  beforeUnmount() {
    this.chainTracker.stop();
    this.settingsProtocol.stop();
    Object.values(this.notificationTimers).forEach(clearTimeout);
  }

}
</script>

<style scoped>

</style>
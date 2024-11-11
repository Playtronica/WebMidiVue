<template>
  <LoaderComponent v-if="this.is_loading" :key="forceRerender"/>
  <h1 class="text-center">TouchMe change settings</h1>
  <DeviceSelector regex-name="TouchMe" @device_changed="(x) => {this.device = x} "/>
  <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id"/>
    <GroupOfCommands name-of-group="Scale">
      <template v-slot:objects>
        <SelectCommand :key="this.forceRerender" :list-of-variants="this.scales" :command-object="this.commands_data.Scale"/>
      </template>
      <template v-slot:description>
        <p>Scale - scale played from the device</p>
      </template>
    </GroupOfCommands>

    <GroupOfCommands name-of-group="Key">
      <template v-slot:objects v-if="!this.commands_data.customRange.value">
        <SliderCommand command-label="" :key="this.forceRerender" :command-object="this.commands_data.Key" :table-values="this.dig_to_nums"/>
      </template>
      <template v-slot:description>
        <p>Key - Start Note in default range (Disabled when custom range is active)</p>
      </template>
    </GroupOfCommands>

    <GroupOfCommands name-of-group="Velocity">
      <template v-slot:objects>
        <div class="row">
          <div class="col">
            <label for="humanizeSwitch">Humanize</label>
            <SwitchComponent id="humanizeSwitch" :model-value="this.commands_data.humanize" @update:model-value="newVal => {
                  this.isHumanize = newVal
                  forceRerender++
                }"/>
          </div>
          <div class="col">
            <label for="velocityDisableSwitch">Mute</label>
            <SwitchComponent id="velocityDisableSwitch" :model-value="this.commands_data.mute" @update:model-value="newVal => {
                  this.isMute = newVal
                }"/>
          </div>
        </div>
        <div v-if="!this.commands_data.mute.value">
          <div v-if="!this.commands_data.humanize.value">
            <SliderCommand :key="this.forceRerender"
                           :command-object="this.commands_data.maxVelocity"/>
          </div>
          <div v-else>
            <SliderRangeCommand :key="this.forceRerender"
                                :max-command-object="this.commands_data.maxVelocity"
                                :min-command-object="this.commands_data.minVelocity"/>
          </div>
        </div>
      </template>
      <template v-slot:description>
        <p>Velocity - pressing force</p>
        <p>Humanize - Velocity randomization at a controlled interval</p>
        <p>Mute - disable note generation from the channel</p>
      </template>
    </GroupOfCommands>

    <GroupOfCommands name-of-group="Notes Range">
      <template v-slot:objects>
        <div class="row">
          <div class="col">
            <label for="notesRangeSwitch">Custom Range</label>
            <SwitchComponent id="notesRangeSwitch" :model-value="this.commands_data.customRange" @update:model-value="newVal => {
                    this.customRange = newVal
                    forceRerender++
                  }"/>
          </div>
        </div>
        <div v-if="this.commands_data.customRange.value">
          <SliderRangeCommand :key="this.forceRerender"
                              :max-command-object="this.commands_data.highestNote"
                              :min-command-object="this.commands_data.lowestNote"/>
        </div>
      </template>
      <template v-slot:description>
        <p>Notes Range - Range of playable notes</p>
      </template>
    </GroupOfCommands>

    <button @mouseup="change_data_loader" :disabled="!this.device" class="btn btn-primary mb-1" style="width: 70%">Send</button>
    <button @click="this.createPreset" class="btn btn-primary mb-1" style="width: 70%">Create Preset</button>
    <UpdateFirmwareComponent repo="Playtronica/touchme-releases" :device="this.device"/>

    <FileDropArea name="Drop Preset Here" @get_drop="(e) => loadDataFromPreset(e)"/>
  <GroupOfCommands>
    <template v-slot:description>
      <p>Send - sending settings to the device</p>
      <p>Create Preset - saves settings to a file</p>
      <p>Drop Preset Here - you need to transfer the file there by drag drop, or by clicking on the button, select the settings file.</p>
    </template>
  </GroupOfCommands>
</template>

<script>

import SelectCommand from "@/components/MidiComponents/SelectCommand.vue";
import {sleep} from "@/assets/js/SysExCommand"
import GroupOfCommands from "@/components/MidiComponents/GroupOfCommands.vue";
import DeviceSelector from "@/components/MidiComponents/DeviceSelector.vue";
import SliderCommand from "@/components/MidiComponents/SliderCommand.vue";
import FileDropArea from "@/components/MidiComponents/FileDropArea.vue";
import {saveAs} from "@progress/kendo-file-saver";
import SwitchComponent from "@/components/MidiComponents/Switch.vue";
import SliderRangeCommand from "@/components/MidiComponents/SliderRangeCommand.vue";
import {TouchMeCommandsData, TouchMeDb} from "@/components/TouchMePage/TouchMeIDB";
import PatchSelector from "@/components/MidiComponents/PatchSelector.vue";
import {LoadFirmware} from "@/assets/js/LoadFirmware";
import UpdateFirmwareComponent from "@/components/MidiComponents/UpdateFirmwareComponent.vue";
import LoaderComponent from "@/components/MidiComponents/LoaderComponent.vue";


export default  {
  components: {
    LoaderComponent,
    UpdateFirmwareComponent,
    PatchSelector,
    SliderRangeCommand,
    SwitchComponent,
    FileDropArea,
    SliderCommand,
    DeviceSelector,
    GroupOfCommands,
    SelectCommand
  },
  props: {
    id: {
      type: String,
      required: true,
    }
  },
  methods: {
    LoadFirmware,
    change_data_loader() {
      if (!this.device) return
      sleep(100)
      this.is_loading = true;
      this.forceRerender++;

      setTimeout(function () {
        this.is_loading = false;
        this.forceRerender++;
      }.bind(this),2000)

      setTimeout(function () {
        this.device.send([240, 11, 20, 13, 0, 247])
        this.sendDataTest()
        sleep(100)
        this.sendData()
        this.device.send([240, 11, 20, 13, 1, 247])

      }.bind(this),10)

    },
    async sendData() {
      for (let comm in this.commands_data) {
          this.commands_data[comm].sendToMidi(this.device)
          sleep(100);
      }
      this.saveData()
    },
    async sendDataTest() {
      for (let comm in this.commands_data) {
        this.commands_data[comm].sendToMidi(this.device, [20, 13])
        sleep(100);
      }
      this.saveData()
    },
    async saveData() {
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
    async loadDataFromPreset(e) {
      await this.patchChanged();
      for (let item of JSON.parse(e).commands) {
        this.commands_data[item.name].set_value(item.value);
      }
      this.saveData();
      this.forceRerender++;
    },
    async createPreset() {
      let state = []
      for (let item in this.commands_data) {
        state.push(this.commands_data[item].toShortDict())
      }

      let value = {"commands": state}
      let myFile = new File([JSON.stringify(value)], "touchme-preset.txt",
          {type: "text/plain;charset=utf-8"})
      saveAs(myFile, "touchme-preset.txt");
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
  },
  data() {
    return {
      scales: ["Major", "Minor", "Chrom", "Dorian", "Mixolydian",
        "Lydian", "Wholetone", "Minblues", "Majblues", "Minpen",
        "Majpen", "Diminished"],
      dig_to_nums: {
        1: 'C3', 2: 'C#3', 3: 'D3', 4: 'D#3', 5: 'E3', 6: 'F3',
        7: 'F#3', 8: 'G3', 9: 'G#3', 10: 'A3', 11: 'A#3', 12: 'B3'
      },
      device: null,
      forceRerender: 0,
      patchRerender: 0,
      isHumanize: false,
      isMute: false,
      customRange: false,
      db: {
        type: TouchMeDb
      },
      patches: [],
      patch_id: 0,
      is_loading: false,
      commands_data: Object.fromEntries(TouchMeCommandsData)
    }
  },
  async created() {
    if (!localStorage.getItem(this.id)) {
      localStorage.setItem(this.id, "1")
    }

    this.db = new TouchMeDb();
    await this.db.openDB();

    this.patches = await this.db.getPatch();
    this.patch_id = parseInt(localStorage.getItem(this.id));

    await this.loadData()
    this.forceRerender++;
  },
  async mounted() {
    document.addEventListener( 'keyup', event => {
      if (event.code === 'Enter' && !this.is_loading) this.change_data_loader();
    })
    document.addEventListener( 'InputChanged', async () => {
      await this.patchChanged();
      this.patchRerender++;
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
  }
}
</script>

<style scoped>

</style>
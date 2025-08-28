<template>
  <LoaderComponent v-if="this.is_loading" :key="forceRerender"/>
  <h1 class="text-center">TouchMe Settings ⚙️</h1>

  <DeviceSelector regex-name="TouchMe" @device_changed="(x) => {this.device = x} " text_label="🔌 Select Device" check-versions-flag class="m-2"/>
  <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id" text_label="📂 Preset" class="m-2"/>

  <div class="row gx-1 mb-5">
    <div class="col">
      <button @mouseup="change_data_loader" :disabled="!this.device" class="btn btn-primary w-100 h-100">❇️ Send to Device</button>
    </div>
    <div class="col">
      <button @click="this.createPreset" class="btn btn-primary w-100 h-100">💾 Save Preset</button>
    </div>
    <div class="col">
      <UpdateFirmwareComponent class="w-100 h-100" text="🔄 Update Firmware" repo="Playtronica/touchme-releases" :device="this.device"/>
    </div>

    <div class="col">
      <FileDropArea name="📂 Load Preset" @get_drop="(e) => loadDataFromPreset(e)"/>
    </div>
  </div>

  <BootstrapCollapse name_of_collapse="TouchMe settings" open_by_default>
    <template v-slot:objects>
      <GroupOfCommands>
        <template v-slot:objects>
          <div class="row m-2">
            <div class="col">
              <SwitchComponent
                  id="humanizeSwitch"
                  command-label="🧍Humanize"
                  :command-object="this.commands_data.humanize"
                  @update:model-value="newVal => {
                  this.isHumanize = newVal
                  forceRerender++
                }"
                  @input-changed="this.sys_ex_changed"
                  description="Adds natural variations to note velocity, making the music sound less robotic and more like a real person playing an instrument."
              />
            </div>
            <div class="col">
              <SwitchComponent
                  id="velocityDisableSwitch"
                  command-label="🔇 Mute"
                  :command-object="this.commands_data.mute"
                  @update:model-value="newVal => {
                  this.isMute = newVal
                }"
                  @input-changed="this.sys_ex_changed"
                  description="Disable note generation from the channel"
              />
            </div>
            <div class="col">
              <SwitchComponent
                  id="notesRangeSwitch"
                  command-label="🎶 Custom Range"
                  :command-object="this.commands_data.customRange"
                  @update:model-value="newVal => {
                    this.customRange = newVal
                    forceRerender++
                  }"
                  @input-changed="this.sys_ex_changed"
                  description="Adds note range customization."
              />
            </div>
          </div>

          <SelectCommand
              :key="this.forceRerender"
              :list-of-variants="this.scales"
              :command-object="this.commands_data.Scale"
              @input-changed="this.sys_ex_changed"
              command-label="🎼 Scale"
              description="A set of notes that shape the melody and feel of the music. Choose a scale to define the sound of your composition."
              class="m-3"
          />

          <SliderCommand
              command-label="🎹 Root Note"
              :key="this.forceRerender"
              :command-object="this.commands_data.Key"
              :table-values="this.dig_to_nums"
              @input-changed="this.sys_ex_changed"
              description="This is your starting note—like picking the key on a piano. All other notes follow from here based on the scale you chose."
              class="m-2"
          />

          <div v-if="!this.commands_data.mute.value">
            <div v-if="!this.commands_data.humanize.value">
              <SliderCommand :key="this.forceRerender"
                             :command-object="this.commands_data.maxVelocity"
                             @input-changed="this.sys_ex_changed"
                             command-label="💪 Note velocity"
                             description="Intensity range of of notes (volume, expression)."
                             class="m-2"
              />
            </div>
            <div v-else>
              <SliderRangeCommand :key="this.forceRerender"
                                  :max-command-object="this.commands_data.maxVelocity"
                                  :min-command-object="this.commands_data.minVelocity"
                                  @input-changed="this.sys_ex_changed"
                                  command-label="💪 Note velocity"
                                  description="Intensity range of of notes (volume, expression)."
                                  class="m-2"
              />
            </div>
          </div>

          <div v-if="this.commands_data.customRange.value">
            <SliderRangeCommand :key="this.forceRerender"
                                :max-command-object="this.commands_data.highestNote"
                                :min-command-object="this.commands_data.lowestNote"
                                @input-changed="this.sys_ex_changed"
                                command-label="🎶 Notes Range"
                                description="Adjust your note range."
                                class="m-2"
            />
          </div>

          <SliderCommand
              command-label="🎛️ MIDI channel"
              :key="this.forceRerender"
              :command-object="this.commands_data.channel"
              @input-changed="this.sys_ex_changed"
              description="Pick a midi channel that the plant would be on"
              class="m-2"
          />
        </template>
      </GroupOfCommands>
    </template>
  </BootstrapCollapse>

</template>

<script>

import SelectCommand from "@/components/MidiComponents/SelectCommand.vue";
import GroupOfCommands from "@/components/MidiComponents/GroupOfCommands.vue";
import DeviceSelector from "@/components/MidiComponents/DeviceSelector.vue";
import SliderCommand from "@/components/MidiComponents/SliderCommand.vue";
import FileDropArea from "@/components/MidiComponents/FileDropArea.vue";
import {saveAs} from "@progress/kendo-file-saver";
import SwitchComponent from "@/components/MidiComponents/Switch.vue";
import SliderRangeCommand from "@/components/MidiComponents/SliderRangeCommand.vue";
import PatchSelector from "@/components/MidiComponents/PatchSelector.vue";
import UpdateFirmwareComponent from "@/components/MidiComponents/UpdateFirmwareComponent.vue";
import LoaderComponent from "@/components/MidiComponents/LoaderComponent.vue";
import {TouchMeCommandsData, TouchMeDb} from "@/components/TouchMePage/TouchMeIDB";
import {sleep} from "@/assets/js/SysExCommand";
import BootstrapCollapse from "@/components/BootstrapCollapse.vue";


export default  {
  name: "TouchMePageUpdated",
  components: {
    BootstrapCollapse,
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
        this.sendData()
        this.device.send([240, 11, 20, 13, 1, 247])

      }.bind(this),10)
    },
    async sendData() {
      for (let comm in this.commands_data) {
        this.commands_data[comm].sendToMidi(this.device)
        sleep(100);
      }
      await this.saveData()
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
        console.log(key);
        console.log(this.commands_data);
        console.log(this.commands_data[key]);
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

    async sys_ex_changed(object) {
      await this.patchChanged();
      if (this.device) {
        await object.sendToMidi(this.device)
      }
      this.forceRerender++;
      this.patchRerender++;
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
.buttons_block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
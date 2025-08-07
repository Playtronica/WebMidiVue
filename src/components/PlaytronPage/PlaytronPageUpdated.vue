<template class="row">
  <LoaderComponent v-if="this.is_loading" :key="forceRerender"/>

  <h1 class="text-center">Playtron change settings</h1>
  <DeviceSelector regex-name="Biotron" @device_changed="(x) => {this.device = x} " text_label="🔌 Select Device" check-versions-flag/>
  <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id" text_label="📂 Preset"/>
  <div class="row gx-1 mb-5">
    <div class="col">
      <button @mouseup="change_data_loader" :disabled="!this.device" class="btn btn-primary w-100 h-100">🚀 Send Settings</button>
    </div>
    <div class="col">
      <button @click="this.createPreset" class="btn btn-primary w-100 h-100">💾 Save Preset</button>
    </div>
    <div class="col">
      <UpdateFirmwareComponent class="w-100 h-100" text="🔄 Update Firmware" repo="Playtronica/biotron-firmware" :device="this.device"/>
    </div>

    <div class="col">
      <FileDropArea name="📥 Load Preset" @get_drop="(e) => loadDataFromPreset(e)"/>
    </div>
  </div>

  <BootstrapCollapse name_of_collapse="🎹 Playtron Settings" open_by_default>
    <template v-slot:objects>
      <GroupOfCommands name-of-group="🎵 Notes for Pad" class="row justify-content-center m-1" 
      description="Click any box in the grid to assign a new MIDI note to that pad. Mix and match high and low notes to build your perfect layout!">
        <template v-slot:objects>
          <div class="grid-container center" :key="this.forceRerender">
            <SliderCommand :command-label="value"
                           v-for="(value, key) in this.num_to_pad" v-bind:key="key"
                           :command-object="this.find_sys_ex('Note', this.num_to_pad[key])"
                           :slider_active="false" @input-changed="this.sys_ex_changed"/>
          </div>
        </template>
      </GroupOfCommands>

      <GroupOfCommands>
        <template v-slot:objects>
          <SliderCommand
              :key="this.forceRerender"
              :command-object="this.commands_data.channel"
              command-label="🎚️ MIDI Channel"
              description="Slide to choose channels <br>1–16.<br>
               🔀 What it does: Routes your pads to the correct instrument track—channel 1 for piano, 10 for drums, and so on!"
              @input-changed="this.sys_ex_changed"/>
        </template>
      </GroupOfCommands>
    </template>
  </BootstrapCollapse>

</template>

<script>

import PatchSelector from "@/components/MidiComponents/PatchSelector.vue";
import DeviceSelector from "@/components/MidiComponents/DeviceSelector.vue";
import {PlaytronCommandsData, PlaytronDb} from "@/components/PlaytronPage/PlaytronIDB";
import {sleep} from "@/assets/js/SysExCommand";
import LoaderComponent from "@/components/MidiComponents/LoaderComponent.vue";
import {saveAs} from "@progress/kendo-file-saver";
import GroupOfCommands from "@/components/MidiComponents/GroupOfCommands.vue";
import SliderCommand from "@/components/MidiComponents/SliderCommand.vue";
import FileDropArea from "@/components/MidiComponents/FileDropArea.vue";
import UpdateFirmwareComponent from "@/components/MidiComponents/UpdateFirmwareComponent.vue";
import BootstrapCollapse from "@/components/BootstrapCollapse.vue";

export default  {
  components: {
    BootstrapCollapse,
    UpdateFirmwareComponent,
    FileDropArea,
    SliderCommand,
    GroupOfCommands,
    LoaderComponent,
    PatchSelector,
    DeviceSelector,
  },
  computed: {

  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      device: null,
      patches: [],
      patch_id: 0,
      is_loading: false,
      commands_data: Object.fromEntries(PlaytronCommandsData),
      forceRerender: 0,
      patchRerender: 0,
      num_to_pad: {
        36: "C3", 37: "C#3", 38: "D3", 39: "D#3",
        40: "E3", 41: "F3", 42: "F#3", 43: "G3",
        44: "G#3", 45: "A3", 46: "A#3", 47: "B3",
        48: "C4", 49: "C#4", 50: "D4", 51: "D#4"
      },
      chosen_pad: 36,
    }
  },
  methods: {
    find_sys_ex(task, note) {
      return this.commands_data[`${task}_${note}`]
    },
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
      if (this.device) {
        this.device.send([240, 11, 20, 13, 126, 247]);
        sleep(100);
        let extraComp = []

        for (let comm in this.commands_data) {
          if (!extraComp.includes(comm)) {
            this.commands_data[comm].sendToMidi(this.device)
            sleep(100);
          }
        }
        sleep(100);
        this.device.send([240, 11, 20, 13, 126, 247]);
      }
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
      let myFile = new File([JSON.stringify(value)], "playtron-preset.txt",
          {type: "text/plain;charset=utf-8"})
      saveAs(myFile, "playtron-preset.txt");
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
    saveData() {
      let state = {}
      for (let val of Object.values(this.commands_data)) {
        state[val.name] = val.value
      }

      this.db.updatePatch(localStorage.getItem(this.id), state)
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
  async created() {
    if (!localStorage.getItem(this.id)) {
      localStorage.setItem(this.id, "1")
    }

    this.db = new PlaytronDb();
    await this.db.openDB();

    this.patches = await this.db.getPatch();
    this.patch_id = parseInt(localStorage.getItem(this.id));

    await this.loadData()

    this.forceRerender++;
  },
  mounted() {
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
.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 50vh;
  //gap: 10px;
}

.buttons_block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}


</style>
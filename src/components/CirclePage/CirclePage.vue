<template>
  <LoaderComponent v-if="this.is_loading" :key="forceRerender"/>
  <h1 class="text-center">Circle of Fifths</h1>
  <DeviceSelector regex-name="Circle" @device_changed="(x) => {this.device = x}" text_label="🔌 Select Device" class="m-2" check-versions-flag/>
  <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id" text_label="📂 Preset" class="m-2"/>
  <div class="row gx-1 mb-5">
    <div class="col">
      <button @mouseup="change_data_loader" :disabled="!this.device" class="btn btn-primary w-100 h-100">SEND</button>
    </div>
    <div class="col">
      <button @click="this.createPreset" class="btn btn-primary w-100 h-100">SAVE</button>
    </div>
    <div class="col">
      <FileDropArea name="UPLOAD" @get_drop="(e) => loadDataFromPreset(e)"/>
    </div>
  </div>

  <div>
    <BootstrapCollapse name_of_collapse="Arpeggiator Settings" open_by_default>
      <template v-slot:objects>
        <GroupOfCommands>
          <template v-slot:objects>
            <SliderCommand
                command-label="BPM"
                :key="this.forceRerender"
                :command-object="this.commands_data.bpm"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />

            <SliderCommand
                command-label="Octave"
                :key="this.forceRerender"
                :command-object="this.commands_data.octave"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />

            <SliderCommand
                command-label="Transpose"
                :key="this.forceRerender"
                :command-object="this.commands_data.transpose"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />

            <SliderCommand
                command-label="Note Count"
                :key="this.forceRerender"
                :command-object="this.commands_data.note_count"
                @input-changed="this.sys_ex_changed"
                description="0 = use chord default"
                class="m-2"
            />

            <SelectCommand
                command-label="Play Mode"
                :key="this.forceRerender"
                :list-of-variants="this.play_modes"
                :command-object="commands_data.play_mode"
                @input-changed="this.sys_ex_changed"
                class="m-3"
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
import LoaderComponent from "@/components/MidiComponents/LoaderComponent.vue";
import BootstrapCollapse from "@/components/BootstrapCollapse.vue";
import {CircleCommandsData, CircleDb} from "@/components/CirclePage/CircleIDB";
import SliderCommand from "@/components/MidiComponents/SliderCommand.vue";
import SelectCommand from "@/components/MidiComponents/SelectCommand.vue";

export default {
  components: {
    SelectCommand,
    SliderCommand,
    BootstrapCollapse,
    LoaderComponent,
    DeviceSelector,
    PatchSelector,
    GroupOfCommands,
    FileDropArea,
  },
  props: {
    id: {
      type: String,
      required: true,
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
      }.bind(this), 3000)

      setTimeout(function () {
        this.sendData()
      }.bind(this), 10)
    },

    async sendData() {
      if (this.device) {
        for (let comm in this.commands_data) {
          this.commands_data[comm].sendToMidi(this.device)
          sleep(100);
        }
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
      let myFile = new File([JSON.stringify(value)], "circle-preset.txt",
          {type: "text/plain;charset=utf-8"})
      saveAs(myFile, "circle-preset.txt");
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
        await object.sendToMidi(this.device)
      }

      this.forceRerender++;
      this.patchRerender++;
    },
  },
  data() {
    return {
      device: null,
      forceRerender: 0,
      patchRerender: 0,
      db: { type: CircleDb },
      patches: [],
      patch_id: 0,
      is_loading: false,
      commands_data: Object.fromEntries(CircleCommandsData),
      play_modes: ["Arpeggiator", "Strum"],
    }
  },
  async created() {
    if (!localStorage.getItem(this.id)) {
      localStorage.setItem(this.id, "1")
    }

    this.db = new CircleDb();
    await this.db.openDB();

    this.patches = await this.db.getPatch();
    this.patch_id = parseInt(localStorage.getItem(this.id));

    await this.loadData()
    this.forceRerender++;
  },
  mounted() {
    document.addEventListener('keyup', event => {
      if (event.code === 'Enter' && !this.is_loading) this.change_data_loader();
    })
    document.addEventListener('PatchChanged', async () => {
      await this.loadData();
      this.forceRerender++;
    })
    document.addEventListener("PatchSave", async (ev) => {
      this.db.savePatch(localStorage.getItem(this.id), ev.detail)
      this.patches = await this.db.getPatch()
      this.patchRerender++;
    })
    document.addEventListener('PatchDelete', async () => {
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

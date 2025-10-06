<template>
  <LoaderComponent v-if="this.is_loading" :key="forceRerender"/>
  <h1 class="text-center">Scales change settings</h1>
  <DeviceSelector regex-name="Scales" @device_changed="(x) => {this.device = x}" class="m-2"/>
  <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id" class="m-2"/>
  <div class="row gx-1 mb-5">
    <div class="col">
      <button @mouseup="change_data_loader" :disabled="!this.device" class="btn btn-primary w-100 h-100">SEND</button>
    </div>
    <div class="col">
      <button @click="this.createPreset" class="btn btn-primary w-100 h-100">SAVE</button>
    </div>
    <div class="col">
      <UpdateFirmwareComponent class="w-100 h-100" text="FIRMWARE UPDATE" repo="Playtronica/scales-firmware" :device="this.device" disabled/>
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
                :key="this.forceRerender"
                :command-object="this.commands_data.bpm"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />
            <SliderCommand
                command-label="Sensitivity"
                :key="this.forceRerender"
                :command-object="this.commands_data.sensitivity"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />

            <SelectCommand
                command-label="🎼 Scale"
                :key="this.forceRerender"
                :list-of-variants="this.scales"
                :command-object="commands_data.scale"
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
import {ScalesCommandsData, ScalesDb} from "@/components/ScalesPage/ScalesIDB";
import SliderCommand from "@/components/MidiComponents/SliderCommand.vue";
import SelectCommand from "@/components/MidiComponents/SelectCommand.vue";
import ColorPicker from "@/components/MidiComponents/ColorPicker.vue";



export default  {
  components: {
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
        sleep(100)
        this.sendDataDeprecated()
      }.bind(this),10)

    },

    async sendData() {
      if (this.device) {
        this.device.send([240, 11, 20, 13, 126, 247]);
        sleep(100);
        let extraComp = []

        extraComp.push("plantBpm");
        for (let comm in this.commands_data) {
          if (!extraComp.includes(comm)) {
            this.commands_data[comm].sendToMidi(this.device)
            sleep(100);
          }
        }
        sleep(100);
        this.device.send([240, 11, 20, 13, 126, 247]);
        sleep(100);
        this.commands_data.plantBpm.sendToMidi(this.device)
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
        await object.sendToMidi(this.device)
      }

      this.forceRerender++;
      this.patchRerender++;
    },
  },
  data() {
    return {
      page_is_inited: false,
      device: null,
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
    }
  },
  async created() {
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

  }

}
</script>

<style scoped>

</style>
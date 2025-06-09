<template>
  <LoaderComponent v-if="this.is_loading" :key="forceRerender"/>
  <div>
    <h1 class="text-center">Biotron change settings</h1>
    <DeviceSelector regex-name="Biotron" @device_changed="(x) => {this.device = x} "/>
    <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id"/>
    <button @mouseup="change_data_loader" :disabled="!this.device" class="btn btn-primary mb-1" style="width: 70%">SEND</button>
    <button @click="this.createPreset" class="btn btn-primary mb-1" style="width: 70%">SAVE</button>
    <UpdateFirmwareComponent text="FIRMWARE UPDATE" repo="Playtronica/biotron-firmware" :device="this.device"/>
  </div>

  <FileDropArea name="Upload" @get_drop="(e) => loadDataFromPreset(e)"/>

  <div>
    <h1>PLANT SENSOR</h1>
    <GroupOfCommands name-of-group="COMPOSITION">
      <template v-slot:objects>
        <div class="row">
          <label for="plantVelDis">🔇 MUTE</label>
          <SwitchComponent
              id="plantVelDis"
              :command-object="commands_data.plant_no_velocity"
              @input-changed="this.sys_ex_changed"
          />
        </div>

        <SliderCommand
            command-label="🌱 The Beat"
            :key="this.forceRerender"
            :command-object="this.commands_data.plantBpm"
            @input-changed="this.sys_ex_changed"
        />

        <SliderCommand
            command-label="🎵 Note Hold"
            :key="this.forceRerender"
            :command-object="this.commands_data.noteOffPercent"
            :table-values="this.fractions_note_off"
            @input-changed="this.sys_ex_changed"
            table-values-reversed
        />

        <SliderCommand
            command-label="🏠︎ Home Note"
            :key="this.forceRerender"
            :command-object="this.commands_data.middle_plant_note"
            :table-values="this.root_note_id"
            @input-changed="this.sys_ex_changed"
        />

        <SelectCommand
            command-label="🎼 Scale"
            :key="this.forceRerender"
            :list-of-variants="this.scales"
            :command-object="commands_data.scale"
            @input-changed="this.sys_ex_changed"
        />

      </template>
    </GroupOfCommands>
  </div>

  <div>
    <div class="toggle-label" data-bs-toggle="collapse" href="#more_fun_window" role="button" aria-expanded="false"
         aria-controls="more_fun_window">
      <h1>
        MORE FUN
      </h1>
      <hr/>
    </div>

    <div class="collapse mt-2" id="more_fun_window">
      <GroupOfCommands name-of-group="NOTE VELOCITY">
        <template v-slot:objects>
          <div class="row">
            <div class="col">
              <label for="randomPlantVelSwitch">🧍Humanize</label>
              <SwitchComponent
                  id="randomPlantVelSwitch"
                  :command-object="this.commands_data.randomPlantVelocity"
                  @input-changed="this.sys_ex_changed"
              />
            </div>
          </div>

          <div v-if="!commands_data.plant_no_velocity.value">
            <div v-if="!this.commands_data.randomPlantVelocity.value">
              <SliderCommand :key="this.forceRerender"
                             :command-object="commands_data.maxPlantVelocity"
                             @input-changed="this.sys_ex_changed"
                             command-label="💪 Note velocity "
              />
            </div>
            <div v-else>
              <SliderRangeCommand :key="this.forceRerender"
                                  :max-command-object="commands_data.maxPlantVelocity"
                                  :min-command-object="commands_data.minPlantVelocity"
                                  @input-changed="this.sys_ex_changed"
                                  command-label="💪 Note velocity "
              />
            </div>
          </div>
        </template>
      </GroupOfCommands>
      <GroupOfCommands name-of-group="SENSITIVITY">
        <template v-slot:objects>
          <div class="row">
            <div class="col">
              <label> 📡 Ultra sensitivity</label>
              <SwitchComponent
                  :key="this.forceRerender"
                  :command-object="commands_data.randomness"
                  @input-changed="this.sys_ex_changed"
              />
            </div>
            <div class="col">
              <label>✋ Manual control</label>
              <SwitchComponent
                  :key="this.forceRerender"
                  :command-object="commands_data.performance"
                  @input-changed="this.sys_ex_changed"
              />
            </div>
          </div>

          <SliderCommand
              :key="this.forceRerender"
              :command-object="commands_data.same_note_plant"
              command-label="🔂 Note Repeat"
              @input-changed="this.sys_ex_changed"
          />
          <SliderCommand
              command-label="🌞 Wake-Up"
              :key="this.forceRerender"
              :command-object="this.commands_data.firstValue"
              @input-changed="this.sys_ex_changed"
          />
          <SliderCommand
              command-label="👣 Step Size"
              :key="this.forceRerender"
              :command-object="this.commands_data.noteDistance"
              @input-changed="this.sys_ex_changed"
          />
          <SliderCommand
              command-label="⏳ Delay"
              :key="this.forceRerender"
              :command-object="this.commands_data.smoothness"
              @input-changed="this.sys_ex_changed"
          />
        </template>
      </GroupOfCommands>
    </div>
  </div>

  <div>
    <div class="toggle-label" data-bs-toggle="collapse" href="#light_sensor" role="button" aria-expanded="false"
         aria-controls="light_sensor">
      <h1>
        LIGHT SENSOR
      </h1>
      <hr/>
    </div>

    <div class="collapse mt-2" id="light_sensor">
      <GroupOfCommands>
        <template v-slot:objects>
          <div class="row">
            <div class="col">
              <label for="lightVelDis">🔇Unmute</label>
              <SwitchComponent
                  id="lightVelDis"
                  :command-object="commands_data.light_no_velocity"
                  @input-changed="this.sys_ex_changed"
              />
            </div>
            <div class="col">
              <label for="randomLightVelSwitch">🧍Humanize</label>
              <SwitchComponent
                  id="randomLightVelSwitch"
                  :command-object="this.commands_data.randomLightVelocity"
                  @input-changed="this.sys_ex_changed"
              />
            </div>
            <div class="col">
              <label for="light_pitch_mode">Pitch Bend</label>
              <SwitchComponent
                  id="light_pitch_mode"
                  :command-object="this.commands_data.light_pitch_mode"
                  @input-changed="this.sys_ex_changed"
              />
            </div>
          </div>



          <SliderCommand
              command-label="☀️Light Bpm"
              :key="this.forceRerender"
              :command-object="this.commands_data.lightBpm"
              @input-changed="this.sys_ex_changed"
          />

          <SliderCommand
              :key="this.forceRerender"
              :command-object="commands_data.same_note_light"
              command-label="🔂Note Repeat"
              @input-changed="this.sys_ex_changed"
          />

          <div class="row" v-if="!commands_data.light_no_velocity.value">
            <div v-if="!this.commands_data.randomLightVelocity.value">
              <SliderCommand
                  :key="this.forceRerender"
                  :command-object="commands_data.maxLightVelocity"
                  @input-changed="this.sys_ex_changed"
                  :name="commands_data.maxLightVelocity.value"
                  command-label="💪 Note velocity"
              />
            </div>
            <div v-else>
              <SliderRangeCommand
                  :key="this.forceRerender"
                  :max-command-object="commands_data.maxLightVelocity"
                  :min-command-object="commands_data.minLightVelocity"
                  @input-changed="this.sys_ex_changed"
                  command-label="💪 Note velocity"
              />
            </div>
          </div>

          <SliderCommand
              v-if="!this.commands_data.light_pitch_mode.value"
              :key="this.forceRerender"
              :command-object="this.commands_data.range_light_note"
              @input-changed="this.sys_ex_changed"
          />
        </template>
      </GroupOfCommands>
    </div>
  </div>
</template>

<script>

import { sleep } from "@/assets/js/SysExCommand"

import { saveAs } from '@progress/kendo-file-saver';
import {BiotronCommandsData, BiotronDb} from "@/components/BiotronPage/BiotronIDB"
import FileDropArea from "@/components/MidiComponents/FileDropArea.vue";
import GroupOfCommands from "@/components/MidiComponents/GroupOfCommands.vue";
import SwitchComponent from "@/components/MidiComponents/Switch.vue";
import SliderCommand from "@/components/MidiComponents/SliderCommand.vue";
import SliderRangeCommand from "@/components/MidiComponents/SliderRangeCommand.vue";
import SelectCommand from "@/components/MidiComponents/SelectCommand.vue";
import PatchSelector from "@/components/MidiComponents/PatchSelector.vue";
import DeviceSelector from "@/components/MidiComponents/DeviceSelector.vue";
import UpdateFirmwareComponent from "@/components/MidiComponents/UpdateFirmwareComponent.vue";
import LoaderComponent from "@/components/MidiComponents/LoaderComponent.vue";





export default  {
  components: {
    LoaderComponent,
    UpdateFirmwareComponent,
    DeviceSelector,
    PatchSelector,
    SelectCommand,
    SliderRangeCommand,
    SliderCommand,
    SwitchComponent,
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
    async sendDataDeprecated() {
      if (this.device) {
        this.device.send([240, 11, 16, 127, 247])
        let extraComp = []

        extraComp.push("plantBpm");
        for (let comm in this.commands_data) {
          if (!extraComp.includes(comm)) {
            this.commands_data[comm].sendToMidi(this.device, [11])
            sleep(100);
          }
        }
        this.device.send([240, 11, 126, 247]);
        sleep(100);
        this.commands_data.plantBpm.sendToMidi(this.device, [11])
      }
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
      let myFile = new File([JSON.stringify(value)], "biotron-preset.txt",
          {type: "text/plain;charset=utf-8"})
      saveAs(myFile, "biotron-preset.txt");
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
    async sys_ex_changed() {
      await this.patchChanged();
      this.forceRerender++;
      this.patchRerender++;
    },
  },
  data() {
    return {
      page_is_inited: false,
      scales: ["Major", "Minor", "Chrom", "Dorian", "Mixolydian",
        "Lydian", "Wholetone", "Minblues", "Majblues", "Minpen",
        "Majpen", "Diminished"],
      root_note_id: {
        60: 'C4', 61: 'C#4', 62: 'D4', 63: 'D#4', 64: 'E4', 65: 'F4',
        66: 'F#4', 67: 'G4', 68: 'G#4', 69: 'A4', 70: 'A#4', 71: 'B4', 72: 'C5',
      },
      fractions_note_off: {
        64: "1/64", 48: "1/48", 32: "1/32", 24: "1/24", 16: "1/16", 12: "1/12",
        8: "1/8", 6: "1/6", 4: "1/4", 2: "1/2", 1: "1"
      },
      device: null,
      forceRerender: 0,
      patchRerender: 0,
      db: {
        type: BiotronDb
      },
      patches: [],
      patch_id: 0,
      is_loading: false,
      commands_data: Object.fromEntries(BiotronCommandsData),
    }
  },
  async created() {
    if (!localStorage.getItem(this.id)) {
      localStorage.setItem(this.id, "1")
    }

    this.db = new BiotronDb();
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
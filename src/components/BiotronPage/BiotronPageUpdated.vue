<template>
  <LoaderComponent v-if="this.is_loading" :key="forceRerender"/>

    <DeviceTaskNav
        v-if="betaBuild"
        device-name="Biotron"
        active-task="settings"
        play-route="/biotron/play"
        settings-route="/biotron"
    />
    <h1 class="text-center">{{ betaBuild ? 'Settings' : 'Biotron Settings ⚙️' }}</h1>
    <DeviceSelector
        ref="deviceSelector"
        regex-name="Biotron"
        @device_changed="handleDeviceChanged"
        @calibration_state="handleCalibrationState"
        text_label="🔌 Select Device"
        check-versions-flag
        allow-daw-handoff
        class="m-2"
    />
    <div v-if="betaBuild" class="calibration-control mx-2 mb-3">
      <button
          type="button"
          class="btn btn-outline-primary"
          @click="startCalibration"
          :disabled="!device || calibrationBusy"
      >{{ calibrationBusy ? 'Calibrating…' : 'Calibrate plant again' }}</button>
      <span
          v-if="calibrationMessage"
          class="calibration-control__status"
          :class="{'calibration-control__status--active': calibrationBusy}"
          role="status"
          aria-live="polite"
      >{{ calibrationMessage }}</span>
    </div>
    <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id"  text_label="📂 Preset" class="m-2"/>
    <div class="row gx-1 mb-5">
      <div class="col">
        <button @mouseup="change_data_loader" :disabled="!this.device" class="btn btn-primary w-100 h-100">❇️ Send to Device</button>
      </div>
      <div class="col">
        <button @click="this.createPreset" class="btn btn-primary w-100 h-100">💾 Save Preset</button>
      </div>
      <div class="col">
        <UpdateFirmwareComponent class="w-100 h-100" text="🔄 Update Firmware" repo="Playtronica/biotron-firmware" :device="this.device"/>
      </div>

      <div class="col">
        <FileDropArea name="📂 Load Preset" @get_drop="(e) => loadDataFromPreset(e)"/>
      </div>
    </div>

  <div>
    <BootstrapCollapse name_of_collapse="PLANT SENSOR" open_by_default>
      <template v-slot:objects>
        <GroupOfCommands>
          <template v-slot:objects>
            <div class="row m-2">
              <SwitchComponent
                  id="plantVelDis"
                  command-label="🔇 MUTE"
                  description="Turns off notes coming off plant sensor."
                  :command-object="commands_data.plant_no_velocity"
                  @input-changed="this.sys_ex_changed"
              />
            </div>

            <SliderCommand
                command-label="🌱 The Beat"
                :key="this.forceRerender"
                :command-object="this.commands_data.plantBpm"
                description="Set tempo of plant notes, plant’s BPM."
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />

            <SliderCommand
                command-label="🎵 Note Hold"
                :key="this.forceRerender"
                :command-object="this.commands_data.noteOffPercent"
                :table-values="this.fractions_note_off"
                description="How long a note plays before stopping (100 = full length, 50 = half, 0 = very short)."
                @input-changed="this.sys_ex_changed"
                table-values-reversed
                class="m-2"
            />

            <SliderCommand
                command-label="🏠︎ Home Note"
                :key="this.forceRerender"
                :command-object="this.commands_data.middle_plant_note"
                :table-values="this.root_note_id"
                description="The main note everything starts from and returns to."
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />

            <SelectCommand
                command-label="🎼 Scale"
                :key="this.forceRerender"
                :list-of-variants="this.scales"
                :command-object="commands_data.scale"
                @input-changed="this.sys_ex_changed"
                description="A set of notes that shape the melody and feel of the music. Choose a scale to define the sound of your composition."
                class="m-3"
            />

          </template>
        </GroupOfCommands>
      </template>
    </BootstrapCollapse>

  </div>

  <div>
    <BootstrapCollapse name_of_collapse="MORE FUN">
      <template v-slot:objects>
        <GroupOfCommands name-of-group="Plant Midi Channel">
          <template v-slot:objects>
            <SliderCommand
                command-label="🎛️ MIDI channel"
                description="Pick a midi channel that the plant would be on"
                :key="this.forceRerender"
                :command-object="this.commands_data.plant_midi_channel"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />
          </template>
        </GroupOfCommands>

        <GroupOfCommands name-of-group="Buttons Mode">
          <template v-slot:objects>
            <SwitchComponent
                id="randomPlantVelSwitch"
                command-label="Mute button state"
                description="Enables and disables mute button"
                :command-object="this.commands_data.button_mode_state"
                @input-changed="this.sys_ex_changed"

            />
          </template>
        </GroupOfCommands>

        <GroupOfCommands name-of-group="Swing note">
          <template v-slot:objects>
            <SliderCommand
                command-label="Swing note"
                description="Duration of the first note compare to BPM"
                :key="this.forceRerender"
                :command-object="this.commands_data.swing_first_note_percent"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />
          </template>
        </GroupOfCommands>

        <GroupOfCommands name-of-group="NOTE VELOCITY">
          <template v-slot:objects>
            <div class="row m-2">
              <div class="col">
                <SwitchComponent
                    id="randomPlantVelSwitch"
                    command-label="🧍Humanize"
                    description="Adds natural variations to note velocity, making the music sound less robotic and more like a real person playing an instrument."
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
                               command-label="💪 Note velocity"
                               description="Intensity range of of notes (volume, expression)."
                               class="m-2"
                />
              </div>
              <div v-else>
                <SliderRangeCommand :key="this.forceRerender"
                                    :max-command-object="commands_data.maxPlantVelocity"
                                    :min-command-object="commands_data.minPlantVelocity"
                                    @input-changed="this.sys_ex_changed"
                                    command-label="💪 Note velocity"
                                    description="Intensity range of of notes (volume, expression)"
                                    class="m-2"
                />
              </div>
            </div>
          </template>
        </GroupOfCommands>
        <GroupOfCommands name-of-group="SENSITIVITY">
          <template v-slot:objects>
            <div class="row m-2">
              <div class="col">
                <SwitchComponent
                    :key="this.forceRerender"
                    command-label="📡 Ultra sensitivity"
                    :command-object="commands_data.randomness"
                    @input-changed="this.sys_ex_changed"
                    description="Makes the plant more responsive."
                />
              </div>
              <div class="col">
                <SwitchComponent
                    :key="this.forceRerender"
                    command-label="✋ Manual control"
                    :command-object="commands_data.performance"
                    @input-changed="this.sys_ex_changed"
                    description="Plant only reacts to human interaction, doesn’t play by itself."
                />
              </div>
            </div>

            <SliderCommand
                :key="this.forceRerender"
                :command-object="commands_data.same_note_plant"
                command-label="🔂 Note Repeat"
                @input-changed="this.sys_ex_changed"
                description="Move near the plant to change notes (1 = small moves change notes, 10 = big moves needed). 🎶"
                class="m-2"
            />
            <SliderCommand
                command-label="🌞 Wake-Up"
                :key="this.forceRerender"
                :command-object="this.commands_data.firstValue"
                @input-changed="this.sys_ex_changed"
                description="A little change that wakes up the first note."
                class="m-2"
            />
            <SliderCommand
                command-label="👣 Step Size"
                :key="this.forceRerender"
                :command-object="this.commands_data.noteDistance"
                @input-changed="this.sys_ex_changed"
                description="How big a change is needed to go to the next note."
                class="m-2"
            />
            <SliderCommand
                command-label="⏳ Delay"
                :key="this.forceRerender"
                :command-object="this.commands_data.smoothness"
                @input-changed="this.sys_ex_changed"
                description="How quickly device reacts to change"
                class="m-2"
            />
          </template>
        </GroupOfCommands>
      </template>
    </BootstrapCollapse>
  </div>

  <div>
    <BootstrapCollapse name_of_collapse="LIGHT SENSOR">
      <template v-slot:objects>
        <GroupOfCommands>
          <template v-slot:objects>
            <div class="row m-2">
              <div class="col">
                <SwitchComponent
                    id="lightVelDis"
                    command-label="🔇Mute"
                    :command-object="commands_data.light_no_velocity"
                    @input-changed="this.sys_ex_changed"
                    description="Turns off notes coming off light sensor"
                />
              </div>
              <div class="col">
                <SwitchComponent
                    id="randomLightVelSwitch"
                    command-label="🧍Humanize"
                    :command-object="this.commands_data.randomLightVelocity"
                    @input-changed="this.sys_ex_changed"
                    description="Adds natural variations to note velocity, making the music sound less robotic and more like a real person playing an instrument."
                />
              </div>
              <div class="col">
                <SwitchComponent
                    id="light_pitch_mode"
                    command-label="〜 Pitch Bend"
                    :command-object="this.commands_data.light_pitch_mode"
                    @input-changed="this.sys_ex_changed"
                    description="Same as pitch bend wheel on your keyboard – makes sound wobbly"
                />
              </div>
            </div>

            <SliderCommand
                command-label="🎛️ MIDI channel"
                description="Pick a midi channel that the light would be on"
                :key="this.forceRerender"
                :command-object="this.commands_data.light_midi_channel"
                @input-changed="this.sys_ex_changed"
                class="m-2"
            />

            <SliderCommand
                command-label="🌞 The Beat"
                :key="this.forceRerender"
                :command-object="this.commands_data.lightBpm"
                @input-changed="this.sys_ex_changed"
                description="Set tempo of light sensor notes BPM"
                class="m-2"
            />

            <SliderCommand
                :key="this.forceRerender"
                :command-object="commands_data.same_note_light"
                command-label="🔂Note Repeat"
                @input-changed="this.sys_ex_changed"
                description="Change the light to change notes (1 = small moves change notes, 10 = big moves needed). 🎶"
                class="m-2"
            />

            <div class="row" v-if="!commands_data.light_no_velocity.value">
              <div v-if="!this.commands_data.randomLightVelocity.value">
                <SliderCommand
                    :key="this.forceRerender"
                    :command-object="commands_data.maxLightVelocity"
                    @input-changed="this.sys_ex_changed"
                    :name="commands_data.maxLightVelocity.value"
                    command-label="🔨 Note velocity"
                    description="Intensity range of of notes (volume, expression)"
                    class="m-2"
                />
              </div>
              <div v-else>
                <SliderRangeCommand
                    :key="this.forceRerender"
                    :max-command-object="commands_data.maxLightVelocity"
                    :min-command-object="commands_data.minLightVelocity"
                    @input-changed="this.sys_ex_changed"
                    command-label="🔨 Note velocity"
                    description="Intensity range of of notes (volume, expression)"
                    class="m-2"
                />
              </div>
            </div>

            <SliderCommand
                v-if="!this.commands_data.light_pitch_mode.value"
                :key="this.forceRerender"
                :command-object="this.commands_data.range_light_note"
                @input-changed="this.sys_ex_changed"
                command-label="📏 Range"
                description="How many notes are played relative to root note"
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
import {BiotronCommandsData, BiotronDb} from "@/components/BiotronPage/BiotronIDB"
import FileDropArea from "@/components/MidiComponents/FileDropArea.vue";
import GroupOfCommands from "@/components/MidiComponents/GroupOfCommands.vue";
import SwitchComponent from "@/components/MidiComponents/Switch.vue";
import SliderCommand from "@/components/MidiComponents/SliderCommand.vue";
import SliderRangeCommand from "@/components/MidiComponents/SliderRangeCommand.vue";
import SelectCommand from "@/components/MidiComponents/SelectCommand.vue";
import PatchSelector from "@/components/MidiComponents/PatchSelector.vue";
import DeviceSelector from "@biotron-device-selector";
import UpdateFirmwareComponent from "@/components/MidiComponents/UpdateFirmwareComponent.vue";
import LoaderComponent from "@/components/MidiComponents/LoaderComponent.vue";
import BootstrapCollapse from "@/components/BootstrapCollapse.vue";
import DeviceTaskNav from "@/components/DeviceTaskNav.vue";



export default  {
  components: {
    DeviceTaskNav,
    BootstrapCollapse,
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
    calibrationBusy() {
      return ["starting", "waiting", "measuring"].includes(this.calibrationState)
    }
  },
  methods: {
    handleDeviceChanged(device) {
      this.device = device
      if (!device && this.calibrationBusy) {
        this.calibrationState = "error"
        this.calibrationMessage = "Biotron disconnected — reconnect it and try again."
      }
    },
    startCalibration() {
      if (!this.device || this.calibrationBusy) return
      this.$refs.deviceSelector?.requestRecalibration()
    },
    handleCalibrationState(event) {
      const messages = {
        starting: "Starting…",
        waiting: "Step away and keep the plant still.",
        measuring: "Measuring… keep the plant and cables still.",
        ready: "Calibration complete — touch the plant.",
        unsupported: "This firmware cannot start calibration here. Reconnect USB to calibrate.",
        timeout: "No stable signal yet. Check both plant clips and try again.",
        error: "Calibration could not start. Reconnect Biotron and try again."
      }
      this.calibrationState = event?.state || "error"
      this.calibrationMessage = messages[this.calibrationState] || messages.error
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
      betaBuild: process.env.VUE_APP_BIOTRON_PWA_BETA === 'true',
      page_is_inited: false,
      scales: ["Major", "Minor", "Chrom", "Dorian", "Mixolydian",
        "Lydian", "Wholetone", "Minblues", "Majblues", "Minpen",
        "Majpen", "Diminished", "Hirajōshi"],
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
      calibrationState: "idle",
      calibrationMessage: "",
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

.calibration-control {
  display: flex;
  align-items: center;
  gap: .75rem;
  min-height: 44px;
}

.calibration-control__status {
  color: #52606d;
  line-height: 1.35;
}

.calibration-control__status--active::before {
  content: "";
  display: inline-block;
  width: .65rem;
  height: .65rem;
  margin-right: .45rem;
  border-radius: 50%;
  background: #6a5acd;
  animation: calibration-pulse .8s ease-in-out infinite alternate;
}

@keyframes calibration-pulse {
  to { opacity: .35; transform: scale(.72); }
}

@media (max-width: 575.98px) {
  .calibration-control { align-items: stretch; flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .calibration-control__status--active::before { animation: none; }
}

</style>

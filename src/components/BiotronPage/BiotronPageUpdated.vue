<template>
  <LoaderComponent v-if="this.is_loading && !betaBuild" :key="forceRerender"/>
  <div :class="{'biotron-settings-beta': betaBuild}">
    <DeviceTaskNav
        v-if="betaBuild"
        device-name="Biotron"
        active-task="settings"
        play-route="/biotron/play"
        settings-route="/biotron"
    />
    <header :class="{'settings-hero': betaBuild}">
      <small v-if="betaBuild" class="settings-hero__eyebrow">Biotron workspace</small>
      <h1 class="text-center" :aria-label="betaBuild ? 'Settings' : null">{{ betaBuild ? 'Shape your Biotron' : 'Biotron Settings ⚙️' }}</h1>
      <p v-if="betaBuild" class="settings-hero__intro">Connect Biotron, then shape how it listens, plays, and responds.</p>
    </header>
    <div v-if="betaBuild && soundSession.running" class="alert alert-success mx-2 py-2" role="status">
      🔊 Sound stays on while you adjust settings. Touch the plant to hear each change.
      <router-link to="/biotron/play" class="alert-link ms-1">Sound &amp; volume</router-link>
    </div>
    <section :class="{'beta-connect-card': betaBuild}" aria-label="Connect Biotron">
    <DeviceSelector
        ref="deviceSelector"
        regex-name="Biotron"
        @device_changed="handleDeviceChanged"
        @calibration_state="handleCalibrationState"
        @firmware_version="handleFirmwareVersion"
        @firmware_timeout="handleFirmwareTimeout"
        text_label="🔌 Select Device"
        check-versions-flag
        allow-daw-handoff
        class="m-2"
    />
    <div v-if="betaBuild" class="calibration-control mt-3">
      <div class="calibration-control__actions">
        <button
            type="button"
            class="btn btn-outline-primary"
            @click="startCalibration"
            :disabled="!device || calibrationBusy || is_loading || !settingsSnapshotKnown"
        >{{ calibrationBusy ? 'Calibrating…' : 'Calibrate plant again' }}</button>
        <button
            type="button"
            class="btn btn-outline-primary"
            @click="reduceExtraNotes"
            :disabled="!device || calibrationBusy || is_loading || !settingsSnapshotKnown"
        >Reduce extra notes</button>
      </div>
      <span
          v-if="calibrationMessage"
          class="calibration-control__status"
          :class="{'calibration-control__status--active': calibrationBusy}"
          role="status"
          aria-live="polite"
      >{{ calibrationMessage }}</span>
    </div>
    <div v-if="betaBuild && settingsMessage" class="settings-feedback alert py-2" :class="[settingsState === 'error' ? 'alert-warning' : 'alert-light', {'settings-feedback--active': ['changed', 'checking', 'saved', 'error'].includes(settingsState)}]" role="status" aria-live="polite">
      <span>{{ settingsMessage }}</span>
      <button v-if="device && settingsState === 'saved'" type="button" class="btn btn-primary btn-sm" @click="releaseForDaw">Done — use in DAW</button>
      <button v-if="device && settingsState === 'error' && !settingsSnapshotKnown" type="button" class="btn btn-outline-primary btn-sm" @click="retrySettingsConnection">Retry settings connection</button>
    </div>
    <div v-if="betaBuild" class="diagnostic-copy mt-2">
      <button type="button" class="btn btn-outline-secondary btn-sm" @click="copyDiagnosticInfo">Copy diagnostics for Andrey</button>
      <small class="d-block mt-1 text-muted">{{ diagnosticMessage || "Copies this build, browser, connection and device state. Nothing is sent automatically." }}</small>
    </div>
    <UpdateFirmwareComponent v-if="betaBuild && firmwareTestEnabled" class="w-100 mt-3" text="Update Firmware" repo="Playtronica/biotron-firmware" :device="device" :current-version="firmwareVersion" version-aware @check_firmware="checkFirmware"/>
    </section>
    <template v-if="!betaBuild || settingsReady">
    <section :class="{'beta-preset-card': betaBuild}" aria-label="Preset and saved settings">
    <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id"  text_label="📂 Preset"/>
    <div :class="betaBuild ? 'preset-actions' : 'row gx-1 mb-5'">
      <div :class="{'col': !betaBuild}">
        <button @click="change_data_loader" :disabled="!this.device || this.is_loading || (betaBuild && !settingsReady)" class="btn btn-primary w-100 h-100">
          {{ betaBuild ? (is_loading ? 'Checking…' : 'Check saved settings') : '❇️ Send to Device' }}
        </button>
      </div>
      <div :class="{'col': !betaBuild}">
        <button @click="this.createPreset" class="btn btn-primary w-100 h-100">💾 Save Preset</button>
      </div>
      <div v-if="!betaBuild" :class="{'col': !betaBuild}">
        <UpdateFirmwareComponent
            class="w-100 h-100"
            text="🔄 Update Firmware"
            repo="Playtronica/biotron-firmware"
            :device="this.device"
            :current-version="firmwareVersion"
            :version-aware="betaBuild"
            @check_firmware="checkFirmware"
        />
      </div>
      <div :class="{'col': !betaBuild}">
        <FileDropArea name="📂 Load Preset" @get_drop="(e) => loadDataFromPreset(e)"/>
      </div>
    </div>
    </section>
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
                description="How long each note plays: 1 = the full beat, 1/2 = half a beat, and 1/64 = a very short note."
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
                    command-label="🧍Humanize"
                    description="Varies note velocity between the minimum and maximum values. The minimum value only has an effect while Humanize is on."
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
                    command-label="📡 Input variation (experimental)"
                    :command-object="commands_data.randomness"
                    @input-changed="this.sys_ex_changed"
                    description="Adds a small random 0–9 offset to each new plant-sensor reading before note calculation. It does not increase the sensor's measured sensitivity or control velocity."
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
                description="Shapes how strongly sensor changes move through the note sequence. Start at 50, then compare 25 and 75 over several notes."
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
                    description="Varies light-note velocity between the minimum and maximum values. The minimum value only has an effect while Humanize is on."
                />
              </div>
              <div class="col">
                <SwitchComponent
                    id="light_pitch_mode"
                    command-label="〜 Pitch Bend"
                    :command-object="this.commands_data.light_pitch_mode"
                    @input-changed="this.sys_ex_changed"
                    description="Uses the light sensor to bend plant notes instead of playing separate light notes. Light Range is ignored while this is on."
                />
              </div>
            </div>
            <p class="small mx-2" role="status" aria-live="polite">{{ lightSensorStatus }}</p>

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
                description="How wide the light-sensor melody can move around the Home Note. Used only while Pitch Bend is off."
                class="m-2"
            />
          </template>
        </GroupOfCommands>
      </template>
    </BootstrapCollapse>

  </div></template><p v-else class="alert alert-light mx-2" role="status">{{ device ? 'Reading your Biotron settings… Controls unlock when it answers.' : 'Connect Biotron to unlock its settings. Nothing changes until you choose a device.' }}</p>
  </div>
</template>

<script>
import {createSettingsConnectionMethods} from '@/biotron/settingsConnection.mjs'
import {withMidiWriteSession} from "@/assets/js/timing.mjs"

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
import {createListenerScope} from "@/assets/js/ListenerScope.mjs";
import {withPresetFeedback} from "@/assets/js/PresetsIDB.js";
import {soundSessionState, stopPersistentSound, updateSoundSession} from "@/audio/sessionState.mjs";
import {
  applySettingsVector,
  applyCalmerPlay,
  copyBiotronDiagnostic,
  savedSettingsMessage,
  settingsVectorFromCommands,
  settingsVectorsEqual
} from "@/biotron/settingsReadback.mjs";

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
    soundSession() {
      return soundSessionState
    },
    calibrationBusy() {
      return ["starting", "waiting", "measuring"].includes(this.calibrationState)
    },
    settingsReady() { return Boolean(this.device && this.settingsSnapshotKnown) },
    lightSensorStatus() {
      if (!this.settingsReady) return "Light Sensor state unknown until Biotron settings are read."
      const mode = this.commands_data.light_pitch_mode.value
        ? "Pitch Bend mode: light changes plant-note pitch instead of making separate light notes."
        : this.commands_data.light_no_velocity.value
            ? "Light notes are muted; plant notes can still play."
            : "Light notes are enabled."
      if (["changed", "checking"].includes(this.settingsState)) return `${mode} Saving and checking this change…`
      if (this.settingsState === "error") return `${mode} The latest device check failed; this state is not confirmed.`
      return mode
    }
  },
  methods: {
    ...createSettingsConnectionMethods({settingsVectorFromCommands, settingsVectorsEqual, savedSettingsMessage}),
    async copyDiagnosticInfo() {
      this.diagnosticMessage = await copyBiotronDiagnostic(this, process.env.VUE_APP_BUILD_ID || "local-build")
    },
    async handleDeviceChanged(device) {
      this.clearLiveVerification()
      this.settingsLoadId++
      this.device = device
      this.settingsSnapshotKnown = false
      this.firmwareVersion = ""
      if (!device && this.calibrationBusy) {
        this.calibrationState = "error"
        this.calibrationMessage = "Biotron disconnected — reconnect it and try again."
        updateSoundSession({calibrating: false})
      }
      if (!this.betaBuild) return
      if (!device) {
        this.settingsState = "idle"
        this.settingsMessage = ""
        return
      }
      if (!this.page_is_inited) return
      this.settingsState = "connecting"
      this.settingsMessage = "Checking Biotron firmware…"
    },
    async handleFirmwareVersion(event) {
      if (!this.device || event?.outputId !== this.device.id) return
      this.firmwareVersion = event.version
      if (this.betaBuild && !this.settingsSnapshotKnown && ["connecting", "error"].includes(this.settingsState)) {
        await this.loadPersistedSettings(this.device)
      }
    },
    handleFirmwareTimeout(event) {
      if (!this.betaBuild || !this.device || event?.outputId !== this.device.id ||
          this.settingsSnapshotKnown || this.settingsState !== "connecting") return
      this.settingsState = "error"
      this.settingsMessage = "Biotron did not answer the firmware check. Retry the connection; settings stay locked until they are read."
    },
    async retrySettingsConnection() {
      if (!this.betaBuild || !this.device || this.settingsSnapshotKnown) return
      if (this.firmwareVersion) {
        await this.loadPersistedSettings(this.device)
        return
      }
      this.settingsState = "connecting"
      this.settingsMessage = "Checking Biotron firmware…"
      this.$refs.deviceSelector?.requestFirmwareVersion()
    },
    checkFirmware() { this.$refs.deviceSelector?.requestFirmwareVersion() },
    async loadPersistedSettings(device) {
      const loadId = ++this.settingsLoadId
      this.settingsState = "loading"
      this.settingsMessage = "Reading saved settings from Biotron…"
      try {
        const snapshot = await this.readPersistedSettingsWithRetry(device)
        if (this.device !== device || loadId !== this.settingsLoadId) return
        applySettingsVector(this.commands_data, snapshot.values)
        this.settingsSnapshotKnown = true
        this.forceRerender++
        this.settingsState = "loaded"
        this.settingsMessage = "Settings loaded. Changes now apply live and save automatically."
      } catch (error) {
        if (this.device !== device || loadId !== this.settingsLoadId) return
        this.settingsState = "error"
        this.settingsMessage = this.settingsSnapshotKnown
            ? "Saved settings could not be rechecked. Existing controls remain available; retry the check."
            : "Saved settings could not be read. Retry the connection; nothing can be changed until Biotron answers."
      }
    },
    clearLiveVerification() {
      if (this.liveVerifyTimer !== null) clearTimeout(this.liveVerifyTimer)
      this.liveVerifyTimer = null
      this.liveVerifyId++
    },
    releaseForDaw() { this.$refs.deviceSelector?.releaseMidi() },
    startCalibration() {
      if (!this.device || this.calibrationBusy || (this.betaBuild && !this.settingsSnapshotKnown)) return
      this.settingsLoadId++
      if (this.settingsState === "loading") {
        this.settingsState = "idle"
        this.settingsMessage = ""
      }
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
      updateSoundSession({calibrating: this.calibrationBusy})
    },
    async change_data_loader() {
      if (!this.device || this.is_loading || (this.betaBuild && !this.settingsSnapshotKnown)) return
      const device = this.device
      const waitForPendingSave = this.betaBuild && this.settingsState === "changed"
      this.is_loading = true;
      this.settingsState = this.betaBuild ? "checking" : "saving"
      this.settingsMessage = this.betaBuild ? "Checking the saved copy…" : ""
      this.forceRerender++;
      try {
        if (this.betaBuild) {
          this.clearLiveVerification()
          this.settingsLoadId++
          if (waitForPendingSave) {
            await new Promise(resolve => setTimeout(resolve, 1100))
          }
          if (this.device !== device) throw new Error("Biotron disconnected during check.")
          const expected = settingsVectorFromCommands(this.commands_data)
          const snapshot = await this.readPersistedSettingsWithRetry(device, 1)
          if (snapshot.dirty || !settingsVectorsEqual(snapshot.values, expected)) {
            throw new Error("Saved settings did not match the form.")
          }
          this.settingsState = "saved"
          this.settingsMessage = savedSettingsMessage(this.lastChangedSetting)
          return
        }
        await withMidiWriteSession(device, () => this.device, async output => {
          await output.wait(100)
          await this.sendData(output)
          if (!this.betaBuild) {
            await output.wait(100)
            await this.sendDataDeprecated(output)
          }
        })
      } catch (error) {
        if (this.betaBuild) {
          this.settingsState = "error"
          this.settingsMessage = "Live changes still work. The saved copy could not be confirmed — try again."
        }
      } finally {
        this.is_loading = false;
        this.forceRerender++;
      }
    },
    async reduceExtraNotes() {
      if (!this.device || this.is_loading || this.calibrationBusy ||
          (this.betaBuild && !this.settingsSnapshotKnown)) return
      const device = this.device
      this.clearLiveVerification()
      this.settingsLoadId++
      this.lastChangedSetting = "reduceExtraNotes"
      this.settingsState = "changed"
      this.settingsMessage = "Applying a calmer plant response…"
      this.is_loading = true
      try {
        const completed = await applyCalmerPlay(device, () => this.device, this.commands_data)
        await this.patchChanged()
        if (!completed) throw new Error("Biotron disconnected while applying calmer play.")
        this.forceRerender++
        this.patchRerender++
        this.scheduleLiveVerification(device)
      } catch (error) {
        if (this.device !== device) return
        this.settingsState = "error"
        this.settingsMessage = "Biotron did not confirm the calmer setup. Reconnect once; no firmware update is needed."
      } finally {
        this.is_loading = false
      }
    },
    async sendDataDeprecated(output) {
      if (output) {
        output.send([240, 11, 16, 127, 247])
        let extraComp = []

        extraComp.push("plantBpm");
        for (let comm in this.commands_data) {
          if (!extraComp.includes(comm)) {
            this.commands_data[comm].sendToMidi(output, [11])
            await output.wait(100);
          }
        }
        output.send([240, 11, 126, 247]);
        await output.wait(100);
        this.commands_data.plantBpm.sendToMidi(output, [11])
      }
    },

    async sendData(output) {
      if (output) {
        output.send([240, 11, 20, 13, 126, 247]);
        await output.wait(100);
        let extraComp = []

        extraComp.push("plantBpm");
        for (let comm in this.commands_data) {
          if (!extraComp.includes(comm)) {
            this.commands_data[comm].sendToMidi(output)
            await output.wait(100);
          }
        }
        await output.wait(100);
        output.send([240, 11, 20, 13, 126, 247]);
        await output.wait(100);
        this.commands_data.plantBpm.sendToMidi(output)
      }
    },

    saveData() {
      let state = {}
      for (let val of Object.values(this.commands_data)) {
        state[val.name] = val.value
      }

      return withPresetFeedback(this.id, "autosave", () =>
        this.db.updatePatch(localStorage.getItem(this.id), state))
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
      if (this.betaBuild && !this.settingsSnapshotKnown) return
      await this.patchChanged();
      for (let item of JSON.parse(e).commands) {
        this.commands_data[item.name].set_value(item.value);
      }
      await this.saveData();
      this.forceRerender++;
    },
    async patchChanged() {
      let patch_id = parseInt(localStorage.getItem(this.id));

      if (this.patches.find(item => item.id === patch_id).saved) {
        patch_id = await this.db.getUnsavedPatch();
        this.patches = await this.db.getPatch();
        localStorage.setItem(this.id, patch_id);
      }
      await this.saveData();
    },
    async sys_ex_changed(object) {
      if (this.betaBuild && !this.settingsSnapshotKnown) return
      // A user gesture wins over a late startup read; never overwrite the
      // control they just changed with an older snapshot.
      this.settingsLoadId++
      this.lastChangedSetting = object.name
      await this.patchChanged();
      if (this.device) {
        await object.sendToMidi(this.device)
      }
      if (this.betaBuild) {
        this.settingsState = "changed"
        this.settingsMessage = this.device
            ? "Applied live — saving and checking…"
            : "Connect Biotron to apply this setting."
        if (this.device) this.scheduleLiveVerification(this.device)
      }
      this.forceRerender++;
      this.patchRerender++;
    },
  },
  async beforeRouteLeave(to) {
    if (!this.betaBuild || to.path === "/biotron/play" || !soundSessionState.running) return true
    return await stopPersistentSound()
  },
  data() {
    return {
      betaBuild: process.env.VUE_APP_BIOTRON_PWA_BETA === 'true',
      firmwareTestEnabled: process.env.VUE_APP_BIOTRON_FIRMWARE_TEST_ENABLED === 'true',
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
      settingsState: "idle",
      settingsMessage: "",
      settingsSnapshotKnown: false,
      settingsLoadId: 0,
      liveVerifyTimer: null,
      liveVerifyId: 0,
      lastChangedSetting: "",
      firmwareVersion: "",
      diagnosticMessage: "",
      commands_data: Object.fromEntries(BiotronCommandsData),
    }
  },
  async created() {
    if (!localStorage.getItem(this.id)) {
      localStorage.setItem(this.id, "1")
    }

    this.db = new BiotronDb();
    await this.db.ready;

    this.patches = await this.db.getPatch();
    this.patch_id = parseInt(localStorage.getItem(this.id));

    await this.loadData()
    this.forceRerender++;
    this.page_is_inited = true
    if (this.betaBuild && this.device) await this.loadPersistedSettings(this.device)

  },
  mounted() {
    this.listenerScope = createListenerScope()
    this.listenerScope.on(document, 'keyup', event => {
      if (event.code === 'Enter' && !this.is_loading) this.change_data_loader();
    })
    this.listenerScope.on(document, 'PatchChanged', async () => {
      await this.loadData();
      this.forceRerender++;
    })
    this.listenerScope.on(document, "PatchSave", async (ev) => {
      await withPresetFeedback(this.id, "save", async () => {
        await this.db.savePatch(localStorage.getItem(this.id), ev.detail)
        this.patches = await this.db.getPatch()
        this.patchRerender++;
      })
    })
    this.listenerScope.on(document, 'PatchDelete', async () => {
      await withPresetFeedback(this.id, "delete", async () => {
        await this.db.deletePatch(parseInt(localStorage.getItem(this.id)))
        localStorage.setItem(this.id, "1")
        this.patches = await this.db.getPatch()
        await this.loadData();
        this.forceRerender++;
      })
    })
  },
  beforeUnmount() {
    this.clearLiveVerification()
    updateSoundSession({calibrating: false})
    this.settingsLoadId++
    this.device = null
    this.listenerScope?.clear()
  }
}
</script>
<style scoped src="./BiotronPageUpdated.css"></style>

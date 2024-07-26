<template>
  <div v-if="this.is_loading" id="loader_div" style="position: fixed;
   z-index: 10; width: 100%; height: 100%; background-color: rgba(59,54,54,0.4);
    top: 0;
    left: 0;">

    <h1 style="transform: translate(0, 50vh); color: #0d6efd; font-weight: bold; text-shadow: 0px 0px 6px #fff;">
      Loading...
    </h1>

  </div>
    <h1 class="text-center">TouchMe change settings</h1>
    <DeviceSelector regex-name="TouchMe" @device_changed="(x) => {this.device = x} "/>
  <PatchSelector :patches="this.patches" :key="this.forceRerender + this.patchRerender" :page_id="this.id"/>
    <GroupOfCommands name-of-group="Scale">
      <template v-slot:objects>
        <SelectCommand :key="this.forceRerender" :list-of-variants="this.scales" :command-object="this.touch_me_commands_data.Scale"/>
      </template>
      <template v-slot:description>
        <p>Scale - scale played from the device</p>
      </template>
    </GroupOfCommands>

    <GroupOfCommands name-of-group="Key">
      <template v-slot:objects v-if="!this.touch_me_commands_data.customRange.value">
        <SliderCommand command-label="" :key="this.forceRerender" :command-object="this.touch_me_commands_data.Key"/>
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
            <SwitchComponent id="humanizeSwitch" :model-value="this.touch_me_commands_data.humanize" @update:model-value="newVal => {
                  this.isHumanize = newVal
                  forceRerender++
                }"/>
          </div>
          <div class="col">
            <label for="velocityDisableSwitch">Mute</label>
            <SwitchComponent id="velocityDisableSwitch" :model-value="this.touch_me_commands_data.mute" @update:model-value="newVal => {
                  this.isMute = newVal
                }"/>
          </div>
        </div>
        <div v-if="!this.touch_me_commands_data.mute.value">
          <div v-if="!this.touch_me_commands_data.humanize.value">
            <SliderCommand :key="this.forceRerender"
                           :command-object="this.touch_me_commands_data.maxVelocity"/>
          </div>
          <div v-else>
            <SliderRangeCommand :key="this.forceRerender"
                                :max-command-object="this.touch_me_commands_data.maxVelocity"
                                :min-command-object="this.touch_me_commands_data.minVelocity"/>
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
            <SwitchComponent id="notesRangeSwitch" :model-value="this.touch_me_commands_data.customRange" @update:model-value="newVal => {
                    this.customRange = newVal
                    forceRerender++
                  }"/>
          </div>
        </div>
        <div v-if="this.touch_me_commands_data.customRange.value">
          <SliderRangeCommand :key="this.forceRerender"
                              :max-command-object="this.touch_me_commands_data.highestNote"
                              :min-command-object="this.touch_me_commands_data.lowestNote"/>
        </div>
      </template>
      <template v-slot:description>
        <p>Notes Range - Range of playable notes</p>
      </template>
    </GroupOfCommands>

    <button @mouseup="change_data_loader" :disabled="this.device == null" class="btn btn-primary mb-1" style="width: 70%">Send</button>
    <button @click="this.createPreset" class="btn btn-primary mb-1" style="width: 70%">Create Preset</button>
  <button data-bs-toggle="modal" data-bs-target="#UpdateConf" class="btn btn-primary mb-1" style="width: 70%">Update Firmware</button>

  <div class="modal fade" id="UpdateConf" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Update Firmware</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>
            After clicking on "Update", you will get a file with the .uf2 extension and the device will switch to boot mode.
            The device will be displayed as removable media (like a USB flash drive).
            You should transfer the resulting .uf2 file to the removable media that appeared.
          </p>
          <h6 style="color: red">ATTENTION</h6>
          <p>The device won't work until you move the file.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click="this.updateFirmware">Update</button>
        </div>
      </div>
    </div>
  </div>
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

import SelectCommand from "@/components/system/SelectCommand.vue";
import {sleep, SysExCommand} from "@/assets/js/SysExCommand"
// import { saveAs } from '@progress/kendo-file-saver';
import GroupOfCommands from "@/components/system/GroupOfCommands.vue";
import DeviceSelector from "@/components/system/DeviceSelector.vue";
import SliderCommand from "@/components/system/SliderCommand.vue";
import FileDropArea from "@/components/system/FileDropArea.vue";
import {saveAs} from "@progress/kendo-file-saver";
import SwitchComponent from "@/components/system/Switch.vue";
import SliderRangeCommand from "@/components/system/SliderRangeCommand.vue";
import {TouchMeDb} from "@/assets/js/PresetsIDB";
import PatchSelector from "@/components/system/PatchSelector.vue";

export default  {
  components: {
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
    sendData() {
      for (let comm in this.touch_me_commands_data) {
          this.touch_me_commands_data[comm].sendToMidi(this.device)
          sleep(100);
      }
      this.saveData()
    },
    sendDataTest() {
      for (let comm in this.touch_me_commands_data) {
        this.touch_me_commands_data[comm].sendToMidi(this.device, [20, 13])
        sleep(100);
      }
      this.saveData()
    },
    saveData() {
      let state = []
      for (let item in this.touch_me_commands_data) {
        state.push(this.touch_me_commands_data[item].toShortDict())
      }

      this.db.updatePatch(localStorage.getItem(this.id), state)
    },
    async loadData() {
      let preset = await this.db.getPatch(localStorage.getItem(this.id))
      if (!preset) {
        localStorage.setItem(this.id, 1)
        preset = await this.db.getPatch(localStorage.getItem(this.id))
      }

      for (let item of preset.data) {
        this.touch_me_commands_data[item.name].set_value(item.value);
      }

      this.forceRerender++;
    },
    async loadDataFromPreset(e) {
      await this.patchChanged();
      for (let item of JSON.parse(e).commands) {
        this.touch_me_commands_data[item.name].set_value(item.value);
      }
      this.saveData();
      this.forceRerender++;
    },
    createPreset() {
      let state = []
      for (let item in this.touch_me_commands_data) {
        state.push(this.touch_me_commands_data[item].toShortDict())
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
    updateFirmware() {
      fetch("https://api.github.com/repos/Playtronica/touchme-releases/releases/latest", {headers: {
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }})
          .then(response => response.json())
          .then(data => {
            console.log(data)
            window.location.replace(data.assets[0]["browser_download_url"])
          })
      if (!this.device) return;
      this.device.send([240, 11, 127, 247])
      sleep(100)
      this.device.send([240, 11, 20, 13, 127, 247])
    },

  },
  data() {
    return {
      scales: ["Major", "Minor", "Chrom", "Dorian", "Mixolydian",
        "Lydian", "Wholetone", "Minblues", "Majblues", "Minpen",
        "Majpen", "Diminished"],
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
      touch_me_commands_data: {
        "Scale": new SysExCommand( {
          name: "Scale",
          number_command: 0,
          default_value: 0,
          max_value: 11
        }),
        "Key": new SysExCommand( {
          name: "Key",
          number_command: 1,
          default_value: 1,
          min_value: 1,
          max_value: 12
        }),
        "maxVelocity": new SysExCommand( {
          name: "maxVelocity",
          number_command: 2,
          default_value: 70,
          max_value: 127
        }),
        "minVelocity": new SysExCommand( {
          name: "minVelocity",
          number_command: 3,
          default_value: 50,
          max_value: 127
        }),
        "highestNote": new SysExCommand( {
          name: "highestNote",
          number_command: 8,
          default_value: 84,
          max_value: 127
        }),
        "lowestNote": new SysExCommand( {
          name: "lowestNote",
          number_command: 7,
          default_value: 48,
          max_value: 127
        }),
        "customRange": new SysExCommand({
            name: "customRange",
            number_command: 6,
            default_value: 0,
            value: 0
        }),
        "humanize": new SysExCommand({
          name: "humanize",
          number_command: 4,
          default_value: 0,
          value: 0
        }),
        "mute": new SysExCommand({
          name: "mute",
          number_command: 5,
          default_value: 0,
          value: 0
        }),

      }
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

</style>
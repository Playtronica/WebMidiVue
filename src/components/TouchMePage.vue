<template>
    <h1 class="text-center">TouchMe change settings</h1>
    <DeviceSelector regex-name="TouchMe" @device_changed="(x) => {this.device = x} "/>

    <GroupOfCommands name-of-group="Scale">
      <template v-slot:objects>
        <SelectCommand :key="this.forceRerender" :list-of-variants="this.scales" :command-object="this.touch_me_commands_data.Scale"/>
      </template>
    </GroupOfCommands>

    <GroupOfCommands name-of-group="Key">
      <template v-slot:objects>
        <SliderCommand command-label="" :key="this.forceRerender" :command-object="this.touch_me_commands_data.Key"/>
      </template>
    </GroupOfCommands>

    <GroupOfCommands name-of-group="Velocity">
      <template v-slot:objects>
        <div class="row">
          <div class="col">
            <label for="humanizeSwitch">Humanize</label>
            <SwitchComponent id="humanizeSwitch" :model-value="this.isHumanize" @update:model-value="newVal => {
                  this.isHumanize = newVal
                  forceRerender++
                }"/>
          </div>
          <div class="col">
            <label for="velocityDisableSwitch">Mute</label>
            <SwitchComponent id="velocityDisableSwitch" :model-value="this.isMute" @update:model-value="newVal => {
                  this.isMute = newVal
                }"/>
          </div>
        </div>
        <div v-if="!this.isMute">
          <div v-if="!this.isHumanize">
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
    </GroupOfCommands>

    <GroupOfCommands name-of-group="Notes Range">
      <template v-slot:objects>
        <div class="row">
          <div class="col">
            <label for="notesRangeSwitch">Custom Range</label>
            <SwitchComponent id="notesRangeSwitch" :model-value="this.customRange" @update:model-value="newVal => {
                    this.customRange = newVal
                    forceRerender++
                  }"/>
          </div>
        </div>
        <div v-if="this.customRange">
          <SliderRangeCommand :key="this.forceRerender"
                              :max-command-object="this.touch_me_commands_data.highestNote"
                              :min-command-object="this.touch_me_commands_data.lowestNote"/>
        </div>
      </template>
    </GroupOfCommands>

    <button @click="this.sendData" :disabled="this.device == null" class="btn btn-primary mb-1" style="width: 70%">Send</button>
    <button @click="this.returnDefault" class="btn btn-primary mb-1" style="width: 70%">Set Default</button>
    <button @click="this.createPreset" class="btn btn-primary mb-1" style="width: 70%">Create Preset</button>
    <FileDropArea name="Drop Preset Here" @get_drop="(e) => loadDataFromPreset(e)"/>
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

export default  {
  components: {
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
    sendData() {
      this.device.send([240, 11, 5, this.isMute ? 1 : 0, 247])
      this.device.send([240, 11, 4, this.isHumanize ? 1 : 0, 247])
      this.device.send([240, 11, 6, this.customRange ? 0 : 1, 247])
      for (let comm in this.touch_me_commands_data) {
          this.touch_me_commands_data[comm].sendToMidi(this.device)
          sleep(100);
      }
      this.saveData()
    },
    saveData() {
      let state = []
      for (let item in this.touch_me_commands_data) {
        state.push(this.touch_me_commands_data[item].toString())
      }

      let extra = {
        "mute": this.isMute,
        "humanize": this.isHumanize
      }

      let value = {"commands": state, "extra": extra}
      localStorage.setItem(this.id, JSON.stringify(value))
    },
    loadData() {
      if (localStorage.getItem(this.id) === null) this.saveData();

      for (let item of JSON.parse(localStorage.getItem(this.id)).commands) {
        let value = JSON.parse(item)
        this.touch_me_commands_data[value.name].set_value(value.value);
      }

      let extra = JSON.parse(localStorage.getItem(this.id)).extra
      this.isMute = extra.mute
      this.isHumanize = extra.humanize
    },
    returnDefault() {
      this.randomPlantVelocity = false
      this.randomLightVelocity = false
      for (let comm in this.touch_me_commands_data) {
        this.touch_me_commands_data[comm].set_default();
      }
      this.saveData();
      this.forceRerender += 1
      this.device.send([240, 11, 7, 247])
    },
    loadDataFromPreset(e) {
      for (let item of JSON.parse(e).commands) {
        let value = JSON.parse(item)
        this.touch_me_commands_data[value.name].set_value(value.value);
      }
      let extra = JSON.parse(localStorage.getItem(this.id)).extra
      this.isMute = extra.mute
      this.isHumanize = extra.humanize
      this.forceRerender += 1
    },
    createPreset() {
      let state = []
      for (let item in this.touch_me_commands_data) {
        state.push(this.touch_me_commands_data[item].toString())
      }

      let extra = {
        "mute": this.isMute,
        "humanize": this.isHumanize
      }

      let value = {"commands": state, "extra": extra}
      let myFile = new File([JSON.stringify(value)], "touchme_preset.txt",
          {type: "text/plain;charset=utf-8"})
      saveAs(myFile, "touchme_preset.txt");
    },
  },
  data() {
    return {
      scales: ["Major", "Minor", "Chrom", "Dorian", "Mixolydian",
        "Lydian", "Wholetone", "Minblues", "Minpen",
        "Majpen", "Diminished"],
      device: null,
      forceRerender: 0,
      isHumanize: false,
      isMute: false,
      customRange: false,

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
      }
    }
  },
  created() {
    if (localStorage.getItem(this.id) === null) this.saveData();
    else this.loadData();
  },
}
</script>

<style scoped>

</style>
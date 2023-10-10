<template>
  <div @keyup.enter="this.sendData">
    <h1 class="text-center">Biotron change settings</h1>
    <DeviceSelector regex-name="" @device_changed="(x) => {this.device = x} "/>
    <GroupOfCommands name-of-group="BPM">
      <template v-slot:objects>
        <SliderCommand command-label="Plant Bpm" :key="this.forceRerender" :command-object="this.commands_data.plantBpm"/>
        <SliderCommand command-label="Note Off Percent" :key="this.forceRerender" :command-object="this.commands_data.noteOffPercent"/>
        <SliderCommand command-label="Light Bpm" :key="this.forceRerender" :command-object="this.commands_data.lightBpm"/>
      </template>
    </GroupOfCommands>
    <GroupOfCommands name-of-group="Sensitivity (fib)">
      <template v-slot:objects>
        <SliderCommand command-label="Note Distance" :key="this.forceRerender" :command-object="this.commands_data.noteDistance"/>
        <SliderCommand command-label="First Value" :key="this.forceRerender" :command-object="this.commands_data.firstValue"/>
      </template>
    </GroupOfCommands>
    <GroupOfCommands name-of-group="Smoothness">
      <template v-slot:objects>
        <SliderCommand :key="this.forceRerender" :command-object="this.commands_data.smoothness" />
      </template>
    </GroupOfCommands>
    <GroupOfCommands name-of-group="Scale">
      <template v-slot:objects>
        <SelectCommand :key="this.forceRerender" :list-of-variants="this.scales" :command-object="commands_data.scale"/>
      </template>
    </GroupOfCommands>
    <GroupOfCommands name-of-group="Velocity">
      <template v-slot:objects>
        <SliderCommandWithDisable :key="this.forceRerender" command-label="Plant Velocity" :command-object="commands_data.plantVelocity"/>
        <SliderCommandWithDisable :key="this.forceRerender" command-label="Light Velocity" :command-object="commands_data.lightVelocity"/>
      </template>
    </GroupOfCommands>
    <GroupOfCommands name-of-group="Randomness">
      <template v-slot:objects>
        <DisableCommand :key="this.forceRerender" :command-object="commands_data.randomness"/>
      </template>
    </GroupOfCommands>
    <GroupOfCommands name-of-group="Same Note">
      <template v-slot:objects>
        <SliderCommand :key="this.forceRerender" :command-object="commands_data.same_note" />
      </template>
    </GroupOfCommands>
    <GroupOfCommands name-of-group="Light Notes Range">
      <template v-slot:objects>
        <SliderRangeCommand
            :key="this.forceRerender"
            :max-command-object="commands_data.max_range_light_note"
            :min-command-object="commands_data.min_range_light_note"/>
      </template>
    </GroupOfCommands>
    <button @click="this.sendData" class="btn btn-primary mb-1" style="width: 70%">Send</button>
    <button @click="this.returnDefault" class="btn btn-primary mb-1" style="width: 70%">Set Default</button>
    <button @click="this.createPreset" class="btn btn-primary mb-1" style="width: 70%">Create Preset</button>
    <FileDropArea name="Drop Preset Here" @get_drop="(e) => loadDataFromPreset(e)"/>
  </div>
</template>

<script>
import SliderCommand from "@/components/system/SliderCommand.vue";
import GroupOfCommands from "@/components/system/GroupOfCommands.vue";
import SelectCommand from "@/components/system/SelectCommand.vue";
import DeviceSelector from "@/components/system/DeviceSelector.vue";
import SliderCommandWithDisable from "@/components/system/SliderCommandWithDisable.vue";
import { SysExCommand, sleep } from "@/assets/js/SysExCommand"
import DisableCommand from "@/components/system/DisableCommand.vue";
import FileDropArea from "@/components/system/FileDropArea.vue";
import { saveAs } from '@progress/kendo-file-saver';
import SliderRangeCommand from "@/components/system/SliderRangeCommand.vue";

export default  {
  components: {
    SliderRangeCommand,
    FileDropArea,
    DisableCommand, SliderCommandWithDisable, DeviceSelector, SelectCommand, GroupOfCommands, SliderCommand},
  props: {
    id: {
      type: String,
      required: true
    }
  },
  methods: {
    sendData() {
      for (let comm in this.commands_data) {
        this.commands_data[comm].sendToMidi(this.device)
        sleep(10);
      }
      this.saveData();
    },
    saveData() {
      let state = []
      for (let item in this.commands_data) {
        state.push(this.commands_data[item].toString())
      }
      let value = {"commands": state}
      localStorage.setItem(this.id, JSON.stringify(value))
    },
    loadData() {
      if (localStorage.getItem(this.id) === null) this.saveData();

      for (let item of JSON.parse(localStorage.getItem(this.id)).commands) {
        let value = JSON.parse(item)
        this.commands_data[value.name].set_value(value.value);
      }
    },
    returnDefault() {
      for (let comm in this.commands_data) {
        this.commands_data[comm].set_default();
      }
      this.saveData();
      this.forceRerender += 1
      this.device.send([240, 11, 7, 247])
    },
    createPreset() {
      let state = []
      for (let item in this.commands_data) {
        state.push(this.commands_data[item].toString())
      }
      let value = {"commands": state}
      let myFile = new File([JSON.stringify(value)], "params_biotron.txt",
          {type: "text/plain;charset=utf-8"})
      saveAs(myFile, "params_biotron.txt");
    },
    loadDataFromPreset(e) {
      for (let item of JSON.parse(e).commands) {
        let value = JSON.parse(item)
        this.commands_data[value.name].set_value(value.value);
      }
      this.forceRerender += 1
    }
  },
  data() {
    return {
      scales: ["Major", "Minor", "Chrom", "Dorian", "Mixolydian",
        "Lydian", "Wholetone", "Minblues", "Minpen",
        "Majpen", "Diminished"],

      device: null,
      forceRerender: 0,

      commands_data: {
        "plantBpm": new SysExCommand( {
          name: "plantBpm",
          number_command: 0,
          default_value: 60,
          max_value: 1000
        }),
        "lightBpm": new SysExCommand( {
          name: "lightBpm",
          number_command: 9,
          default_value: 4,
          max_value: 30
        }),
        "noteOffPercent": new SysExCommand({
          name: "noteOffPercent",
          number_command: 12,
          default_value: 100,
          max_value: 100
        }),
        "noteDistance": new SysExCommand({
          name: "noteDistance",
          number_command: 1,
          default_value: 50,
          max_value: 100
        }),
        "firstValue": new SysExCommand({
          name: "firstValue",
          number_command: 2,
          default_value: 10,
          max_value: 100
        }),
        "smoothness": new SysExCommand({
          name: "smoothness",
          number_command: 3,
          max_value: 99
        }),
        "scale": new SysExCommand( {
          name: "scale",
          number_command: 4,
          default_value: 0
        }),
        "plantVelocity": new SysExCommand({
          name: "plantVelocity",
          number_command: 5,
          default_value: 127,
          max_value: 127
        }),
        "lightVelocity": new SysExCommand({
          name: "lightVelocity",
          number_command: 6,
          default_value: 127,
          max_value: 127
        }),
        "randomness": new SysExCommand({
          name: "randomness",
          number_command: 10,
          default_value: 0
        }),
        "same_note": new SysExCommand({
          name: "same_note",
          number_command: 11,
          default_value: 0,
          max_value: 10
        }),
        "min_range_light_note": new SysExCommand({
          name: "min_range_light_note",
          number_command: 13,
          default_value: 24,
        }),
        "max_range_light_note": new SysExCommand({
          name: "max_range_light_note",
          number_command: 14,
          default_value: 48,
        }),
      }
    }
  },
  created() {
    if (localStorage.getItem(this.id) === null) this.saveData();
    else this.loadData();

    document.addEventListener( 'keyup', event => {
      if (event.code === 'Enter') this.sendData();
    })

  },
}
</script>

<style scoped>

</style>
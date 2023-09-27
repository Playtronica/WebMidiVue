<template>
  <h1 class="text-center">Biotron change settings</h1>
  <DeviceSelector regex-name="Biotron"/>
  <GroupOfCommands name-of-group="BPM">
    <template v-slot:objects>
      <SliderCommand command-label="Plant Bpm" :max-value="1000"
                     :default-value="this.commands_data.plantBpm.value"
                     @change-value="(n) => this.commands_data.plantBpm.value = n"/>
      <SliderCommand command-label="Note Off Percent" :max-value="100"
                     :default-value="this.commands_data.noteOffPercent.value"
                     @change-value="(n) => this.commands_data.noteOffPercent.value = n"/>
      <SliderCommand command-label="Light Bpm" :max-value="30"
                     :default-value="this.commands_data.lightBpm.value"
                     @change-value="(n) => this.commands_data.plantBpm.value = n"/>
    </template>
  </GroupOfCommands>
  <GroupOfCommands name-of-group="Sensitivity (fib)">
    <template v-slot:objects>
      <SliderCommand command-label="Note Distance" :max-value="100"
                     :default-value="this.commands_data.noteDistance.value"
                     @change-value="(n) => this.commands_data.noteDistance.value = n"/>
      <SliderCommand command-label="First Value" :max-value="100"
                     :default-value="this.commands_data.firstValue.value"
                     @change-value="(n) => this.commands_data.firstValue.value = n"/>
    </template>
  </GroupOfCommands>
  <GroupOfCommands name-of-group="Smoothness">
    <template v-slot:objects>
      <SliderCommand  :max-value="99" />
    </template>
  </GroupOfCommands>
  <GroupOfCommands name-of-group="Scale">
    <template v-slot:objects>
      <SelectCommand :list-of-variants="this.scales"/>
    </template>
  </GroupOfCommands>
  <GroupOfCommands name-of-group="Velocity">
    <template v-slot:objects>
      <SliderCommandWithDisable command-label="Plant Velocity" :max-value="127" :default-value="127"/>
      <SliderCommandWithDisable command-label="Light Velocity" :max-value="127" :default-value="127"/>
    </template>
  </GroupOfCommands>
</template>

<script>
import SliderCommand from "@/components/system/SliderCommand.vue";
import GroupOfCommands from "@/components/system/GroupOfCommands.vue";
import SelectCommand from "@/components/system/SelectCommand.vue";
import DeviceSelector from "@/components/system/DeviceSelector.vue";
import SliderCommandWithDisable from "@/components/system/SliderCommandWithDisable.vue";

export default {
  components: {SliderCommandWithDisable, DeviceSelector, SelectCommand, GroupOfCommands, SliderCommand},
  data() {
    return {
      scales: ["Major", "Minor", "Chrom", "Dorian", "Mixolydian",
        "Lydian", "Wholetone", "Minblues", "Minpen",
        "Majpen", "Diminished"],

      commands_data: {
        "plantBpm": {
          "index": 0,
          "value": 60
        },
        "lightBpm": {
          "index": 1,
          "value": 4
        },
        "noteOffPercent": {
          "index": 2,
          "value": 100
        },
        "noteDistance": {
          "index": 2,
          "value": 100
        },
        "firstValue": {
          "index": 2,
          "value": 100
        },
        "smoothness": {
          "index": 2,
          "value": 100
        }
      }
    }
  },
  watch: {

  },
}
</script>

<style scoped>

</style>
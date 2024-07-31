<script>
import { SysExCommand } from "@/assets/js/SysExCommand"
export default {
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    commandObject: {
      required: true,
      type: SysExCommand
    }
  },
  emits: ["changedValue"],
  data() {
    return {
      Value: 0,
    }
  },
  watch: {
    Value() {
      this.checkLimit()
      this.commandObject.set_value(parseInt(this.Value))
    }
  },
  methods: {
    checkLimit() {
      if (this.Value > this.commandObject.max_value) {
        this.Value = this.commandObject.max_value
      }
      if (this.Value < this.commandObject.min_value) {
        this.Value = this.commandObject.min_value
      }
    },
    changed() {
      document.dispatchEvent(new CustomEvent('InputChanged'))
    }
  },
  created() {
    this.Value = this.commandObject.value;

  }
}
</script>

<template>
  <div class="row m-2">
    <label for="value_input">{{ this.commandLabel }}</label>

    <input type="number" id="value_input" class="form-control"
           v-model="this.Value" :min="this.commandObject.min_value" :max="this.commandObject.max_value"
           @input="this.changed"/>

    <input type="range" id="range_input" class="settings_input"
           v-model="this.Value" :min="this.commandObject.min_value" :max="this.commandObject.max_value"
           :step="this.commandObject.step"
           @input="this.changed"/>
  </div>
</template>

<style scoped>
  .settings_input {
    width: 100%;
  }
</style>
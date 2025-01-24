<script>
import { SysExCommand } from "@/assets/js/SysExCommand"
import {toRaw} from "vue";
export default {
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    commandObject: {
      required: true,
      type: SysExCommand
    },
    tableValues: {
      required: false,
      type: Object
    },
    tableValuesReversed: {
      type: Boolean
    }
  },
  emits: ["changedValue"],
  data() {
    return {
      rawValue: -1,
      maxValue: 0,
      minValue: 0,
      tableTranslate: null
    }
  },
  watch: {
    rawValue() {
      this.checkLimit()
      if (this.tableValues !== undefined) {
        this.commandObject.set_value(parseInt(this.tableTranslate[parseInt(this.rawValue)]))
      }
      else {
        this.commandObject.set_value(parseInt(this.rawValue))
      }
    }
  },
  methods: {
    checkLimit() {
      if (this.rawValue > this.maxValue) {
        this.rawValue = this.maxValue
      }
      if (this.rawValue < this.minValue) {
        this.rawValue = this.minValue
      }
    },
    changed() {
      document.dispatchEvent(new CustomEvent('InputChanged'))
    }
  },
  created() {
    if (this.tableValues !== undefined) {

      this.minValue = 0;
      let temp = toRaw(this.tableValues);
      this.maxValue = Object.keys(temp).length - 1;
      this.tableTranslate = Object.keys(temp);
      if (this.tableValuesReversed) {
        this.tableTranslate = this.tableTranslate.reverse();
      }
      for (let i = 0; i < this.tableTranslate.length; i++) {
        if (parseInt(this.tableTranslate[i]) === this.commandObject.value) {
          this.rawValue = i;
        }
      }
      if (this.rawValue === -1) {
        this.rawValue = 0;
      }

    }
    else {
      this.rawValue = this.commandObject.value;
      this.maxValue = this.commandObject.max_value;
      this.minValue = this.commandObject.min_value;
    }
  }
}
</script>

<template>
  <div class="row m-2">
    <label for="value_input">{{ this.commandLabel }}</label>

    <div v-if="this.tableValues">
      <select v-model="this.rawValue" id="scale" class="form-control" @input="this.changed">
        <option v-for="(value, key) in this.tableTranslate" v-bind:key="key" :value="key">
          {{this.tableValues[parseInt(value)]}}
        </option>
      </select>
    </div>
    <div v-else>
      <input type="number" id="value_input" class="form-control"
             v-model="this.rawValue" :min="this.minValue" :max="this.maxValue"
             @input="this.changed"/>
    </div>


    <input type="range" id="range_input" class="settings_input"
           v-model="this.rawValue" :min="this.minValue" :max="this.maxValue"
           :step="this.commandObject.step"
           @input="this.changed"/>
  </div>
</template>

<style scoped>
  .settings_input {
    width: 100%;
  }
</style>
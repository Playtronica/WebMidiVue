<script>

import {SysExCommand} from "@/assets/js/SysExCommand";
import SwitchComponent from "@/components/system/Switch.vue";

export default {
  components: {SwitchComponent},
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
  data() {
    return {
      Value: 0,
      Checked: true,
      Disabled: false
    }
  },
  methods: {
    checkboxEvent() {
      if (this.Checked) {
        this.Value = this.commandObject.max_value;
        this.Disabled = false;
      }
      else {
        this.Value = this.commandObject.min_value;
        this.Disabled = true;
      }
    },
    checkLimit() {
      if (this.Value > this.commandObject.max_value) {
        this.Value = this.commandObject.max_value
      }
      if (this.Value < this.commandObject.min_value) {
        this.Value = this.commandObject.min_value
      }
    }
  },
  watch: {
    Value() {
      this.commandObject.set_value(this.Value)
      this.checkLimit()
    },
    Checked() {
      this.checkboxEvent()
    }
  },
  mounted() {
    this.Value = this.commandObject.value;
  }
}
</script>

<template>
  <div class="row m-2">
    <div class="row">
      <label for="value_input">{{ this.commandLabel }}</label>
    </div>
    <div class="row">
      <div class="col-9">
        <input type="number" id="value_input" class="form-control"
               v-model="this.Value" :min="this.commandObject.min_value" :max="this.commandObject.max_value"
               :disabled="this.Disabled"/>

        <input type="range" id="range_input" class="settings_input"
               v-model="this.Value" :min="this.commandObject.min_value" :max="this.commandObject.max_value"
               :step="this.commandObject.step"
                :disabled="this.Disabled"/>
      </div>
      <div class="col-3">
        <SwitchComponent :model-value="Checked" @update:model-value="newVal => Checked = newVal"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .settings_input {
    width: 100%;
  }
</style>
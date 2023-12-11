<script>

import SliderRangeCommand from "@/components/system/SliderRangeCommand.vue";
import {SysExCommand} from "@/assets/js/SysExCommand";
import SwitchComponent from "@/components/system/Switch.vue";

export default {
  components: {SwitchComponent, SliderRangeCommand},
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    minCommandObject: {
      required: true,
      type: SysExCommand
    },
    maxCommandObject: {
      required: true,
      type: SysExCommand
    }
  },
  data() {
    return {
      Checked: true,
      key: 1
    }
  },
  watch: {
    Checked() {
      if (this.Checked) {
        this.minCommandObject.set_value(this.minCommandObject.max_value);
        this.maxCommandObject.set_value(this.maxCommandObject.max_value);
        this.Disabled = false;
      }
      else {
        this.minCommandObject.value.set_value(this.minCommandObject.min_value);
        this.maxCommandObject.value.set_value(this.maxCommandObject.min_value);
        this.Disabled = true;
      }
      this.key++
    }
  }
}
</script>

<template>
  <div class="row">
    <div class="col-9">
      <SliderRangeCommand :key = "key"
                          :command-label="commandLabel"
                          :max-command-object="maxCommandObject"
                          :min-command-object="minCommandObject"/>
    </div>
    <div class="col-3">
      <SwitchComponent :model-value="Checked" @update:model-value="newVal => Checked = newVal"/>
    </div>
  </div>
</template>

<style scoped>
.settings_input {
  width: 100%;
}


</style>
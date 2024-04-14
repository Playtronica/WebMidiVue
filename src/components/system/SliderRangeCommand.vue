<script>
import { SysExCommand } from "@/assets/js/SysExCommand"
import MultiRangeSlider from "multi-range-slider-vue";
import "@/../node_modules/multi-range-slider-vue/MultiRangeSliderBarOnly.css"
export default {
  components: {MultiRangeSlider},
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
      minValue: 0,
      maxValue: 0,
    }
  },
  watch: {
    minValue() {
      if (this.minValue < this.minCommandObject.min_value) this.minValue = this.minCommandObject;
      if (this.minValue > this.maxValue) this.minValue = this.maxValue;
      this.minCommandObject.set_value(this.minValue);
    },
    maxValue() {
      if (this.maxValue < this.minValue) this.maxValue = this.minValue;
      if (this.maxValue > this.maxCommandObject.max_value) this.minValue = this.maxCommandObject.max_value;
      this.maxCommandObject.set_value(this.maxValue);
    }
  },
  methods: {
    update_oBarValues(e) {
      this.minValue = e.minValue;
      this.maxValue = e.maxValue;
    },
    changed() {
      document.dispatchEvent(new CustomEvent('InputChanged'))
    }
  },
  mounted() {
    this.minValue = this.minCommandObject.value;
    this.maxValue = this.maxCommandObject.value;
    if (this.minValue > this.maxValue) {
      this.minValue = this.maxValue
    }
  }
}
</script>

<template>
  <div class="row m-2">
    <label for="value_input">{{ this.commandLabel }}</label>
      <div class="row">
        <div class="col">
          <input type="number" id="value_input_min" class="form-control" @input="this.changed"
                 v-model="this.minValue" :min="this.minCommandObject.min_value" :max="this.minCommandObject.max_value" />
        </div>
        -
        <div class="col">
          <input type="number" id="value_input_max" class="form-control" @input="this.changed"
                 v-model="this.maxValue" :min="this.minCommandObject.min_value" :max="this.maxCommandObject.max_value" />
        </div>
      </div>
      <div class="row">
        <MultiRangeSlider
            baseClassName="multi-range-slider-bar-only"
            :minValue="this.minValue"
            :maxValue="this.maxValue"
            :max="this.maxCommandObject.max_value"
            :min="this.minCommandObject.min_value"
            :step="this.minCommandObject.step"
            @input="update_oBarValues"
        />
      </div>

  </div>
</template>

<style scoped>
.settings_input {
  width: 100%;
}


</style>